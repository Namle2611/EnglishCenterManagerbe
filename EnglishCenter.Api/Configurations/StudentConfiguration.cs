using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("Students");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.StudentCode)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(s => s.StudentCode)
            .IsUnique();

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.Property(s => s.Gender)
            .HasMaxLength(20);

        builder.Property(s => s.Address)
            .HasMaxLength(500);

        builder.Property(s => s.CurrentLevel)
            .HasMaxLength(50);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(s => s.User)
            .WithOne(u => u.Student)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Enrollments)
            .WithOne(e => e.Student)
            .HasForeignKey(e => e.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.ClassStudents)
            .WithOne(cs => cs.Student)
            .HasForeignKey(cs => cs.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.AttendanceRecords)
            .WithOne(ar => ar.Student)
            .HasForeignKey(ar => ar.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Submissions)
            .WithOne(sub => sub.Student)
            .HasForeignKey(sub => sub.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.QuizAttempts)
            .WithOne(qa => qa.Student)
            .HasForeignKey(qa => qa.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Grades)
            .WithOne(g => g.Student)
            .HasForeignKey(g => g.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
