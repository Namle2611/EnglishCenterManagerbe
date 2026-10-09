using System.Data;
using System.Text.RegularExpressions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Auth;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Registration;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EnglishCenter.Api.Services;

public class RegistrationService : IRegistrationService
{
    private readonly AppDbContext _context;
    private readonly IRegistrationRequestRepository _registrationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOtpService _otpService;
    private readonly IEmailService _emailService;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly ILogger<RegistrationService> _logger;

    public RegistrationService(
        AppDbContext context,
        IRegistrationRequestRepository registrationRepository,
        IUserRepository userRepository,
        IOtpService otpService,
        IEmailService emailService,
        IPasswordHasherService passwordHasher,
        ILogger<RegistrationService> logger)
    {
        _context = context;
        _registrationRepository = registrationRepository;
        _userRepository = userRepository;
        _otpService = otpService;
        _emailService = emailService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<ApiResponse<RegisterResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return ApiResponse<RegisterResponse>.Fail("Dữ liệu đăng ký không hợp lệ.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var requestedRole = request.RequestedRole?.Trim().ToUpperInvariant();

        // 1. Role validation: Only Student, Teacher, Staff allowed publicly
        if (string.IsNullOrWhiteSpace(requestedRole) ||
            (requestedRole != RoleNames.Student &&
             requestedRole != RoleNames.Teacher &&
             requestedRole != RoleNames.Staff))
        {
            return ApiResponse<RegisterResponse>.Fail("Vai trò yêu cầu không hợp lệ. Quản trị viên không thể đăng ký công khai.");
        }

        // 2. Validate password
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
        {
            return ApiResponse<RegisterResponse>.Fail("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
        }

        // 3. Domain validation for Teacher
        if (requestedRole == RoleNames.Teacher)
        {
            if (string.IsNullOrWhiteSpace(request.Specialization))
            {
                return ApiResponse<RegisterResponse>.Fail("Chuyên môn là bắt buộc đối với giáo viên.");
            }
            if (request.ExperienceYears.HasValue && request.ExperienceYears.Value < 0)
            {
                return ApiResponse<RegisterResponse>.Fail("Số năm kinh nghiệm không thể âm.");
            }
        }

        // 4. Check if active user already exists
        if (await _userRepository.EmailExistsAsync(normalizedEmail, cancellationToken))
        {
            return ApiResponse<RegisterResponse>.Fail("Địa chỉ email này đã được sử dụng trong hệ thống.");
        }

        // 5. Check existing registration request
        var existing = await _registrationRepository.GetActiveByEmailAsync(normalizedEmail, cancellationToken);
        if (existing != null)
        {
            if (existing.Status == RegistrationStatus.Completed)
            {
                return ApiResponse<RegisterResponse>.Fail("Địa chỉ email này đã hoàn tất đăng ký.");
            }
            if (existing.Status == RegistrationStatus.PendingApproval)
            {
                return ApiResponse<RegisterResponse>.Fail("Yêu cầu đăng ký của bạn đang chờ quản trị viên phê duyệt.");
            }
        }

        // 6. Generate Password Hash & NEW 6-digit OTP
        var dummyUser = new User { Email = normalizedEmail };
        var passwordHash = _passwordHasher.HashPassword(dummyUser, request.Password);
        var newOtp = _otpService.GenerateOtp(normalizedEmail, existing?.OtpHash);
        var otpHash = _otpService.HashOtp(normalizedEmail, newOtp);

        if (existing != null)
        {
            // Update existing pending/rejected request
            existing.Email = request.Email.Trim();
            existing.NormalizedEmail = normalizedEmail;
            existing.FullName = request.FullName.Trim();
            existing.PasswordHash = passwordHash;
            existing.Phone = request.Phone?.Trim();
            existing.RequestedRole = requestedRole;
            existing.Status = RegistrationStatus.PendingEmailVerification;
            existing.EmailVerifiedAt = null;
            existing.OtpHash = otpHash;
            existing.OtpExpiresAt = DateTime.UtcNow.AddMinutes(5);
            existing.OtpAttemptCount = 0;
            existing.OtpSentAt = DateTime.UtcNow;
            existing.Specialization = request.Specialization?.Trim();
            existing.Qualification = request.Qualification?.Trim();
            existing.ExperienceYears = request.ExperienceYears;
            existing.DateOfBirth = request.DateOfBirth;
            existing.Gender = request.Gender?.Trim();
            existing.Address = request.Address?.Trim();
            existing.UpdatedAt = DateTime.UtcNow;
            existing.RejectionReason = null;

            await _registrationRepository.UpdateAsync(existing, cancellationToken);
        }
        else
        {
            var newRequest = new AccountRegistrationRequest
            {
                Email = request.Email.Trim(),
                NormalizedEmail = normalizedEmail,
                FullName = request.FullName.Trim(),
                PasswordHash = passwordHash,
                Phone = request.Phone?.Trim(),
                RequestedRole = requestedRole,
                Status = RegistrationStatus.PendingEmailVerification,
                OtpHash = otpHash,
                OtpExpiresAt = DateTime.UtcNow.AddMinutes(5),
                OtpAttemptCount = 0,
                OtpSentAt = DateTime.UtcNow,
                Specialization = request.Specialization?.Trim(),
                Qualification = request.Qualification?.Trim(),
                ExperienceYears = request.ExperienceYears,
                DateOfBirth = request.DateOfBirth,
                Gender = request.Gender?.Trim(),
                Address = request.Address?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _registrationRepository.AddAsync(newRequest, cancellationToken);
        }

        await _registrationRepository.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Registration request created/updated for email {Email} with role {Role}", normalizedEmail, requestedRole);

        // 7. Send OTP Email
        try
        {
            await _emailService.SendOtpEmailAsync(request.Email.Trim(), request.FullName.Trim(), newOtp, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email for {Email}", normalizedEmail);
            return ApiResponse<RegisterResponse>.Fail("Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }

        var response = new RegisterResponse
        {
            Email = normalizedEmail,
            RequestedRole = requestedRole,
            Status = nameof(RegistrationStatus.PendingEmailVerification),
            Message = "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực."
        };

        return ApiResponse<RegisterResponse>.Ok(response, "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.");
    }

    public async Task<ApiResponse<VerifyOtpResponse>> VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return ApiResponse<VerifyOtpResponse>.Fail("Dữ liệu xác thực không hợp lệ.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var reg = await _registrationRepository.GetPendingByEmailAsync(normalizedEmail, cancellationToken);
        if (reg == null)
        {
            return ApiResponse<VerifyOtpResponse>.Fail("Không tìm thấy yêu cầu đăng ký hợp lệ hoặc email đã được xác thực.");
        }

        if (reg.OtpExpiresAt == null || DateTime.UtcNow > reg.OtpExpiresAt.Value)
        {
            return ApiResponse<VerifyOtpResponse>.Fail("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
        }

        if (reg.OtpAttemptCount >= 5)
        {
            return ApiResponse<VerifyOtpResponse>.Fail("Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.");
        }

        var isOtpValid = _otpService.VerifyOtp(normalizedEmail, request.Otp.Trim(), reg.OtpHash ?? string.Empty);
        if (!isOtpValid)
        {
            reg.OtpAttemptCount++;
            reg.UpdatedAt = DateTime.UtcNow;
            await _registrationRepository.SaveChangesAsync(cancellationToken);

            var remaining = 5 - reg.OtpAttemptCount;
            if (remaining > 0)
            {
                return ApiResponse<VerifyOtpResponse>.Fail($"Mã OTP không chính xác. Bạn còn {remaining} lần thử.");
            }
            return ApiResponse<VerifyOtpResponse>.Fail("Bạn đã nhập sai mã OTP quá 5 lần. Mã hiện tại đã bị vô hiệu hóa, vui lòng yêu cầu mã mới.");
        }

        // OTP verified successfully!
        reg.EmailVerifiedAt = DateTime.UtcNow;
        reg.OtpHash = null; // Invalidate OTP immediately so it cannot be reused
        reg.UpdatedAt = DateTime.UtcNow;

        if (reg.RequestedRole == RoleNames.Student)
        {
            // Atomically create User + UserRole + Student record
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ApiResponse<VerifyOtpResponse>.Fail("Tài khoản với email này đã tồn tại.");
                }

                var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Student, cancellationToken);
                if (studentRole == null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw new InvalidOperationException("Vai trò STUDENT chưa được định cấu hình trong hệ thống.");
                }

                var studentCode = await GenerateNextStudentCodeAsync(cancellationToken);

                if (string.IsNullOrWhiteSpace(reg.PasswordHash))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ApiResponse<VerifyOtpResponse>.Fail("Thông tin bảo mật của yêu cầu không còn khả dụng hoặc đã được xử lý.");
                }

                var user = new User
                {
                    Email = normalizedEmail,
                    FullName = reg.FullName,
                    PasswordHash = reg.PasswordHash,
                    Phone = reg.Phone,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);

                var userRole = new UserRole
                {
                    User = user,
                    Role = studentRole
                };
                _context.UserRoles.Add(userRole);

                var student = new Student
                {
                    User = user,
                    StudentCode = studentCode,
                    DateOfBirth = reg.DateOfBirth,
                    Gender = reg.Gender,
                    Address = reg.Address,
                    EnrollmentDate = DateTime.UtcNow,
                    Status = StudentStatus.Active
                };
                _context.Students.Add(student);

                reg.Status = RegistrationStatus.Completed;
                reg.PasswordHash = null;
                reg.OtpHash = null;
                reg.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Student account created successfully for {Email} with code {StudentCode}", normalizedEmail, studentCode);

                return ApiResponse<VerifyOtpResponse>.Ok(new VerifyOtpResponse
                {
                    IsPendingApproval = false,
                    Message = "Xác thực email thành công. Tài khoản học viên đã được kích hoạt."
                }, "Xác thực email thành công. Tài khoản học viên đã được kích hoạt.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Failed to create Student account for {Email}", normalizedEmail);
                throw;
            }
        }
        else
        {
            // Teacher / Staff requires Admin approval
            reg.Status = RegistrationStatus.PendingApproval;
            await _registrationRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Registration request for {Email} with role {Role} moved to PendingApproval", normalizedEmail, reg.RequestedRole);

            return ApiResponse<VerifyOtpResponse>.Ok(new VerifyOtpResponse
            {
                IsPendingApproval = true,
                Message = "Email đã được xác thực. Yêu cầu đăng ký của bạn đang chờ quản trị viên phê duyệt."
            }, "Email đã được xác thực. Yêu cầu đăng ký của bạn đang chờ quản trị viên phê duyệt.");
        }
    }

    public async Task<ApiResponse> ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return ApiResponse.Fail("Dữ liệu không hợp lệ.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var reg = await _registrationRepository.GetActiveByEmailAsync(normalizedEmail, cancellationToken);
        if (reg == null)
        {
            return ApiResponse.Fail("Không tìm thấy yêu cầu đăng ký cho email này.");
        }

        if (reg.Status == RegistrationStatus.Completed)
        {
            return ApiResponse.Fail("Tài khoản đã hoàn tất đăng ký, không thể gửi lại mã OTP.");
        }

        if (reg.Status == RegistrationStatus.PendingApproval)
        {
            return ApiResponse.Fail("Email đã được xác thực và yêu cầu đang chờ duyệt, không thể gửi lại mã OTP.");
        }

        if (reg.Status != RegistrationStatus.PendingEmailVerification)
        {
            return ApiResponse.Fail("Không tìm thấy yêu cầu đăng ký đang chờ xác thực email.");
        }

        // Cooldown check: 60 seconds
        if (reg.OtpSentAt.HasValue)
        {
            var elapsed = (DateTime.UtcNow - reg.OtpSentAt.Value).TotalSeconds;
            if (elapsed < 60)
            {
                var waitSec = (int)Math.Ceiling(60 - elapsed);
                return ApiResponse.Fail($"Vui lòng đợi {waitSec} giây trước khi yêu cầu gửi lại mã.");
            }
        }

        // Generate NEW OTP different from current active OTP
        var newOtp = _otpService.GenerateOtp(normalizedEmail, reg.OtpHash);
        var newHash = _otpService.HashOtp(normalizedEmail, newOtp);

        reg.OtpHash = newHash;
        reg.OtpAttemptCount = 0;
        reg.OtpExpiresAt = DateTime.UtcNow.AddMinutes(5);
        reg.OtpSentAt = DateTime.UtcNow;
        reg.UpdatedAt = DateTime.UtcNow;

        await _registrationRepository.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailService.SendOtpEmailAsync(reg.Email, reg.FullName, newOtp, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend OTP email for {Email}", normalizedEmail);
            return ApiResponse.Fail("Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }

        _logger.LogInformation("Resent new OTP email to {Email}", normalizedEmail);
        return ApiResponse.Ok("Mã OTP mới đã được gửi tới email của bạn.");
    }

    public async Task<ApiResponse<PagedResult<RegistrationRequestDto>>> GetAdminRequestsAsync(RegistrationRequestQuery query, CancellationToken cancellationToken = default)
    {
        var result = await _registrationRepository.GetPagedAsync(query, cancellationToken);
        return ApiResponse<PagedResult<RegistrationRequestDto>>.Ok(result);
    }

    public async Task<ApiResponse> ApproveRequestAsync(int id, int adminUserId, ApproveRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        var reg = await _registrationRepository.GetByIdAsync(id, cancellationToken);
        if (reg == null)
        {
            return ApiResponse.Fail("Không tìm thấy yêu cầu đăng ký.");
        }

        if (reg.Status != RegistrationStatus.PendingApproval)
        {
            return ApiResponse.Fail($"Yêu cầu này không ở trạng thái chờ duyệt (trạng thái hiện tại: {reg.Status}).");
        }

        if (reg.EmailVerifiedAt == null)
        {
            return ApiResponse.Fail("Email chưa được xác thực.");
        }

        if (await _userRepository.EmailExistsAsync(reg.NormalizedEmail, cancellationToken))
        {
            return ApiResponse.Fail("Tài khoản với email này đã tồn tại trong hệ thống.");
        }

        // For Teacher: TeacherCode and HireDate are required
        if (reg.RequestedRole == RoleNames.Teacher)
        {
            if (string.IsNullOrWhiteSpace(request.TeacherCode))
            {
                return ApiResponse.Fail("Mã giáo viên là bắt buộc khi phê duyệt tài khoản giáo viên.");
            }

            var trimmedCode = request.TeacherCode.Trim();
            if (trimmedCode.Length > 20)
            {
                return ApiResponse.Fail("Mã giáo viên không được vượt quá 20 ký tự.");
            }

            if (await _context.Teachers.AnyAsync(t => t.TeacherCode == trimmedCode, cancellationToken))
            {
                return ApiResponse.Fail($"Mã giáo viên '{trimmedCode}' đã tồn tại trong hệ thống.");
            }

            if (!request.HireDate.HasValue)
            {
                return ApiResponse.Fail("Ngày bắt đầu công tác là bắt buộc khi phê duyệt tài khoản giáo viên.");
            }

            if (request.HireDate.Value.Date > DateTime.UtcNow.Date)
            {
                return ApiResponse.Fail("Ngày bắt đầu công tác không thể ở tương lai.");
            }
        }

        // Transactional account creation with concurrency guard
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            // Re-read status inside serializable transaction to prevent race conditions / double approval
            var currentStatus = await _context.AccountRegistrationRequests
                .Where(r => r.Id == id)
                .Select(r => r.Status)
                .FirstOrDefaultAsync(cancellationToken);

            if (currentStatus != RegistrationStatus.PendingApproval)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ApiResponse.Fail("Yêu cầu này đã được xử lý bởi quản trị viên khác.");
            }

            if (string.IsNullOrWhiteSpace(reg.PasswordHash))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ApiResponse.Fail("Thông tin bảo mật của yêu cầu không còn khả dụng hoặc đã được phê duyệt.");
            }

            var user = new User
            {
                Email = reg.NormalizedEmail,
                FullName = reg.FullName,
                PasswordHash = reg.PasswordHash,
                Phone = reg.Phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            if (reg.RequestedRole == RoleNames.Teacher)
            {
                var teacherRole = await _context.Roles.FirstAsync(r => r.Name == RoleNames.Teacher, cancellationToken);
                _context.UserRoles.Add(new UserRole { User = user, Role = teacherRole });

                var teacher = new Teacher
                {
                    User = user,
                    TeacherCode = request.TeacherCode!.Trim(),
                    Specialization = reg.Specialization ?? "Tiếng Anh",
                    Qualification = reg.Qualification,
                    ExperienceYears = reg.ExperienceYears ?? 0,
                    HireDate = request.HireDate!.Value.Date,
                    Status = TeacherStatus.Active
                };
                _context.Teachers.Add(teacher);
            }
            else if (reg.RequestedRole == RoleNames.Staff)
            {
                var staffRole = await _context.Roles.FirstAsync(r => r.Name == RoleNames.Staff, cancellationToken);
                _context.UserRoles.Add(new UserRole { User = user, Role = staffRole });
            }

            reg.Status = RegistrationStatus.Completed;
            reg.PasswordHash = null;
            reg.OtpHash = null;
            reg.ReviewedByUserId = adminUserId;
            reg.ReviewedAt = DateTime.UtcNow;
            reg.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Admin {AdminId} approved registration {RegId} for {Email} ({Role})", adminUserId, id, reg.NormalizedEmail, reg.RequestedRole);
            return ApiResponse.Ok($"Phê duyệt thành công. Tài khoản {reg.RequestedRole} đã được kích hoạt.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to approve registration {RegId}", id);
            throw;
        }
    }

    public async Task<ApiResponse> RejectRequestAsync(int id, int adminUserId, RejectRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        var reg = await _registrationRepository.GetByIdAsync(id, cancellationToken);
        if (reg == null)
        {
            return ApiResponse.Fail("Không tìm thấy yêu cầu đăng ký.");
        }

        if (reg.Status != RegistrationStatus.PendingApproval)
        {
            return ApiResponse.Fail($"Yêu cầu này không ở trạng thái chờ duyệt (trạng thái hiện tại: {reg.Status}).");
        }

        reg.Status = RegistrationStatus.Rejected;
        reg.PasswordHash = null;
        reg.OtpHash = null;
        reg.RejectionReason = request.Reason?.Trim();
        reg.ReviewedByUserId = adminUserId;
        reg.ReviewedAt = DateTime.UtcNow;
        reg.UpdatedAt = DateTime.UtcNow;

        await _registrationRepository.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Admin {AdminId} rejected registration {RegId} for {Email}", adminUserId, id, reg.NormalizedEmail);

        return ApiResponse.Ok("Yêu cầu đăng ký đã bị từ chối.");
    }

    private async Task<string> GenerateNextStudentCodeAsync(CancellationToken cancellationToken)
    {
        var existingCodes = await _context.Students
            .Select(s => s.StudentCode)
            .ToListAsync(cancellationToken);

        var maxNumber = 0;
        var regex = new Regex(@"^STU(\d+)$", RegexOptions.IgnoreCase);

        foreach (var code in existingCodes)
        {
            var match = regex.Match(code);
            if (match.Success && int.TryParse(match.Groups[1].Value, out var num))
            {
                if (num > maxNumber)
                {
                    maxNumber = num;
                }
            }
        }

        var nextNum = maxNumber + 1;
        while (true)
        {
            var candidate = $"STU{nextNum:D3}";
            if (!existingCodes.Contains(candidate))
            {
                return candidate;
            }
            nextNum++;
        }
    }
}
