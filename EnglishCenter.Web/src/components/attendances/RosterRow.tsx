import React from 'react';
import type { AttendanceRosterItem, AttendanceStatus } from '../../types/attendance.types';
import {
  ATTENDANCE_STATUS_OPTIONS,
  formatAttendanceDate,
  getClassStudentStatusLabel
} from '../../utils/attendanceHelper';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface RosterRowProps {
  student: AttendanceRosterItem;
  currentStatus: AttendanceStatus | null;
  currentNote: string;
  isDirty: boolean;
  isExistingSession: boolean;
  isTeacher: boolean;
  isAdminOrStaff: boolean;
  onStatusChange: (status: AttendanceStatus | null) => void;
  onNoteChange: (note: string) => void;
  disabled?: boolean;
}

export const RosterRow: React.FC<RosterRowProps> = ({
  student,
  currentStatus,
  currentNote,
  isDirty,
  isExistingSession,
  isTeacher,
  isAdminOrStaff,
  onStatusChange,
  onNoteChange,
  disabled = false
}) => {
  const isExistingRecord = student.attendanceId !== null && student.attendanceId !== undefined;

  // Derive editable permission:
  // 1. Existing record: can be corrected by assigned Teacher or Admin/Staff
  // 2. New record: requires student.canCreate === true
  //    AND if session is missing (!isExistingSession), only assigned Teacher can create
  let canEditRecord = false;
  let disabledReason: string | null = null;

  if (isExistingRecord) {
    canEditRecord = true;
  } else {
    if (!student.canCreate) {
      canEditRecord = false;
      disabledReason = student.ineligibilityReason || 'Học viên không đủ điều kiện điểm danh mới.';
    } else if (!isExistingSession && isAdminOrStaff && !isTeacher) {
      canEditRecord = false;
      disabledReason = 'Chỉ giảng viên phụ trách mới có quyền tạo buổi học mới.';
    } else {
      canEditRecord = true;
    }
  }

  const isRowDisabled = disabled || !canEditRecord;

  // Membership status badge color
  const getMembershipBadgeClass = () => {
    switch (student.membershipStatus) {
      case 'Active':
        return 'badge-success';
      case 'Completed':
        return 'badge-info';
      case 'Withdrawn':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <tr
      id={`roster-row-${student.studentId}`}
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: isDirty ? 'var(--color-surface-hover)' : 'transparent',
        transition: 'background-color 0.15s ease'
      }}
    >
      {/* Student Code */}
      <td style={{ ...cellStyle, width: '120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
            {student.studentCode}
          </span>
          {isDirty && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'inline-block'
              }}
              title="Có thay đổi chưa lưu"
            />
          )}
        </div>
      </td>

      {/* Student Name */}
      <td style={{ ...cellStyle, minWidth: '160px' }}>
        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {student.studentName}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Gia nhập: {formatAttendanceDate(student.joinedAt)}
        </div>
      </td>

      {/* Membership Status */}
      <td style={{ ...cellStyle, width: '120px' }}>
        <span className={`badge ${getMembershipBadgeClass()}`}>
          {getClassStudentStatusLabel(student.membershipStatus)}
        </span>
      </td>

      {/* Status Picker Controls */}
      <td style={{ ...cellStyle, minWidth: '280px' }}>
        {isRowDisabled ? (
          <div>
            <AttendanceStatusBadge status={currentStatus} />
            {disabledReason && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--status-danger-text)',
                  marginTop: '0.25rem',
                  fontStyle: 'italic'
                }}
              >
                ⚠️ {disabledReason}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {ATTENDANCE_STATUS_OPTIONS.map((opt) => {
                const isSelected = currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value)}
                    disabled={isRowDisabled}
                    aria-pressed={isSelected}
                    data-selected={isSelected}
                    data-testid={`status-btn-${student.studentId}-${opt.value.toLowerCase()}`}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid currentColor' : '1px solid var(--color-border)',
                      cursor: isRowDisabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: isSelected ? getSelectedBg(opt.value) : 'var(--color-surface)',
                      color: isSelected ? getSelectedColor(opt.value) : 'var(--color-text-secondary)'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {currentStatus === null && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                <em>Chưa điểm danh</em>
              </div>
            )}
          </div>
        )}
      </td>

      {/* Note Input */}
      <td style={{ ...cellStyle, minWidth: '180px' }}>
        <input
          type="text"
          placeholder={isRowDisabled ? '' : 'Ghi chú (tùy chọn)...'}
          value={currentNote}
          onChange={(e) => onNoteChange(e.target.value)}
          disabled={isRowDisabled}
          maxLength={500}
          data-testid={`note-input-${student.studentId}`}
          style={{
            width: '100%',
            padding: '0.375rem 0.5rem',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: isRowDisabled ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none'
          }}
        />
        {currentStatus === null && currentNote.trim().length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--status-danger-text)', marginTop: '0.25rem' }}>
            ⚠️ Hãy chọn trạng thái trước khi gửi ghi chú.
          </div>
        )}
      </td>
    </tr>
  );
};

const cellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle'
};

function getSelectedBg(status: AttendanceStatus): string {
  switch (status) {
    case 'Present':
      return 'var(--status-success-bg, #dcfce7)';
    case 'Absent':
      return 'var(--status-danger-bg, #fee2e2)';
    case 'Late':
      return 'var(--status-warning-bg, #fef3c7)';
    case 'Excused':
      return 'var(--status-info-bg, #e0f2fe)';
    default:
      return 'var(--color-surface-subtle)';
  }
}

function getSelectedColor(status: AttendanceStatus): string {
  switch (status) {
    case 'Present':
      return 'var(--status-success-text, #15803d)';
    case 'Absent':
      return 'var(--status-danger-text, #b91c1c)';
    case 'Late':
      return 'var(--status-warning-text, #b45309)';
    case 'Excused':
      return 'var(--status-info-text, #0369a1)';
    default:
      return 'var(--color-text-primary)';
  }
}
