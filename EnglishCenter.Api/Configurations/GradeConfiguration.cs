using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.ToTable("Grades", t =>
        {
            t.HasCheckConstraint("CK_Grades_AttendanceScore", "[AttendanceScore] IS NULL OR ([AttendanceScore] >= 0 AND [AttendanceScore] <= 10)");
            t.HasCheckConstraint("CK_Grades_AssignmentScore", "[AssignmentScore] IS NULL OR ([AssignmentScore] >= 0 AND [AssignmentScore] <= 10)");
            t.HasCheckConstraint("CK_Grades_QuizScore", "[QuizScore] IS NULL OR ([QuizScore] >= 0 AND [QuizScore] <= 10)");
            t.HasCheckConstraint("CK_Grades_MidtermScore", "[MidtermScore] IS NULL OR ([MidtermScore] >= 0 AND [MidtermScore] <= 10)");
            t.HasCheckConstraint("CK_Grades_FinalScore", "[FinalScore] IS NULL OR ([FinalScore] >= 0 AND [FinalScore] <= 10)");
            t.HasCheckConstraint("CK_Grades_TotalScore", "[TotalScore] IS NULL OR ([TotalScore] >= 0 AND [TotalScore] <= 10)");
        });

        builder.HasKey(g => g.Id);

        builder.HasIndex(g => new { g.StudentId, g.ClassId })
            .IsUnique();

        builder.Property(g => g.AttendanceScore).HasPrecision(5, 2);
        builder.Property(g => g.AssignmentScore).HasPrecision(5, 2);
        builder.Property(g => g.QuizScore).HasPrecision(5, 2);
        builder.Property(g => g.MidtermScore).HasPrecision(5, 2);
        builder.Property(g => g.FinalScore).HasPrecision(5, 2);
        builder.Property(g => g.TotalScore).HasPrecision(5, 2);

        builder.HasOne(g => g.Student)
            .WithMany(s => s.Grades)
            .HasForeignKey(g => g.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.Class)
            .WithMany(c => c.Grades)
            .HasForeignKey(g => g.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
