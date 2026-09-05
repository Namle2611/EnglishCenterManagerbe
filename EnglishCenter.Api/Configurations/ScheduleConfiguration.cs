using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.ToTable("Schedules", t =>
        {
            t.HasCheckConstraint("CK_Schedules_DayOfWeek", "[DayOfWeek] >= 1 AND [DayOfWeek] <= 7");
            t.HasCheckConstraint("CK_Schedules_Times", "[EndTime] > [StartTime]");
        });

        builder.HasKey(s => s.Id);

        builder.HasIndex(s => new { s.ClassId, s.RoomId, s.DayOfWeek });

        builder.HasOne(s => s.Class)
            .WithMany(c => c.Schedules)
            .HasForeignKey(s => s.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Room)
            .WithMany(r => r.Schedules)
            .HasForeignKey(s => s.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
