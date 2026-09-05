using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class QuizAnswerConfiguration : IEntityTypeConfiguration<QuizAnswer>
{
    public void Configure(EntityTypeBuilder<QuizAnswer> builder)
    {
        builder.ToTable("QuizAnswers");

        builder.HasKey(qa => qa.Id);

        builder.HasIndex(qa => new { qa.QuizAttemptId, qa.QuestionId })
            .IsUnique();

        builder.Property(qa => qa.ScoreEarned)
            .HasPrecision(5, 2);

        builder.HasOne(qa => qa.QuizAttempt)
            .WithMany(qat => qat.QuizAnswers)
            .HasForeignKey(qa => qa.QuizAttemptId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qa => qa.Question)
            .WithMany(qn => qn.QuizAnswers)
            .HasForeignKey(qa => qa.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qa => qa.SelectedOption)
            .WithMany(qo => qo.QuizAnswers)
            .HasForeignKey(qa => qa.SelectedOptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
