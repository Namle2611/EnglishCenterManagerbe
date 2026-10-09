using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnglishCenter.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSePayPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Payments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentCode",
                table: "Payments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ReceivedAmount",
                table: "Payments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SePayReferenceCode",
                table: "Payments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SePayTransactionId",
                table: "Payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "WebhookReceivedAt",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaymentCode",
                table: "Payments",
                column: "PaymentCode",
                unique: true,
                filter: "[PaymentCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_SePayTransactionId",
                table: "Payments",
                column: "SePayTransactionId",
                unique: true,
                filter: "[SePayTransactionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_PaymentCode",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_SePayTransactionId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentCode",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ReceivedAmount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SePayReferenceCode",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SePayTransactionId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "WebhookReceivedAt",
                table: "Payments");
        }
    }
}
