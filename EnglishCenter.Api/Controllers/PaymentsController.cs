using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManagePayments)]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] PaymentQuery query, CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PaymentListItemResponse>>.Ok(result, "Payments retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<PaymentDetailResponse>.Ok(result, "Payment retrieved successfully."));
    }

    [HttpGet("enrollments/{enrollmentId:int}/summary")]
    public async Task<IActionResult> GetSummary(int enrollmentId, CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetSummaryByEnrollmentIdAsync(enrollmentId, cancellationToken);
        return Ok(ApiResponse<PaymentSummaryResponse>.Ok(result, "Payment summary retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<PaymentDetailResponse>.Ok(result, "Payment created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<PaymentDetailResponse>.Ok(result, "Payment updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePaymentStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<PaymentDetailResponse>.Ok(result, "Payment status updated successfully."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _paymentService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
