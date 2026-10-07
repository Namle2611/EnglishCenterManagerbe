using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using EnglishCenter.Api.Configuration;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Hubs;
using EnglishCenter.Api.Middleware;
using EnglishCenter.Api.Repositories;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Seeders;
using EnglishCenter.Api.Services;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Validate and configure JWT settings
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSettings = jwtSection.Get<JwtSettings>() ?? new JwtSettings();
jwtSection.Bind(jwtSettings);

if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || Encoding.UTF8.GetByteCount(jwtSettings.SecretKey) < 32)
{
    throw new InvalidOperationException("Jwt:SecretKey is not configured or is shorter than 32 bytes (256 bits).");
}
if (string.IsNullOrWhiteSpace(jwtSettings.Issuer))
{
    throw new InvalidOperationException("Jwt:Issuer is not configured.");
}
if (string.IsNullOrWhiteSpace(jwtSettings.Audience))
{
    throw new InvalidOperationException("Jwt:Audience is not configured.");
}
if (jwtSettings.AccessTokenExpirationMinutes <= 0)
{
    throw new InvalidOperationException("Jwt:AccessTokenExpirationMinutes must be greater than 0.");
}
if (jwtSettings.RefreshTokenExpirationDays <= 0)
{
    throw new InvalidOperationException("Jwt:RefreshTokenExpirationDays must be greater than 0.");
}

builder.Services.Configure<JwtSettings>(jwtSection);

// Configure Authentication & JWT Bearer
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PolicyNames.ManageStudents, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManageTeachers, policy =>
        policy.RequireRole(RoleNames.Admin));
    options.AddPolicy(PolicyNames.ManageCourses, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManageClasses, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManageRooms, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManageSchedules, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManageEnrollments, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManagePayments, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.ManageAttendance, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher));
    options.AddPolicy(PolicyNames.ManageLearningContent, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher));
    options.AddPolicy(PolicyNames.MaintainLearningContent, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff));
    options.AddPolicy(PolicyNames.AccessAssignments, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher, RoleNames.Student));
    options.AddPolicy(PolicyNames.ManageAssignments, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher));
    options.AddPolicy(PolicyNames.AccessQuizzes, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher, RoleNames.Student));
    options.AddPolicy(PolicyNames.ManageQuizzes, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher));
    options.AddPolicy(PolicyNames.AccessGrades, policy =>
        policy.RequireRole(RoleNames.Admin, RoleNames.Staff, RoleNames.Teacher, RoleNames.Student));
});

// Register DI services
builder.Services.AddScoped<IPasswordHasherService, PasswordHasherService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserAccountService, UserAccountService>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<ITeacherRepository, TeacherRepository>();
builder.Services.AddScoped<ITeacherService, TeacherService>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IClassRepository, ClassRepository>();
builder.Services.AddScoped<IClassService, ClassService>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IScheduleRepository, ScheduleRepository>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<ISectionRepository, SectionRepository>();
builder.Services.AddScoped<ISectionService, SectionService>();
builder.Services.AddScoped<ILessonRepository, LessonRepository>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<IAssignmentRepository, AssignmentRepository>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();
builder.Services.AddScoped<IQuizRepository, QuizRepository>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IQuizQuestionService, QuizQuestionService>();
builder.Services.AddScoped<IQuizAttemptRepository, QuizAttemptRepository>();
builder.Services.AddScoped<IQuizAttemptService, QuizAttemptService>();
builder.Services.AddScoped<IGradeRepository, GradeRepository>();
builder.Services.AddScoped<IGradeService, GradeService>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationRealtimePublisher, NotificationRealtimePublisher>();
builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection(GeminiOptions.SectionName));
builder.Services.AddScoped<IGeminiQuizClient, GeminiQuizClient>();
builder.Services.AddScoped<IQuizAiService, QuizAiService>();
builder.Services.AddScoped<IdentitySeeder>();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    var knownProxies = builder.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>();
    if (knownProxies != null)
    {
        foreach (var proxy in knownProxies)
        {
            options.KnownProxies.Add(System.Net.IPAddress.Parse(proxy));
        }
    }

    var knownNetworks = builder.Configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>();
    if (knownNetworks != null)
    {
        foreach (var network in knownNetworks)
        {
            options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network));
        }
    }
});

builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = false;
    options.Preload = false;
});

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    var loginPermit = builder.Configuration.GetValue<int>("RateLimiting:Login:PermitLimit", 5);
    var loginWindow = builder.Configuration.GetValue<int>("RateLimiting:Login:WindowSeconds", 60);
    var refreshPermit = builder.Configuration.GetValue<int>("RateLimiting:Refresh:PermitLimit", 10);
    var refreshWindow = builder.Configuration.GetValue<int>("RateLimiting:Refresh:WindowSeconds", 60);
    var changePassPermit = builder.Configuration.GetValue<int>("RateLimiting:ChangePassword:PermitLimit", 5);
    var changePassWindow = builder.Configuration.GetValue<int>("RateLimiting:ChangePassword:WindowSeconds", 300);

    options.AddPolicy("AuthLoginPolicy", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = loginPermit,
            Window = TimeSpan.FromSeconds(loginWindow),
            SegmentsPerWindow = 6,
            QueueLimit = 0
        });
    });

    options.AddPolicy("AuthRefreshPolicy", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = refreshPermit,
            Window = TimeSpan.FromSeconds(refreshWindow),
            SegmentsPerWindow = 6,
            QueueLimit = 0
        });
    });

    options.AddPolicy("ChangePasswordPolicy", context =>
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        string partitionKey = !string.IsNullOrEmpty(userId)
            ? $"user_{userId}"
            : $"anon_ip_{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = changePassPermit,
            Window = TimeSpan.FromSeconds(changePassWindow),
            QueueLimit = 0
        });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        int retryAfterSeconds;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter) && retryAfter.TotalSeconds > 0)
        {
            retryAfterSeconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
        }
        else
        {
            var policy = context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName;
            retryAfterSeconds = policy switch
            {
                "ChangePasswordPolicy" => changePassWindow,
                "AuthRefreshPolicy" => refreshWindow,
                _ => loginWindow
            };
        }

        context.HttpContext.Response.Headers.RetryAfter = retryAfterSeconds.ToString();

        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse.Fail("Too many requests. Please try again later."),
            cancellationToken: cancellationToken);
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
    });
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Invalid input." : e.ErrorMessage)
            .ToList();
        var response = ApiResponse.Fail("Validation failed", errors);
        return new BadRequestObjectResult(response);
    };
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

// Seed identity roles and development admin
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<IdentitySeeder>();
    await seeder.SeedAsync();
}

app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Development-only database connectivity verification endpoint
    app.MapGet("/api/health/db", async (AppDbContext db) =>
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new { status = canConnect ? "CONNECTED" : "FAILED" });
    });
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseCors("AllowReact");

app.UseAuthentication();

app.UseRateLimiter();

app.UseAuthorization();

app.MapHub<NotificationHub>("/hubs/notifications");
app.MapControllers();

app.Run();
