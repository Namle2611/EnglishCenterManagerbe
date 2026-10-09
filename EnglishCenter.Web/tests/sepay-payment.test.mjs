import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

describe('FE-PAY: VietQR SePay Student Payment Verification', () => {

  it('FE-PAY-01: Student payment page renders tuition and enrollment information', () => {
    const tuitionPagePath = path.join(srcDir, 'pages/student/StudentTuitionPage.tsx');
    assert.ok(fs.existsSync(tuitionPagePath), 'StudentTuitionPage.tsx must exist');
    const tuitionContent = fs.readFileSync(tuitionPagePath, 'utf8');

    assert.ok(tuitionContent.includes('item.courseName'), 'Must render course name');
    assert.ok(tuitionContent.includes('item.tuitionAmount'), 'Must render tuition amount');
    assert.ok(tuitionContent.includes('item.remainingAmount'), 'Must render remaining amount');
    assert.ok(tuitionContent.includes('item.paidAmount'), 'Must render paid amount');

    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    assert.ok(fs.existsSync(qrPagePath), 'StudentPaymentQrPage.tsx must exist');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');
    assert.ok(qrContent.includes('payment.courseName'), 'Must render course name on QR payment page');
    assert.ok(qrContent.includes('payment.amount'), 'Must render exact amount on QR payment page');
  });

  it('FE-PAY-02: QR image rendered dynamically with VietQR URL', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('<img') && qrContent.includes('src={payment.qrUrl}'), 'Must render <img> with payment.qrUrl source');
    assert.ok(qrContent.includes('vietqr.app') || qrContent.includes('qrUrl'), 'Must reference dynamic VietQR URL');
    assert.ok(qrContent.includes('alt="Mã VietQR thanh toán"') || qrContent.includes('alt='), 'Must have descriptive alt attribute');
  });

  it('FE-PAY-03: Exact amount displayed with VND currency formatting', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('formatVND(payment.amount)'), 'Must format payment amount with formatVND');
    assert.ok(qrContent.includes('Số tiền'), 'Must display "Số tiền" label');
    assert.ok(qrContent.toLowerCase().includes('không chỉnh sửa số tiền'), 'Must warn user not to alter amount or content');
  });

  it('FE-PAY-04: PaymentCode displayed clearly with copy helper', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('payment.paymentCode'), 'Must display payment.paymentCode');
    assert.ok(qrContent.includes('Nội dung chuyển khoản') || qrContent.includes('Nội dung'), 'Must display "Nội dung chuyển khoản" label');
    assert.ok(qrContent.includes('copyToClipboard'), 'Must provide copy button for payment code');
  });

  it('FE-PAY-05: Pending status displayed with instruction', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('Chờ thanh toán'), 'Must display "Chờ thanh toán" status indicator');
    assert.ok(qrContent.includes('Quét mã QR bằng ứng dụng ngân hàng để thanh toán'), 'Must display primary instruction for banking app');
  });

  it('FE-PAY-06: Poll/status change updates to Paid automatically', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('paymentService.getPaymentStatus'), 'Must call getPaymentStatus for polling');
    assert.ok(qrContent.includes('setInterval') && qrContent.includes('3000'), 'Must poll every 3 seconds');
    assert.ok(qrContent.includes("res.data.status === 'Paid'"), 'Must detect Paid status from polling response');
    assert.ok(qrContent.includes('setIsPaid(true)'), 'Must update UI state to paid');
    assert.ok(qrContent.includes('clearInterval'), 'Must clean up interval on unmount or payment completion');
  });

  it('FE-PAY-07: Paid payment transitions UI and no longer offers duplicate payment actions', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('Đã thanh toán thành công'), 'Must display success banner when paid');
    assert.ok(qrContent.includes('Quay lại danh sách học phí'), 'Must provide return navigation link after payment');

    const tuitionPagePath = path.join(srcDir, 'pages/student/StudentTuitionPage.tsx');
    const tuitionContent = fs.readFileSync(tuitionPagePath, 'utf8');
    assert.ok(tuitionContent.includes('item.isFullyPaid'), 'Must check isFullyPaid');
    assert.ok(tuitionContent.includes('Đã hoàn tất') || tuitionContent.includes('Đã thanh toán'), 'Must display fully paid state on tuition item');
  });

  it('FE-PAY-08: Student cannot manipulate amount via frontend request', () => {
    const servicePath = path.join(srcDir, 'services/payment.service.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    // Verify createOrGetSePayPayment accepts ONLY enrollmentId (no amount parameter in signature or body)
    assert.ok(
      serviceContent.includes('createOrGetSePayPayment(enrollmentId: number, signal?: AbortSignal)'),
      'createOrGetSePayPayment must only accept enrollmentId and abort signal, never an amount'
    );
    assert.ok(
      serviceContent.includes('axiosClient.post<ApiResponse<SePayPaymentDetail>>(') &&
      serviceContent.includes('`/payments/enrollments/${enrollmentId}/sepay`'),
      'POST request must target server route with no client amount submitted'
    );
  });

  it('FE-PAY-09: Safe error UI and fallback handling', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    assert.ok(qrContent.includes('errorMessage'), 'Must handle and render error messages');
    assert.ok(qrContent.includes('Thử lại'), 'Must offer retry button when error occurs');
    assert.ok(qrContent.includes('parsedEnrollmentId <= 0') || qrContent.includes('isNaN(parsedEnrollmentId)'), 'Must validate enrollment ID param safely');
  });

  it('POLL-01: Poll stops after Paid and on unmount', () => {
    const qrPagePath = path.join(srcDir, 'pages/student/StudentPaymentQrPage.tsx');
    const qrContent = fs.readFileSync(qrPagePath, 'utf8');

    // 1. Stops on Paid
    assert.ok(
      qrContent.includes('if (!payment || isPaid)') && qrContent.includes('clearInterval(pollTimerRef.current)'),
      'Must clear interval when payment becomes isPaid'
    );

    // 2. Cleanup on unmount
    assert.ok(
      qrContent.includes('return () =>') && qrContent.includes('pollTimerRef.current = null'),
      'Must clear interval and release timer ref on component unmount'
    );
  });
});
