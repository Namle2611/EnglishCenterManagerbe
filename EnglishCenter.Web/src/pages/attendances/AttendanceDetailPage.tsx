import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { AttendanceStatusBadge } from '../../components/attendances/AttendanceStatusBadge';
import { attendanceService } from '../../services/attendance.service';
import type { AttendanceDetail, AttendanceStatus, UpdateAttendancePayload } from '../../types/attendance.types';
import {
  ATTENDANCE_STATUS_OPTIONS,
  extractAttendanceErrorMessage,
  formatAttendanceDate,
  getAttendanceBasePath,
  getClassStudentStatusLabel,
  toDisplayTime
} from '../../utils/attendanceHelper';

export const AttendanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getAttendanceBasePath(location.pathname);

  const [detail, setDetail] = useState<AttendanceDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Editable fields
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [note, setNote] = useState<string>('');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDetail = async (recordId: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await attendanceService.getAttendanceById(recordId, controller.signal);
      if (res.success && res.data) {
        setDetail(res.data);
        setStatus(res.data.status);
        setNote(res.data.note || '');
      } else {
        setFetchError(res.message || 'Không thể tải chi tiết bản ghi điểm danh.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setFetchError(extractAttendanceErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const parsedId = parseInt(id, 10);
      const timer = setTimeout(() => {
        if (!isNaN(parsedId) && parsedId > 0) {
          fetchDetail(parsedId);
        } else {
          setFetchError('ID bản ghi không hợp lệ.');
          setIsLoading(false);
        }
      }, 0);

      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || isSubmittingRef.current) return;

    // Check dirty
    const isStatusChanged = status !== detail.status;
    const isNoteChanged = (note.trim()) !== (detail.note || '').trim();

    if (!isStatusChanged && !isNoteChanged) {
      setSaveErrorMessage('Không có thay đổi để lưu.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const payload: UpdateAttendancePayload = {
      status,
      note: note.trim().length > 0 ? note.trim() : null
    };

    try {
      const res = await attendanceService.updateAttendance(detail.id, payload);
      if (res.success && res.data) {
        setDetail(res.data);
        setStatus(res.data.status);
        setNote(res.data.note || '');
        setSaveSuccessMessage('Cập nhật điểm danh thành công!');
      } else {
        setSaveErrorMessage(res.message || 'Không thể cập nhật bản ghi điểm danh.');
      }
    } catch (err: unknown) {
      setSaveErrorMessage(extractAttendanceErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Chi tiết & Điều chỉnh điểm danh"
        subtitle={detail ? `Bản ghi #${detail.id} — Lớp ${detail.classCode} (${formatAttendanceDate(detail.sessionDate)})` : 'Chi tiết điểm danh'}
        breadcrumbs={[
          { label: 'Trang chủ', path: basePath.startsWith('/admin') ? '/admin' : basePath.startsWith('/staff') ? '/staff' : '/teacher' },
          { label: 'Điểm danh', path: basePath },
          { label: 'Chi tiết' }
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            &larr; Quay lại danh sách
          </button>
        }
      />

      {isLoading ? (
        <LoadingState message="Đang tải chi tiết điểm danh..." />
      ) : fetchError ? (
        <div
          role="alert"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            textAlign: 'center',
            fontSize: '0.9375rem'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Không tìm thấy bản ghi</div>
          <div>{fetchError}</div>
          <button
            type="button"
            onClick={() => id && fetchDetail(parseInt(id, 10))}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      ) : detail ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Readonly Metadata */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Thông tin buổi học & Học viên
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={infoRowStyle}>
                <span style={labelStyle}>Mã bản ghi:</span>
                <strong>#{detail.id}</strong>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Lớp học:</span>
                <div>
                  <strong style={{ color: 'var(--color-primary)' }}>{detail.classCode}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{detail.courseName} ({detail.courseCode})</div>
                </div>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Ngày học:</span>
                <strong>{formatAttendanceDate(detail.sessionDate)}</strong>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Giờ bắt đầu:</span>
                <strong>{toDisplayTime(detail.startTime)}</strong>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Học viên:</span>
                <div>
                  <strong>{detail.studentName}</strong> ({detail.studentCode})
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{detail.studentEmail}</div>
                </div>
              </div>

              {detail.classStudentStatus && (
                <div style={infoRowStyle}>
                  <span style={labelStyle}>Trạng thái ghi danh:</span>
                  <span>{getClassStudentStatusLabel(detail.classStudentStatus)}</span>
                </div>
              )}

              {detail.teacherName && (
                <div style={infoRowStyle}>
                  <span style={labelStyle}>Giảng viên phụ trách:</span>
                  <span>{detail.teacherName} {detail.teacherCode && `(${detail.teacherCode})`}</span>
                </div>
              )}

              <div style={infoRowStyle}>
                <span style={labelStyle}>Trạng thái hiện tại:</span>
                <AttendanceStatusBadge status={detail.status} />
              </div>
            </div>

            {/* Link to Session Roster */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `${basePath}/session?classId=${detail.classId}&sessionDate=${detail.sessionDate}&startTime=${detail.startTime}`
                  )
                }
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>📋</span> Xem danh sách cả lớp trong buổi này
              </button>
            </div>
          </div>

          {/* Right Column: Correction Form */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              ✏️ Điều chỉnh chuyên cần
            </h3>

            {saveSuccessMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-success-bg, #dcfce7)',
                  color: 'var(--status-success-text, #15803d)',
                  border: '1px solid var(--status-success-border, #86efac)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}
              >
                ✓ {saveSuccessMessage}
              </div>
            )}

            {saveErrorMessage && (
              <div
                role="alert"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-danger-bg)',
                  color: 'var(--status-danger-text)',
                  border: '1px solid var(--status-danger-border)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}
              >
                ⚠️ {saveErrorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Status Radio / Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Trạng thái điểm danh <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {ATTENDANCE_STATUS_OPTIONS.map((opt) => {
                    const isSelected = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        disabled={isSubmitting}
                        style={{
                          padding: '0.625rem 0.75rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Ghi chú điều chỉnh
                </label>
                <textarea
                  id="attendance-detail-note"
                  rows={4}
                  placeholder="Nhập lý do điều chỉnh hoặc ghi chú về chuyên cần..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStatus(detail.status);
                    setNote(detail.note || '');
                    setSaveErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.625rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    color: 'var(--color-text-secondary)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Khôi phục
                </button>

                <button
                  id="attendance-detail-save-btn"
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text-inverse)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px' }} /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <span>💾</span> Lưu điều chỉnh
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '0.375rem 0',
  borderBottom: '1px dashed var(--color-border)'
};

const labelStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontWeight: 500
};
