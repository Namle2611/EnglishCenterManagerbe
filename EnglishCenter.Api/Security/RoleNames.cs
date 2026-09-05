namespace EnglishCenter.Api.Security;

public static class RoleNames
{
    public const string Admin = "ADMIN";
    public const string Staff = "STAFF";
    public const string Teacher = "TEACHER";
    public const string Student = "STUDENT";

    public static readonly string[] AllRoles = [Admin, Staff, Teacher, Student];
}
