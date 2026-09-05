using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class QuestionOptionConfiguration : IEntityTypeConfiguration<QuestionOption>
{
    public void Configure(EntityTypeBuilder<QuestionOption> builder)
    {
        builder.ToTable("QuestionOptions", t =>
        {
            t.HasCheckConstraint("CK_QuestionOptions_OrderIndex", "[OrderIndex] >= 0");
        });

        builder.HasKey(qo => qo.Id);

        builder.Property(qo => qo.Content)
            .IsRequired();

        builder.HasOne(qo => qo.Question)
            .WithMany(qn => qn.QuestionOptions)
            .HasForeignKey(qo => qo.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(qo => qo.QuizAnswers)
            .WithOne(qa => qa.SelectedOption)
            .HasForeignKey(qa => qa.SelectedOptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
