using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountRegistrationRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountRegistrationRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    RequestedRole = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EmailVerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OtpHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    OtpExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OtpAttemptCount = table.Column<int>(type: "int", nullable: false),
                    OtpSentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Specialization = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Qualification = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ExperienceYears = table.Column<int>(type: "int", nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountRegistrationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccountRegistrationRequests_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountRegistrationRequests_CreatedAt",
                table: "AccountRegistrationRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRegistrationRequests_NormalizedEmail_Active",
                table: "AccountRegistrationRequests",
                column: "NormalizedEmail",
                unique: true,
                filter: "[Status] IN ('PendingEmailVerification', 'PendingApproval')");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRegistrationRequests_RequestedRole",
                table: "AccountRegistrationRequests",
                column: "RequestedRole");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRegistrationRequests_ReviewedByUserId",
                table: "AccountRegistrationRequests",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRegistrationRequests_Status",
                table: "AccountRegistrationRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountRegistrationRequests");
        }
    }
}
