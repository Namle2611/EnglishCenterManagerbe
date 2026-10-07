namespace EnglishCenter.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            if (!headers.ContainsKey("X-Content-Type-Options"))
            {
                headers.XContentTypeOptions = "nosniff";
            }

            if (!headers.ContainsKey("X-Frame-Options"))
            {
                headers.XFrameOptions = "DENY";
            }

            if (!headers.ContainsKey("Referrer-Policy"))
            {
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            }

            if (!headers.ContainsKey("Permissions-Policy"))
            {
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            }

            if (context.Request.Path.StartsWithSegments("/api") && context.User.Identity?.IsAuthenticated == true)
            {
                headers.CacheControl = "no-store, no-cache, max-age=0, must-revalidate";
                headers.Pragma = "no-cache";
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
