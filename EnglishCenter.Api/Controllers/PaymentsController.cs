using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EnglishCenter.Api.Configuration;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly SePayOptions _sePayOptions;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IPaymentService paymentService,
        IOptions<SePayOptions> sePayOptions,
        IWebHostEnvironment environment,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _sePayOptions = sePayOptions.Value;
        _environment = environment;
        _logger = logger;
    }

    // =========================================================================
    // Admin / Staff Endpoints
    // =========================================================================

    [HttpGet]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> GetList([FromQuery] PaymentQuery query, CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PaymentListItemResponse>>.Ok(result, "Payments retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<PaymentDetailResponse>.Ok(result, "Payment retrieved successfully."));
    }

    [HttpGet("enrollments/{enrollmentId:int}/summary")]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> GetSummary(int enrollmentId, CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetSummaryByEnrollmentIdAsync(enrollmentId, cancellationToken);
        return Ok(ApiResponse<PaymentSummaryResponse>.Ok(result, "Payment summary retrieved successfully."));
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<PaymentDetailResponse>.Ok(result, "Payment created successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<PaymentDetailResponse>.Ok(result, "Payment updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePaymentStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<PaymentDetailResponse>.Ok(result, "Payment status updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = PolicyNames.ManagePayments)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _paymentService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    // =========================================================================
    // Student SePay VietQR Endpoints
    // =========================================================================

    [HttpPost("enrollments/{enrollmentId:int}/sepay")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> CreateOrGetStudentSePayPayment(int enrollmentId, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var result = await _paymentService.GetOrCreateStudentSePayPaymentAsync(enrollmentId, currentUserId, cancellationToken);
        return Ok(ApiResponse<SePayPaymentResponse>.Ok(result, "SePay VietQR payment initialized successfully."));
    }

    [HttpGet("enrollments/{enrollmentId:int}/sepay")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> GetStudentSePayPayment(int enrollmentId, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var result = await _paymentService.GetStudentSePayPaymentAsync(enrollmentId, currentUserId, cancellationToken);
        return Ok(ApiResponse<SePayPaymentResponse>.Ok(result, "SePay VietQR payment retrieved successfully."));
    }

    [HttpGet("student/tuition")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> GetStudentTuitions(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var result = await _paymentService.GetStudentTuitionsAsync(currentUserId, cancellationToken);
        return Ok(ApiResponse<List<StudentTuitionEnrollmentResponse>>.Ok(result, "Tuition information retrieved successfully."));
    }

    [HttpGet("{id:int}/status")]
    [Authorize]
    public async Task<IActionResult> GetPaymentStatus(int id, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var isStaffOrAdmin = User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Staff);
        var result = await _paymentService.GetPaymentStatusAsync(id, currentUserId, isStaffOrAdmin, cancellationToken);
        return Ok(ApiResponse<PaymentStatusCheckResponse>.Ok(result, "Payment status retrieved successfully."));
    }

    // =========================================================================
    // SePay HMAC Webhook Endpoint
    // =========================================================================

    [HttpPost("sepay/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> SePayWebhook(CancellationToken cancellationToken)
    {
        // 1. Capture Raw Request Body (Section 17)
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync(cancellationToken);
        Request.Body.Position = 0;

        // 2. Validate Headers (Section 16 & 18)
        var signatureHeader = Request.Headers["X-SePay-Signature"].ToString();
        var timestampHeader = Request.Headers["X-SePay-Timestamp"].ToString();

        if (string.IsNullOrWhiteSpace(signatureHeader) || string.IsNullOrWhiteSpace(timestampHeader))
        {
            _logger.LogWarning("SePay webhook rejected: Missing X-SePay-Signature or X-SePay-Timestamp header.");
            return Unauthorized(ApiResponse.Fail("Missing required SePay authentication headers."));
        }

        // 3. Anti-Replay Timestamp Check (Section 18)
        if (!long.TryParse(timestampHeader, out var timestampSeconds))
        {
            _logger.LogWarning("SePay webhook rejected: Invalid timestamp format '{Timestamp}'.", timestampHeader);
            return Unauthorized(ApiResponse.Fail("Invalid webhook timestamp format."));
        }

        var currentUtcSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(currentUtcSeconds - timestampSeconds) > 300)
        {
            _logger.LogWarning("SePay webhook rejected: Timestamp {Timestamp} drifted by {Drift}s from server UTC {Now} (> 300s window).",
                timestampSeconds, Math.Abs(currentUtcSeconds - timestampSeconds), currentUtcSeconds);
            return Unauthorized(ApiResponse.Fail("Webhook timestamp is expired or outside allowable time window."));
        }

        // 4. Missing Secret - Fail Closed (Section 19)
        var secret = _sePayOptions.WebhookSecret;
        if (string.IsNullOrWhiteSpace(secret))
        {
            _logger.LogError("SePay:WebhookSecret is not configured.");
            if (!_environment.IsDevelopment())
            {
                throw new InvalidOperationException("CRITICAL: SePay:WebhookSecret is missing.");
            }
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Fail("Webhook secret configuration missing."));
        }

        // 5. Compute and Verify HMAC-SHA256 with Constant-Time Comparison (Section 16)
        var messageToSign = $"{timestampHeader}.{rawBody}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(messageToSign));
        var expectedSignature = $"sha256={Convert.ToHexStringLower(computedHash)}";

        if (!FixedTimeEquals(signatureHeader.Trim(), expectedSignature))
        {
            _logger.LogWarning("SePay webhook rejected: Invalid HMAC signature.");
            return Unauthorized(ApiResponse.Fail("Invalid webhook signature."));
        }

        // 6. Parse JSON Payload ONLY AFTER HMAC Verification Succeeds (Section 17 & 20)
        SePayWebhookPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<SePayWebhookPayload>(rawBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException jsonEx)
        {
            _logger.LogWarning(jsonEx, "SePay webhook rejected: Malformed JSON payload.");
            return BadRequest(ApiResponse.Fail("Malformed webhook JSON payload."));
        }

        if (payload == null)
        {
            return BadRequest(ApiResponse.Fail("Empty payload received."));
        }

        // 7. Process Webhook Atomically and Idempotently (Section 21 - 31)
        await _paymentService.ProcessSePayWebhookAsync(payload, cancellationToken);

        return Ok(new
        {
            success = true
        });
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        var aBytes = Encoding.UTF8.GetBytes(a);
        var bBytes = Encoding.UTF8.GetBytes(b);

        if (aBytes.Length != bBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }
}
