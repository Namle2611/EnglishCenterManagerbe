namespace EnglishCenter.Api.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }
}

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}

public class ValidationException : Exception
{
    public List<string> Errors { get; }

    public ValidationException(string message, List<string>? errors = null) : base(message)
    {
        Errors = errors ?? new List<string>();
    }

    public ValidationException(List<string> errors) : base("Validation failed.")
    {
        Errors = errors;
    }
}
