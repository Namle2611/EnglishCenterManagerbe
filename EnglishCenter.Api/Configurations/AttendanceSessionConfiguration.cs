using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class AttendanceSessionConfiguration : IEntityTypeConfiguration<AttendanceSession>
{
    public void Configure(EntityTypeBuilder<AttendanceSession> builder)
    {
        builder.ToTable("AttendanceSessions");

        builder.HasKey(a => a.Id);

        builder.HasOne(a => a.Class)
            .WithMany(c => c.AttendanceSessions)
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CreatedByTeacher)
            .WithMany(t => t.AttendanceSessions)
            .HasForeignKey(a => a.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.AttendanceRecords)
            .WithOne(ar => ar.AttendanceSession)
            .HasForeignKey(ar => ar.AttendanceSessionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
