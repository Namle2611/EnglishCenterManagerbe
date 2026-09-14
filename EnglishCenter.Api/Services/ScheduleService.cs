using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Schedules;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class ScheduleService : IScheduleService
{
    private static readonly TimeSpan MaxTimeOfDay = TimeSpan.FromDays(1);
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IScheduleRepository _scheduleRepository;
    private readonly ILogger<ScheduleService> _logger;

    public ScheduleService(
        AppDbContext context,
        IScheduleRepository scheduleRepository,
        ILogger<ScheduleService> logger)
    {
        _context = context;
        _scheduleRepository = scheduleRepository;
        _logger = logger;
    }

    public async Task<PagedResult<ScheduleListItemResponse>> GetListAsync(ScheduleQuery query, CancellationToken cancellationToken = default)
    {
        return await _scheduleRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<ScheduleDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var scheduleDetail = await _scheduleRepository.GetDetailByIdAsync(id, cancellationToken);
        if (scheduleDetail == null)
        {
            throw new NotFoundException($"Schedule with ID {id} not found.");
        }

        return scheduleDetail;
    }

    public async Task<ScheduleDetailResponse> CreateAsync(CreateScheduleRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.ClassId.HasValue || request.ClassId.Value <= 0)
        {
            throw new ValidationException("ClassId must be greater than 0.");
        }

        if (!request.RoomId.HasValue || request.RoomId.Value <= 0)
        {
            throw new ValidationException("RoomId must be greater than 0.");
        }

        ValidateTimeAndDayOfWeek(request.DayOfWeek, request.StartTime, request.EndTime);

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                // 1. Validate Target Class
                var targetClass = await _scheduleRepository.GetClassByIdAsync(request.ClassId.Value, cancellationToken);
                if (targetClass == null)
                {
                    throw new NotFoundException($"Class with ID {request.ClassId.Value} not found.");
                }

                if (targetClass.Status != ClassStatus.Planned && targetClass.Status != ClassStatus.Ongoing)
                {
                    throw new ValidationException("Không thể xếp lịch cho lớp học đã kết thúc hoặc đã hủy.");
                }

                // 2. Validate Target Room
                var targetRoom = await _scheduleRepository.GetRoomByIdAsync(request.RoomId.Value, cancellationToken);
                if (targetRoom == null)
                {
                    throw new NotFoundException($"Room with ID {request.RoomId.Value} not found.");
                }

                if (targetRoom.Status != RoomStatus.Active)
                {
                    throw new ValidationException("Không thể xếp lịch cho phòng học đang ngừng hoạt động hoặc đang bảo trì.");
                }

                var dayOfWeek = request.DayOfWeek!.Value;
                var startTime = request.StartTime!.Value;
                var endTime = request.EndTime!.Value;

                // 3. Conflict Detection
                // 3a. Room Conflict: same room + same day + overlapping weekly slot + overlapping class date range
                if (await _scheduleRepository.HasRoomConflictAsync(
                    request.RoomId.Value,
                    dayOfWeek,
                    startTime,
                    endTime,
                    targetClass.StartDate,
                    targetClass.EndDate,
                    excludeScheduleId: null,
                    cancellationToken))
                {
                    throw new ConflictException("Phòng học đã có lớp khác xếp lịch trong khung giờ này trong cùng giai đoạn học.");
                }

                // 3b. Class Conflict: same class + same day + overlapping weekly slot
                if (await _scheduleRepository.HasClassConflictAsync(
                    request.ClassId.Value,
                    dayOfWeek,
                    startTime,
                    endTime,
                    excludeScheduleId: null,
                    cancellationToken))
                {
                    throw new ConflictException("Lớp học đã có lịch học khác trong khung giờ này.");
                }

                // 3c. Teacher Conflict: same teacher + same day + overlapping weekly slot + overlapping class date range
                if (targetClass.TeacherId.HasValue)
                {
                    if (await _scheduleRepository.HasTeacherConflictAsync(
                        targetClass.TeacherId.Value,
                        dayOfWeek,
                        startTime,
                        endTime,
                        targetClass.StartDate,
                        targetClass.EndDate,
                        excludeScheduleId: null,
                        cancellationToken))
                    {
                        throw new ConflictException("Giáo viên của lớp đã có lịch dạy lớp khác trong khung giờ này trong cùng giai đoạn học.");
                    }
                }

                // 4. Persistence
                var schedule = new Schedule
                {
                    ClassId = request.ClassId.Value,
                    RoomId = request.RoomId.Value,
                    DayOfWeek = dayOfWeek,
                    StartTime = startTime,
                    EndTime = endTime
                };

                await _scheduleRepository.AddAsync(schedule, cancellationToken);
                await _scheduleRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Schedule ID {ScheduleId} created for Class {ClassId} in Room {RoomId}.", schedule.Id, schedule.ClassId, schedule.RoomId);

                var result = await _scheduleRepository.GetDetailByIdAsync(schedule.Id, cancellationToken);
                return result!;
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Transient concurrency contention on Schedule Create (attempt {Attempt}). Retrying...", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt >= MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Concurrency contention limit reached on Schedule Create after {Attempts} attempts.", attempt + 1);
                throw new ConflictException("Yêu cầu xếp lịch bị xung đột do có thay đổi đồng thời. Vui lòng thử lại.");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw;
            }
        }

        throw new ConflictException("Yêu cầu xếp lịch bị xung đột do có thay đổi đồng thời. Vui lòng thử lại.");
    }

    public async Task<ScheduleDetailResponse> UpdateAsync(int id, UpdateScheduleRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.RoomId.HasValue || request.RoomId.Value <= 0)
        {
            throw new ValidationException("RoomId must be greater than 0.");
        }

        ValidateTimeAndDayOfWeek(request.DayOfWeek, request.StartTime, request.EndTime);

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                // 1. Retrieve Tracked Schedule
                var schedule = await _scheduleRepository.GetByIdTrackedAsync(id, cancellationToken);
                if (schedule == null)
                {
                    throw new NotFoundException($"Schedule with ID {id} not found.");
                }

                // 2. Validate Attached Class (ClassId immutable)
                var targetClass = await _scheduleRepository.GetClassByIdAsync(schedule.ClassId, cancellationToken);
                if (targetClass == null)
                {
                    throw new NotFoundException($"Class with ID {schedule.ClassId} not found.");
                }

                if (targetClass.Status != ClassStatus.Planned && targetClass.Status != ClassStatus.Ongoing)
                {
                    throw new ValidationException("Không thể xếp lịch cho lớp học đã kết thúc hoặc đã hủy.");
                }

                // 3. Validate Target Room
                var targetRoom = await _scheduleRepository.GetRoomByIdAsync(request.RoomId.Value, cancellationToken);
                if (targetRoom == null)
                {
                    throw new NotFoundException($"Room with ID {request.RoomId.Value} not found.");
                }

                if (targetRoom.Status != RoomStatus.Active)
                {
                    throw new ValidationException("Không thể xếp lịch cho phòng học đang ngừng hoạt động hoặc đang bảo trì.");
                }

                var dayOfWeek = request.DayOfWeek!.Value;
                var startTime = request.StartTime!.Value;
                var endTime = request.EndTime!.Value;

                // 4. Conflict Detection with Self-Exclusion (excludeScheduleId = id)
                // 4a. Room Conflict
                if (await _scheduleRepository.HasRoomConflictAsync(
                    request.RoomId.Value,
                    dayOfWeek,
                    startTime,
                    endTime,
                    targetClass.StartDate,
                    targetClass.EndDate,
                    excludeScheduleId: id,
                    cancellationToken))
                {
                    throw new ConflictException("Phòng học đã có lớp khác xếp lịch trong khung giờ này trong cùng giai đoạn học.");
                }

                // 4b. Class Conflict
                if (await _scheduleRepository.HasClassConflictAsync(
                    schedule.ClassId,
                    dayOfWeek,
                    startTime,
                    endTime,
                    excludeScheduleId: id,
                    cancellationToken))
                {
                    throw new ConflictException("Lớp học đã có lịch học khác trong khung giờ này.");
                }

                // 4c. Teacher Conflict
                if (targetClass.TeacherId.HasValue)
                {
                    if (await _scheduleRepository.HasTeacherConflictAsync(
                        targetClass.TeacherId.Value,
                        dayOfWeek,
                        startTime,
                        endTime,
                        targetClass.StartDate,
                        targetClass.EndDate,
                        excludeScheduleId: id,
                        cancellationToken))
                    {
                        throw new ConflictException("Giáo viên của lớp đã có lịch dạy lớp khác trong khung giờ này trong cùng giai đoạn học.");
                    }
                }

                // 5. Update Entity
                schedule.RoomId = request.RoomId.Value;
                schedule.DayOfWeek = dayOfWeek;
                schedule.StartTime = startTime;
                schedule.EndTime = endTime;

                await _scheduleRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Schedule ID {ScheduleId} updated successfully.", id);

                var result = await _scheduleRepository.GetDetailByIdAsync(id, cancellationToken);
                return result!;
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Transient concurrency contention on Schedule Update (attempt {Attempt}). Retrying...", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt >= MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Concurrency contention limit reached on Schedule Update after {Attempts} attempts.", attempt + 1);
                throw new ConflictException("Yêu cầu cập nhật lịch bị xung đột do có thay đổi đồng thời. Vui lòng thử lại.");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw;
            }
        }

        throw new ConflictException("Yêu cầu cập nhật lịch bị xung đột do có thay đổi đồng thời. Vui lòng thử lại.");
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var schedule = await _scheduleRepository.GetByIdTrackedAsync(id, cancellationToken);
        if (schedule == null)
        {
            throw new NotFoundException($"Schedule with ID {id} not found.");
        }

        _scheduleRepository.Remove(schedule);
        await _scheduleRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Schedule ID {ScheduleId} deleted successfully.", id);
    }

    private static void ValidateTimeAndDayOfWeek(int? dayOfWeek, TimeSpan? startTime, TimeSpan? endTime)
    {
        if (!dayOfWeek.HasValue || dayOfWeek.Value < 1 || dayOfWeek.Value > 7)
        {
            throw new ValidationException("DayOfWeek must be between 1 and 7.");
        }

        if (!startTime.HasValue)
        {
            throw new ValidationException("StartTime is required.");
        }

        if (!endTime.HasValue)
        {
            throw new ValidationException("EndTime is required.");
        }

        if (endTime.Value <= startTime.Value)
        {
            throw new ValidationException("EndTime must be greater than StartTime.");
        }

        if (startTime.Value < TimeSpan.Zero || endTime.Value >= MaxTimeOfDay)
        {
            throw new ValidationException("Time must be within a single day (00:00:00 to 23:59:59).");
        }
    }

    private static bool IsTransientConflict(Exception? ex)
    {
        while (ex != null)
        {
            if (ex is Microsoft.Data.SqlClient.SqlException sqlEx)
            {
                return sqlEx.Number == 1205 || sqlEx.Number == 1222;
            }
            ex = ex.InnerException;
        }
        return false;
    }
}
