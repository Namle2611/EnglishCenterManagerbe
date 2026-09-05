using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class QuizAttemptConfiguration : IEntityTypeConfiguration<QuizAttempt>
{
    public void Configure(EntityTypeBuilder<QuizAttempt> builder)
    {
        builder.ToTable("QuizAttempts", t =>
        {
            t.HasCheckConstraint("CK_QuizAttempts_AttemptNumber", "[AttemptNumber] >= 1");
        });

        builder.HasKey(qa => qa.Id);

        builder.HasIndex(qa => new { qa.QuizId, qa.StudentId, qa.AttemptNumber })
            .IsUnique();

        builder.Property(qa => qa.Score)
            .HasPrecision(5, 2);

        builder.Property(qa => qa.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(qa => qa.Quiz)
            .WithMany(q => q.QuizAttempts)
            .HasForeignKey(qa => qa.QuizId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qa => qa.Student)
            .WithMany(s => s.QuizAttempts)
            .HasForeignKey(qa => qa.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(qa => qa.QuizAnswers)
            .WithOne(qans => qans.QuizAttempt)
            .HasForeignKey(qans => qans.QuizAttemptId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
