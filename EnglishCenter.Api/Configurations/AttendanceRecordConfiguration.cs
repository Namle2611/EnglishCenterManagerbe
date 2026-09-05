using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
    {
        builder.ToTable("AttendanceRecords");

        builder.HasKey(ar => ar.Id);

        builder.HasIndex(ar => new { ar.AttendanceSessionId, ar.StudentId })
            .IsUnique();

        builder.Property(ar => ar.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(ar => ar.Note)
            .HasMaxLength(255);

        builder.HasOne(ar => ar.AttendanceSession)
            .WithMany(a => a.AttendanceRecords)
            .HasForeignKey(ar => ar.AttendanceSessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ar => ar.Student)
            .WithMany(s => s.AttendanceRecords)
            .HasForeignKey(ar => ar.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
