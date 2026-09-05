using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.ToTable("Quizzes", t =>
        {
            t.HasCheckConstraint("CK_Quizzes_DurationMinutes", "[DurationMinutes] IS NULL OR [DurationMinutes] > 0");
            t.HasCheckConstraint("CK_Quizzes_MaxAttempts", "[MaxAttempts] >= 1");
            t.HasCheckConstraint("CK_Quizzes_Dates", "[StartAt] IS NULL OR [EndAt] IS NULL OR [EndAt] > [StartAt]");
        });

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(q => q.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(q => q.Class)
            .WithMany(c => c.Quizzes)
            .HasForeignKey(q => q.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(q => q.Questions)
            .WithOne(qn => qn.Quiz)
            .HasForeignKey(qn => qn.QuizId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(q => q.QuizAttempts)
            .WithOne(qa => qa.Quiz)
            .HasForeignKey(qa => qa.QuizId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
