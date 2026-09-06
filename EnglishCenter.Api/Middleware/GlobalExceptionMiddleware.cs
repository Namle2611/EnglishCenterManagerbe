using System.Net;
using System.Text.Json;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.DTOs.Common;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalExceptionMiddleware(RequestDelegate _next, ILogger<GlobalExceptionMiddleware> logger)
    {
        this._next = _next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogWarning("Response has already started, skipping exception handling.");
            return;
        }

        context.Response.ContentType = "application/json";

        switch (exception)
        {
            case NotFoundException notFoundEx:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                await JsonSerializer.SerializeAsync(
                    context.Response.Body,
                    ApiResponse.Fail(notFoundEx.Message),
                    JsonOptions);
                break;

            case ConflictException conflictEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                await JsonSerializer.SerializeAsync(
                    context.Response.Body,
                    ApiResponse.Fail(conflictEx.Message),
                    JsonOptions);
                break;

            case ValidationException validationEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await JsonSerializer.SerializeAsync(
                    context.Response.Body,
                    ApiResponse.Fail(validationEx.Message, validationEx.Errors),
                    JsonOptions);
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                await JsonSerializer.SerializeAsync(
                    context.Response.Body,
                    ApiResponse.Fail("Unauthorized."),
                    JsonOptions);
                break;

            case DbUpdateException dbUpdateEx:
                if (IsUniqueConstraintViolation(dbUpdateEx))
                {
                    _logger.LogWarning(dbUpdateEx, "Duplicate unique constraint violation detected.");
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    await JsonSerializer.SerializeAsync(
                        context.Response.Body,
                        ApiResponse.Fail("A duplicate record already exists."),
                        JsonOptions);
                }
                else
                {
                    _logger.LogError(dbUpdateEx, "Database update error occurred.");
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    await JsonSerializer.SerializeAsync(
                        context.Response.Body,
                        ApiResponse.Fail("An unexpected database error occurred."),
                        JsonOptions);
                }
                break;

            default:
                _logger.LogError(exception, "Unhandled exception occurred.");
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                await JsonSerializer.SerializeAsync(
                    context.Response.Body,
                    ApiResponse.Fail("An unexpected error occurred."),
                    JsonOptions);
                break;
        }
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var current = ex.InnerException;
        while (current != null)
        {
            if (current is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                return true;
            }
            current = current.InnerException;
        }
        return false;
    }
}
