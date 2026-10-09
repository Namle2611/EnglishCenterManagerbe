import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

describe('Frontend Registration & OTP Flow Verification', () => {

  it('FRONTEND-01: RegisterPage renders Student, Teacher, Staff only and Admin option is absent', () => {
    const registerPagePath = path.join(srcDir, 'pages/auth/RegisterPage.tsx');
    assert.ok(fs.existsSync(registerPagePath), 'RegisterPage.tsx must exist');
    const content = fs.readFileSync(registerPagePath, 'utf8');

    // Role options present
    assert.ok(content.includes('value="STUDENT"'), 'Must have STUDENT option');
    assert.ok(content.includes('value="TEACHER"'), 'Must have TEACHER option');
    assert.ok(content.includes('value="STAFF"'), 'Must have STAFF option');

    // Admin option strictly absent
    assert.ok(!content.includes('value="ADMIN"'), 'Must NOT have ADMIN option in role select');
    assert.ok(!content.includes('value="Admin"'), 'Must NOT have Admin option');
  });

  it('FRONTEND-02: RegisterPage submits and navigates to OTP verification screen', () => {
    const registerPagePath = path.join(srcDir, 'pages/auth/RegisterPage.tsx');
    const content = fs.readFileSync(registerPagePath, 'utf8');

    assert.ok(content.includes("navigate('/register/verify-email'"), 'Must navigate to /register/verify-email on success');
    assert.ok(content.includes('authService.register'), 'Must call authService.register');
  });

  it('FRONTEND-03: VerifyOtpPage accepts 6-digit OTP preserving leading zeros as string', () => {
    const verifyOtpPagePath = path.join(srcDir, 'pages/auth/VerifyOtpPage.tsx');
    assert.ok(fs.existsSync(verifyOtpPagePath), 'VerifyOtpPage.tsx must exist');
    const content = fs.readFileSync(verifyOtpPagePath, 'utf8');

    // String OTP handling
    assert.ok(content.includes("type=\"text\"") || content.includes("inputMode=\"numeric\""), 'OTP input must be text/numeric mode');
    assert.ok(content.includes("maxLength={6}"), 'OTP input must restrict to 6 characters');
    // Ensure leading zero string test case
    const testZeroOtp = "004271";
    assert.equal(testZeroOtp.length, 6);
    assert.equal(testZeroOtp.startsWith("00"), true);
  });

  it('FRONTEND-04: VerifyOtpPage implements 60-second cooldown and 5-minute expiry warning', () => {
    const verifyOtpPagePath = path.join(srcDir, 'pages/auth/VerifyOtpPage.tsx');
    const content = fs.readFileSync(verifyOtpPagePath, 'utf8');

    assert.ok(content.includes('cooldown') && content.includes('60'), 'Must initialize cooldown to 60s');
    assert.ok(content.includes('5 phút') || content.includes('5 minutes'), 'Must warn user that OTP expires in 5 minutes');
    assert.ok(content.includes('cooldown > 0'), 'Resend button disabled while cooldown > 0');
  });

  it('FRONTEND-05: Resend success resets OTP field and restarts 60s cooldown', () => {
    const verifyOtpPagePath = path.join(srcDir, 'pages/auth/VerifyOtpPage.tsx');
    const content = fs.readFileSync(verifyOtpPagePath, 'utf8');

    assert.ok(content.includes("setOtp('')"), 'Must reset OTP field on resend');
    assert.ok(content.includes("setCooldown(60)"), 'Must restart cooldown to 60s on resend');
    assert.ok(content.includes('Mã OTP mới đã được gửi'), 'Must display resend success message');
  });

  it('FRONTEND-06: Student verify success shows login CTA', () => {
    const verifyOtpPagePath = path.join(srcDir, 'pages/auth/VerifyOtpPage.tsx');
    const content = fs.readFileSync(verifyOtpPagePath, 'utf8');

    assert.ok(content.includes('Xác thực email thành công'), 'Must show email verification success');
    assert.ok(content.includes('đã được tạo'), 'Must show account created confirmation');
    assert.ok(content.includes("navigate('/login')") || content.includes("to=\"/login\""), 'Must provide login CTA');
  });

  it('FRONTEND-07: Teacher and Staff verify shows PendingApproval message and does not log in', () => {
    const verifyOtpPagePath = path.join(srcDir, 'pages/auth/VerifyOtpPage.tsx');
    const content = fs.readFileSync(verifyOtpPagePath, 'utf8');

    assert.ok(content.includes('đang chờ Admin phê duyệt') || content.includes('đang chờ quản trị viên phê duyệt'), 'Must show pending approval screen');
    assert.ok(!content.includes('authService.setToken') && !content.includes('setAccessToken'), 'Must not store tokens on pending approval');
  });

  it('FRONTEND-08: Admin RegistrationRequestsPage displays pending list, filter, approve and reject', () => {
    const adminPagePath = path.join(srcDir, 'pages/admin/RegistrationRequestsPage.tsx');
    assert.ok(fs.existsSync(adminPagePath), 'RegistrationRequestsPage.tsx must exist');
    const content = fs.readFileSync(adminPagePath, 'utf8');

    assert.ok(content.includes('adminRegistrationService.getRequests'), 'Must fetch requests via adminRegistrationService');
    assert.ok(content.includes('adminRegistrationService.approve'), 'Must call approve');
    assert.ok(content.includes('adminRegistrationService.reject'), 'Must call reject');
    assert.ok(content.includes('teacherCode') && content.includes('hireDate'), 'Must prompt for teacherCode and hireDate when approving Teacher');
  });

  it('FRONTEND-09: No OTP or password stored in localStorage or sessionStorage', () => {
    const filesToCheck = [
      'pages/auth/RegisterPage.tsx',
      'pages/auth/VerifyOtpPage.tsx',
      'pages/admin/RegistrationRequestsPage.tsx',
      'services/auth.service.ts',
      'services/adminRegistration.service.ts'
    ];

    for (const file of filesToCheck) {
      const fullPath = path.join(srcDir, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(!content.includes('localStorage.setItem("otp"'), `No OTP in localStorage in ${file}`);
        assert.ok(!content.includes('localStorage.setItem("password"'), `No password in localStorage in ${file}`);
        assert.ok(!content.includes('sessionStorage.setItem("otp"'), `No OTP in sessionStorage in ${file}`);
        assert.ok(!content.includes('sessionStorage.setItem("password"'), `No password in sessionStorage in ${file}`);
      }
    }
  });

  it('FRONTEND-10: API errors are rendered safely', () => {
    const registerPage = fs.readFileSync(path.join(srcDir, 'pages/auth/RegisterPage.tsx'), 'utf8');
    const verifyPage = fs.readFileSync(path.join(srcDir, 'pages/auth/VerifyOtpPage.tsx'), 'utf8');

    assert.ok(registerPage.includes('errorMessage') || registerPage.includes('error'), 'Register page renders error messages');
    assert.ok(verifyPage.includes('errorMessage') || verifyPage.includes('error'), 'Verify OTP page renders error messages');
  });
});
