using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.ToTable("Rooms", t =>
        {
            t.HasCheckConstraint("CK_Rooms_Capacity", "[Capacity] > 0");
        });

        builder.HasKey(r => r.Id);

        builder.Property(r => r.RoomCode)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(r => r.RoomCode)
            .IsUnique();

        builder.Property(r => r.RoomName)
            .HasMaxLength(100);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasMany(r => r.Schedules)
            .WithOne(s => s.Room)
            .HasForeignKey(s => s.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
