using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Grades;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services;

public class GradeService : IGradeService
{
    private readonly IGradeRepository _gradeRepository;
    private readonly IQuizAttemptService _quizAttemptService;

    public GradeService(
        IGradeRepository gradeRepository,
        IQuizAttemptService quizAttemptService)
    {
        _gradeRepository = gradeRepository;
        _quizAttemptService = quizAttemptService;
    }

    public async Task<ClassGradebookResponse> GetClassGradebookAsync(
        int classId,
        GradeQuery query,
        GradeActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot access management gradebooks.");
        }

        var classEntity = await _gradeRepository.GetClassWithDetailsAsync(classId, cancellationToken);
        if (classEntity == null)
        {
            throw new NotFoundException($"Class with ID {classId} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            if (classEntity.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot view grades for another teacher's class.");
            }
        }

        var utcNow = DateTime.UtcNow;
        var liveQuizMap = await _quizAttemptService.ReconcileClassesStaleAttemptsAsync(new[] { classId }, utcNow, cancellationToken);

        var (rosterStudents, totalCount) = await _gradeRepository.GetPagedClassRosterAsync(classId, query, cancellationToken);
        var assignments = await _gradeRepository.GetAssignmentsByClassIdAsync(classId, cancellationToken);
        var quizzes = await _gradeRepository.GetQuizzesByClassIdAsync(classId, cancellationToken);

        var pagedStudentIds = rosterStudents.Select(cs => cs.StudentId).ToList();

        var submissions = await _gradeRepository.GetSubmissionsByClassAndStudentsAsync(classId, pagedStudentIds, cancellationToken);
        var submissionMap = submissions.ToDictionary(s => (s.StudentId, s.AssignmentId));

        var attempts = await _gradeRepository.GetAttemptsByClassAndStudentsAsync(classId, pagedStudentIds, cancellationToken);
        var attemptMap = attempts
            .GroupBy(a => (a.StudentId, a.QuizId))
            .ToDictionary(g => g.Key, g => g.ToList());

        var reviewUnlockedByQuizId = BuildReviewUnlockMap(quizzes, liveQuizMap, utcNow);

        var rosterItems = new List<GradeStudentRosterItemResponse>();
        foreach (var cs in rosterStudents)
        {
            var studentItems = new List<GradeItemResponse>();

            foreach (var assignment in assignments)
            {
                submissionMap.TryGetValue((cs.StudentId, assignment.Id), out var submission);
                studentItems.Add(ProjectAssignmentItem(assignment, submission, isManagement: true));
            }

            foreach (var quiz in quizzes)
            {
                attemptMap.TryGetValue((cs.StudentId, quiz.Id), out var quizAttempts);
                quizAttempts ??= new List<QuizAttempt>();
                studentItems.Add(ProjectQuizItem(quiz, quizAttempts, isManagement: true, isReviewUnlocked: true));
            }

            var summary = CalculateSummary(studentItems, isManagement: true);

            rosterItems.Add(new GradeStudentRosterItemResponse
            {
                StudentId = cs.StudentId,
                StudentCode = cs.Student.StudentCode,
                StudentName = cs.Student.User.FullName,
                MembershipStatus = cs.Status,
                Summary = summary,
                Items = studentItems
            });
        }

        query.Normalize();
        var pagedResult = new PagedResult<GradeStudentRosterItemResponse>(
            rosterItems,
            totalCount,
            query.Page,
            query.PageSize);

        return new ClassGradebookResponse
        {
            ClassId = classEntity.Id,
            ClassCode = classEntity.ClassCode,
            CourseName = classEntity.Course.CourseName,
            TeacherName = classEntity.Teacher?.User.FullName ?? string.Empty,
            ClassStatus = classEntity.Status,
            Roster = pagedResult
        };
    }

    public async Task<StudentClassGradeDetailResponse> GetStudentClassGradeDetailForManagementAsync(
        int classId,
        int studentId,
        GradeActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot access management grade details.");
        }

        var classEntity = await _gradeRepository.GetClassWithDetailsAsync(classId, cancellationToken);
        if (classEntity == null)
        {
            throw new NotFoundException($"Class with ID {classId} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            if (classEntity.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot view grades for another teacher's class.");
            }
        }

        var classStudent = await _gradeRepository.GetClassStudentAsync(classId, studentId, cancellationToken);
        if (classStudent == null)
        {
            throw new NotFoundException($"Student with ID {studentId} is not enrolled in class {classId}.");
        }

        var utcNow = DateTime.UtcNow;
        var liveQuizMap = await _quizAttemptService.ReconcileClassesStaleAttemptsAsync(new[] { classId }, utcNow, cancellationToken);

        var assignments = await _gradeRepository.GetAssignmentsByClassIdAsync(classId, cancellationToken);
        var quizzes = await _gradeRepository.GetQuizzesByClassIdAsync(classId, cancellationToken);

        var submissions = await _gradeRepository.GetSubmissionsByClassAndStudentsAsync(classId, new[] { studentId }, cancellationToken);
        var submissionMap = submissions.ToDictionary(s => s.AssignmentId);

        var attempts = await _gradeRepository.GetAttemptsByClassAndStudentsAsync(classId, new[] { studentId }, cancellationToken);
        var attemptMap = attempts.GroupBy(a => a.QuizId).ToDictionary(g => g.Key, g => g.ToList());

        var items = new List<GradeItemResponse>();
        foreach (var assignment in assignments)
        {
            submissionMap.TryGetValue(assignment.Id, out var submission);
            items.Add(ProjectAssignmentItem(assignment, submission, isManagement: true));
        }

        foreach (var quiz in quizzes)
        {
            attemptMap.TryGetValue(quiz.Id, out var quizAttempts);
            quizAttempts ??= new List<QuizAttempt>();
            items.Add(ProjectQuizItem(quiz, quizAttempts, isManagement: true, isReviewUnlocked: true));
        }

        var summary = CalculateSummary(items, isManagement: true);

        return new StudentClassGradeDetailResponse
        {
            ClassId = classEntity.Id,
            ClassCode = classEntity.ClassCode,
            CourseName = classEntity.Course.CourseName,
            TeacherName = classEntity.Teacher?.User.FullName ?? string.Empty,
            ClassStatus = classEntity.Status,
            StudentId = classStudent.StudentId,
            StudentCode = classStudent.Student.StudentCode,
            StudentName = classStudent.Student.User.FullName,
            MembershipStatus = classStudent.Status,
            Summary = summary,
            Items = items
        };
    }

    public async Task<List<StudentGradeSummaryResponse>> GetMyGradesAsync(
        GradeActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can access their personal grades.");
        }

        var student = await _gradeRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
        if (student == null)
        {
            throw new ForbiddenException("Student profile not found.");
        }

        var enrolledClasses = await _gradeRepository.GetStudentEnrolledClassesAsync(student.Id, cancellationToken);
        if (enrolledClasses.Count == 0)
        {
            return new List<StudentGradeSummaryResponse>();
        }

        var authorizedClassIds = enrolledClasses.Select(cs => cs.ClassId).Distinct().ToList();
        var utcNow = DateTime.UtcNow;

        var liveQuizMap = await _quizAttemptService.ReconcileClassesStaleAttemptsAsync(authorizedClassIds, utcNow, cancellationToken);

        var assignments = await _gradeRepository.GetAssignmentsByClassIdsAsync(authorizedClassIds, cancellationToken);
        var quizzes = await _gradeRepository.GetQuizzesByClassIdsAsync(authorizedClassIds, cancellationToken);
        var submissions = await _gradeRepository.GetSubmissionsByStudentAndClassesAsync(student.Id, authorizedClassIds, cancellationToken);
        var attempts = await _gradeRepository.GetAttemptsByStudentAndClassesAsync(student.Id, authorizedClassIds, cancellationToken);

        var assignmentsByClass = assignments.GroupBy(a => a.ClassId).ToDictionary(g => g.Key, g => g.ToList());
        var quizzesByClass = quizzes.GroupBy(q => q.ClassId).ToDictionary(g => g.Key, g => g.ToList());
        var submissionsByAssignment = submissions.ToDictionary(s => s.AssignmentId);
        var attemptsByQuiz = attempts.GroupBy(a => a.QuizId).ToDictionary(g => g.Key, g => g.ToList());

        var reviewUnlockedByQuizId = BuildReviewUnlockMap(quizzes, liveQuizMap, utcNow);

        var result = new List<StudentGradeSummaryResponse>();
        foreach (var cs in enrolledClasses)
        {
            var classAssignments = assignmentsByClass.TryGetValue(cs.ClassId, out var cAssignments) ? cAssignments : new List<Assignment>();
            var classQuizzes = quizzesByClass.TryGetValue(cs.ClassId, out var cQuizzes) ? cQuizzes : new List<Quiz>();

            var studentItems = new List<GradeItemResponse>();

            foreach (var assignment in classAssignments)
            {
                submissionsByAssignment.TryGetValue(assignment.Id, out var submission);
                studentItems.Add(ProjectAssignmentItem(assignment, submission, isManagement: false));
            }

            foreach (var quiz in classQuizzes)
            {
                attemptsByQuiz.TryGetValue(quiz.Id, out var quizAttempts);
                quizAttempts ??= new List<QuizAttempt>();
                var isUnlocked = reviewUnlockedByQuizId.TryGetValue(quiz.Id, out var unlocked) && unlocked;
                studentItems.Add(ProjectQuizItem(quiz, quizAttempts, isManagement: false, isReviewUnlocked: isUnlocked));
            }

            var summary = CalculateSummary(studentItems, isManagement: false);

            result.Add(new StudentGradeSummaryResponse
            {
                ClassId = cs.ClassId,
                ClassCode = cs.Class.ClassCode,
                CourseName = cs.Class.Course.CourseName,
                TeacherName = cs.Class.Teacher?.User.FullName ?? string.Empty,
                ClassStatus = cs.Class.Status,
                MembershipStatus = cs.Status,
                Summary = summary
            });
        }

        return result;
    }

    public async Task<StudentClassGradeDetailResponse> GetMyClassGradeDetailAsync(
        int classId,
        GradeActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can access their personal grades.");
        }

        var student = await _gradeRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
        if (student == null)
        {
            throw new ForbiddenException("Student profile not found.");
        }

        var classStudent = await _gradeRepository.GetClassStudentAsync(classId, student.Id, cancellationToken);
        if (classStudent == null)
        {
            throw new ForbiddenException("You are not enrolled in this class.");
        }

        var utcNow = DateTime.UtcNow;
        var liveQuizMap = await _quizAttemptService.ReconcileClassesStaleAttemptsAsync(new[] { classId }, utcNow, cancellationToken);

        var assignments = await _gradeRepository.GetAssignmentsByClassIdAsync(classId, cancellationToken);
        var quizzes = await _gradeRepository.GetQuizzesByClassIdAsync(classId, cancellationToken);

        var submissions = await _gradeRepository.GetSubmissionsByClassAndStudentsAsync(classId, new[] { student.Id }, cancellationToken);
        var submissionMap = submissions.ToDictionary(s => s.AssignmentId);

        var attempts = await _gradeRepository.GetAttemptsByClassAndStudentsAsync(classId, new[] { student.Id }, cancellationToken);
        var attemptMap = attempts.GroupBy(a => a.QuizId).ToDictionary(g => g.Key, g => g.ToList());

        var reviewUnlockedByQuizId = BuildReviewUnlockMap(quizzes, liveQuizMap, utcNow);

        var items = new List<GradeItemResponse>();
        foreach (var assignment in assignments)
        {
            submissionMap.TryGetValue(assignment.Id, out var submission);
            items.Add(ProjectAssignmentItem(assignment, submission, isManagement: false));
        }

        foreach (var quiz in quizzes)
        {
            attemptMap.TryGetValue(quiz.Id, out var quizAttempts);
            quizAttempts ??= new List<QuizAttempt>();
            var isUnlocked = reviewUnlockedByQuizId.TryGetValue(quiz.Id, out var unlocked) && unlocked;
            items.Add(ProjectQuizItem(quiz, quizAttempts, isManagement: false, isReviewUnlocked: isUnlocked));
        }

        var summary = CalculateSummary(items, isManagement: false);

        return new StudentClassGradeDetailResponse
        {
            ClassId = classStudent.ClassId,
            ClassCode = classStudent.Class.ClassCode,
            CourseName = classStudent.Class.Course.CourseName,
            TeacherName = classStudent.Class.Teacher?.User.FullName ?? string.Empty,
            ClassStatus = classStudent.Class.Status,
            StudentId = student.Id,
            StudentCode = student.StudentCode,
            StudentName = student.User.FullName,
            MembershipStatus = classStudent.Status,
            Summary = summary,
            Items = items
        };
    }

    private static Dictionary<int, bool> BuildReviewUnlockMap(
        List<Quiz> quizzes,
        Dictionary<int, HashSet<int>> liveQuizMap,
        DateTime utcNow)
    {
        var map = new Dictionary<int, bool>();
        foreach (var quiz in quizzes)
        {
            if (quiz.EndAt.HasValue && utcNow > quiz.EndAt.Value)
            {
                map[quiz.Id] = true;
            }
            else if (quiz.Status == QuizStatus.Closed)
            {
                var liveIds = liveQuizMap.TryGetValue(quiz.ClassId, out var set) ? set : null;
                map[quiz.Id] = liveIds == null || !liveIds.Contains(quiz.Id);
            }
            else
            {
                map[quiz.Id] = false;
            }
        }
        return map;
    }

    private static GradeItemResponse ProjectAssignmentItem(Assignment assignment, Submission? submission, bool isManagement)
    {
        if (submission == null)
        {
            return new GradeItemResponse
            {
                SourceType = GradeSourceType.Assignment,
                SourceId = assignment.Id,
                SubmissionId = null,
                Title = assignment.Title,
                Status = GradeItemStatus.Missing,
                SourceStatus = "Missing",
                RawScore = null,
                MaxScore = assignment.MaxScore,
                Percentage = null,
                DueDate = assignment.Deadline,
                SubmittedAt = null,
                Feedback = null
            };
        }

        var submissionId = isManagement ? submission.Id : (int?)null;

        if (submission.Score == null)
        {
            return new GradeItemResponse
            {
                SourceType = GradeSourceType.Assignment,
                SourceId = assignment.Id,
                SubmissionId = submissionId,
                Title = assignment.Title,
                Status = GradeItemStatus.Ungraded,
                SourceStatus = "Submitted",
                RawScore = null,
                MaxScore = assignment.MaxScore,
                Percentage = null,
                DueDate = assignment.Deadline,
                SubmittedAt = submission.SubmittedAt,
                Feedback = submission.Feedback
            };
        }

        var percentage = assignment.MaxScore > 0
            ? Math.Round((submission.Score.Value / assignment.MaxScore) * 100m, 2, MidpointRounding.AwayFromZero)
            : (decimal?)null;

        return new GradeItemResponse
        {
            SourceType = GradeSourceType.Assignment,
            SourceId = assignment.Id,
            SubmissionId = submissionId,
            Title = assignment.Title,
            Status = GradeItemStatus.Graded,
            SourceStatus = "Graded",
            RawScore = submission.Score.Value,
            MaxScore = assignment.MaxScore,
            Percentage = percentage,
            DueDate = assignment.Deadline,
            SubmittedAt = submission.SubmittedAt,
            Feedback = submission.Feedback
        };
    }

    private static GradeItemResponse ProjectQuizItem(
        Quiz quiz,
        List<QuizAttempt> attempts,
        bool isManagement,
        bool isReviewUnlocked)
    {
        var maxScore = quiz.Questions.Sum(q => q.Score);

        var bestAttempt = attempts
            .Where(a => a.Status == QuizAttemptStatus.Submitted || a.Status == QuizAttemptStatus.Expired)
            .OrderByDescending(a => a.Score)
            .ThenByDescending(a => a.AttemptNumber)
            .ThenByDescending(a => a.Id)
            .FirstOrDefault();

        if (bestAttempt != null)
        {
            if (isManagement || isReviewUnlocked)
            {
                var rawScore = bestAttempt.Score;
                var percentage = maxScore > 0 && rawScore.HasValue
                    ? Math.Round((rawScore.Value / maxScore) * 100m, 2, MidpointRounding.AwayFromZero)
                    : (decimal?)null;

                return new GradeItemResponse
                {
                    SourceType = GradeSourceType.Quiz,
                    SourceId = quiz.Id,
                    SubmissionId = null,
                    Title = quiz.Title,
                    Status = GradeItemStatus.Graded,
                    SourceStatus = bestAttempt.Status.ToString(),
                    RawScore = rawScore,
                    MaxScore = maxScore,
                    Percentage = percentage,
                    DueDate = quiz.EndAt,
                    SubmittedAt = bestAttempt.SubmittedAt,
                    Feedback = null
                };
            }
            else
            {
                return new GradeItemResponse
                {
                    SourceType = GradeSourceType.Quiz,
                    SourceId = quiz.Id,
                    SubmissionId = null,
                    Title = quiz.Title,
                    Status = GradeItemStatus.Locked,
                    SourceStatus = "Locked",
                    RawScore = null,
                    MaxScore = maxScore,
                    Percentage = null,
                    DueDate = quiz.EndAt,
                    SubmittedAt = bestAttempt.SubmittedAt,
                    Feedback = null
                };
            }
        }

        var hasInProgress = attempts.Any(a => a.Status == QuizAttemptStatus.InProgress);
        if (hasInProgress)
        {
            return new GradeItemResponse
            {
                SourceType = GradeSourceType.Quiz,
                SourceId = quiz.Id,
                SubmissionId = null,
                Title = quiz.Title,
                Status = GradeItemStatus.InProgress,
                SourceStatus = "InProgress",
                RawScore = null,
                MaxScore = maxScore,
                Percentage = null,
                DueDate = quiz.EndAt,
                SubmittedAt = null,
                Feedback = null
            };
        }

        return new GradeItemResponse
        {
            SourceType = GradeSourceType.Quiz,
            SourceId = quiz.Id,
            SubmissionId = null,
            Title = quiz.Title,
            Status = GradeItemStatus.Missing,
            SourceStatus = "Missing",
            RawScore = null,
            MaxScore = maxScore,
            Percentage = null,
            DueDate = quiz.EndAt,
            SubmittedAt = null,
            Feedback = null
        };
    }

    private static GradeReportingSummaryResponse CalculateSummary(List<GradeItemResponse> items, bool isManagement)
    {
        var visibleGradedCount = items.Count(i => i.Status == GradeItemStatus.Graded);

        var pendingCount = isManagement
            ? items.Count(i => i.Status == GradeItemStatus.Missing || i.Status == GradeItemStatus.Ungraded || i.Status == GradeItemStatus.InProgress)
            : items.Count(i => i.Status == GradeItemStatus.Missing || i.Status == GradeItemStatus.Ungraded || i.Status == GradeItemStatus.InProgress || i.Status == GradeItemStatus.Locked);

        var earnedPoints = items.Where(i => i.RawScore.HasValue).Sum(i => i.RawScore!.Value);
        var possiblePoints = items.Where(i => i.RawScore.HasValue).Sum(i => i.MaxScore);

        decimal? percentage = possiblePoints > 0
            ? Math.Round((earnedPoints / possiblePoints) * 100m, 2, MidpointRounding.AwayFromZero)
            : null;

        return new GradeReportingSummaryResponse
        {
            VisibleGradedItemCount = visibleGradedCount,
            PendingItemCount = pendingCount,
            VisibleEarnedPoints = earnedPoints,
            VisiblePossiblePoints = possiblePoints,
            VisiblePercentage = percentage
        };
    }
}
