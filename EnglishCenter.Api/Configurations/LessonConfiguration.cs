using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.ToTable("Lessons", t =>
        {
            t.HasCheckConstraint("CK_Lessons_OrderIndex", "[OrderIndex] >= 0");
        });

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(l => l.VideoUrl)
            .HasMaxLength(500);

        builder.Property(l => l.AudioUrl)
            .HasMaxLength(500);

        builder.Property(l => l.DocumentUrl)
            .HasMaxLength(500);

        builder.Property(l => l.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(l => l.Section)
            .WithMany(s => s.Lessons)
            .HasForeignKey(l => l.SectionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
