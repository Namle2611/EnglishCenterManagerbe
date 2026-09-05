using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions", t =>
        {
            t.HasCheckConstraint("CK_Questions_Score", "[Score] > 0");
            t.HasCheckConstraint("CK_Questions_OrderIndex", "[OrderIndex] >= 0");
        });

        builder.HasKey(qn => qn.Id);

        builder.Property(qn => qn.Content)
            .IsRequired();

        builder.Property(qn => qn.QuestionType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(qn => qn.Score)
            .HasPrecision(5, 2);

        builder.HasOne(qn => qn.Quiz)
            .WithMany(q => q.Questions)
            .HasForeignKey(qn => qn.QuizId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(qn => qn.QuestionOptions)
            .WithOne(qo => qo.Question)
            .HasForeignKey(qo => qo.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(qn => qn.QuizAnswers)
            .WithOne(qa => qa.Question)
            .HasForeignKey(qa => qa.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
