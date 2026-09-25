import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { SessionSelector } from '../../components/attendances/SessionSelector';
import { RosterRow } from '../../components/attendances/RosterRow';
import { BulkSaveBar } from '../../components/attendances/BulkSaveBar';
import { useAuth } from '../../hooks/useAuth';
import { attendanceService } from '../../services/attendance.service';
import type {
  AttendanceRosterItem,
  AttendanceSessionRoster,
  AttendanceStatus,
  BulkAttendanceItem,
  BulkUpsertAttendancePayload
} from '../../types/attendance.types';
import {
  extractAttendanceErrorMessage,
  formatAttendanceDate,
  getAttendanceBasePath,
  isValidCalendarDate,
  toDisplayTime,
  toWireTime
} from '../../utils/attendanceHelper';

interface StudentEditState {
  status: AttendanceStatus | null;
  note: string;
}

export const AttendanceSessionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = getAttendanceBasePath(location.pathname);

  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.toUpperCase() === 'ADMIN') ?? false;
  const isStaff = user?.roles?.some((r) => r.toUpperCase() === 'STAFF') ?? false;
  const isTeacher = user?.roles?.some((r) => r.toUpperCase() === 'TEACHER') ?? false;

  // URL query params
  const classIdParam = searchParams.get('classId');
  const sessionDateParam = searchParams.get('sessionDate');
  const startTimeParam = searchParams.get('startTime');

  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    classIdParam ? parseInt(classIdParam, 10) : null
  );
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>(
    sessionDateParam || ''
  );
  const [selectedStartTime, setSelectedStartTime] = useState<string>(
    startTimeParam ? toWireTime(startTimeParam) : ''
  );

  // Roster authoritative data
  const [roster, setRoster] = useState<AttendanceSessionRoster | null>(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Snapshot & current editing states
  const [initialSnapshot, setInitialSnapshot] = useState<Record<number, StudentEditState>>({});
  const [editingState, setEditingState] = useState<Record<number, StudentEditState>>({});

  // Submission state & anti-double-click ref
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Abort controller for GET
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch roster
  const fetchRoster = async (classId: number, sessionDate: string, startTime: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingRoster(true);
    setRosterError(null);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    try {
      const wireTime = toWireTime(startTime);
      const res = await attendanceService.getSessionRoster(
        { classId, sessionDate, startTime: wireTime },
        controller.signal
      );

      if (res.success && res.data) {
        const data = res.data;
        setRoster(data);

        // Build snapshot and edit state
        const snapshot: Record<number, StudentEditState> = {};
        data.students.forEach((st: AttendanceRosterItem) => {
          snapshot[st.studentId] = {
            status: st.status ?? null,
            note: st.note ?? ''
          };
        });

        setInitialSnapshot(snapshot);
        setEditingState(snapshot);
      } else {
        setRosterError(res.message || 'Không thể tải danh sách học viên cho buổi học này.');
        setRoster(null);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return; // Cancelled
      }
      setRosterError(extractAttendanceErrorMessage(err));
      setRoster(null);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  // Trigger fetch if query params in URL are valid
  useEffect(() => {
    if (
      classIdParam &&
      parseInt(classIdParam, 10) > 0 &&
      sessionDateParam &&
      isValidCalendarDate(sessionDateParam) &&
      startTimeParam
    ) {
      const cid = parseInt(classIdParam, 10);
      const wire = toWireTime(startTimeParam);
      const timer = setTimeout(() => {
        setSelectedClassId(cid);
        setSelectedSessionDate(sessionDateParam);
        setSelectedStartTime(wire);
        fetchRoster(cid, sessionDateParam, wire);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [classIdParam, sessionDateParam, startTimeParam]);

  // Handle load button from SessionSelector
  const handleLoadSession = () => {
    if (!selectedClassId || !selectedSessionDate || !selectedStartTime) {
      return;
    }
    const wireTime = toWireTime(selectedStartTime);
    setSearchParams({
      classId: String(selectedClassId),
      sessionDate: selectedSessionDate,
      startTime: wireTime
    });
    fetchRoster(selectedClassId, selectedSessionDate, wireTime);
  };

  // Row update handlers
  const handleStatusChange = (studentId: number, newStatus: AttendanceStatus | null) => {
    setEditingState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus
      }
    }));
  };

  const handleNoteChange = (studentId: number, newNote: string) => {
    setEditingState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note: newNote
      }
    }));
  };

  const isExistingSession = Boolean(roster?.attendanceSessionId);

  // Mark all eligible active students as Present
  const handleMarkAllPresent = () => {
    if (!roster) return;
    setEditingState((prev) => {
      const updated = { ...prev };
      roster.students.forEach((st) => {
        const isExistingRecord = st.attendanceId !== null && st.attendanceId !== undefined;
        const canEdit =
          isExistingRecord ||
          (st.canCreate && (isExistingSession || isTeacher));

        if (canEdit) {
          updated[st.studentId] = {
            ...updated[st.studentId],
            status: 'Present'
          };
        }
      });
      return updated;
    });
  };

  // Discard all changes and restore initial snapshot
  const handleDiscardChanges = () => {
    setEditingState(initialSnapshot);
    setSaveErrorMessage(null);
  };

  // Calculate dirty rows
  const dirtyItems: BulkAttendanceItem[] = [];
  let hasInvalidRows = false;

  if (roster) {
    roster.students.forEach((st) => {
      const current = editingState[st.studentId];
      const initial = initialSnapshot[st.studentId];
      if (!current || !initial) return;

      const isStatusChanged = current.status !== initial.status;
      const isNoteChanged = current.note.trim() !== initial.note.trim();

      if (isStatusChanged || isNoteChanged) {
        // Validation: If note is set but status is null, this is invalid
        if (current.status === null && current.note.trim().length > 0) {
          hasInvalidRows = true;
        }

        if (current.status !== null) {
          dirtyItems.push({
            studentId: st.studentId,
            status: current.status,
            note: current.note.trim().length > 0 ? current.note.trim() : null
          });
        }
      }
    });
  }

  const dirtyCount = dirtyItems.length;

  // Save bulk upsert
  const handleSaveSession = async () => {
    if (!roster || dirtyCount === 0 || isSubmittingRef.current || hasInvalidRows) {
      if (dirtyCount === 0) {
        setSaveErrorMessage('Không có thay đổi để lưu.');
      }
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    const payload: BulkUpsertAttendancePayload = {
      classId: roster.classId,
      sessionDate: roster.sessionDate,
      startTime: toWireTime(roster.startTime),
      records: dirtyItems
    };

    try {
      const res = await attendanceService.bulkUpsertSession(payload);
      if (res.success && res.data) {
        setSaveSuccessMessage('Lưu kết quả điểm danh thành công!');
        // Reload authoritative roster
        await fetchRoster(roster.classId, roster.sessionDate, roster.startTime);
      } else {
        setSaveErrorMessage(res.message || 'Lỗi khi lưu điểm danh.');
      }
    } catch (err: unknown) {
      setSaveErrorMessage(extractAttendanceErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Điểm danh buổi học"
        subtitle="Chọn buổi học và ghi nhận chuyên cần cho toàn bộ học viên"
        breadcrumbs={[
          { label: 'Trang chủ', path: basePath.startsWith('/admin') ? '/admin' : basePath.startsWith('/staff') ? '/staff' : '/teacher' },
          { label: 'Điểm danh', path: basePath },
          { label: 'Điểm danh buổi học' }
        ]}
        actions={
          <button
            id="back-to-attendance-history-btn"
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
            &larr; Quay lại lịch sử
          </button>
        }
      />

      {/* Session Selector */}
      <SessionSelector
        selectedClassId={selectedClassId}
        selectedSessionDate={selectedSessionDate}
        selectedStartTime={selectedStartTime}
        onClassSelect={(cid) => {
          setSelectedClassId(cid);
          setRoster(null);
        }}
        onDateChange={(dt) => setSelectedSessionDate(dt)}
        onTimeChange={(tm) => setSelectedStartTime(tm)}
        onSubmit={handleLoadSession}
        isLoading={isLoadingRoster}
        disabled={isSaving}
      />

      {/* Error Message from fetch */}
      {rosterError && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}
        >
          <strong>⚠️ Lỗi:</strong> {rosterError}
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-success-bg, #dcfce7)',
            color: 'var(--status-success-text, #15803d)',
            border: '1px solid var(--status-success-border, #86efac)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          ✓ {saveSuccessMessage}
        </div>
      )}

      {/* Save Failure Message */}
      {saveErrorMessage && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}
        >
          <strong>⚠️ Lỗi lưu dữ liệu:</strong> {saveErrorMessage}
        </div>
      )}

      {/* Loading state */}
      {isLoadingRoster && (
        <LoadingState message="Đang tải danh sách học viên của buổi học..." />
      )}

      {/* Roster Area */}
      {!isLoadingRoster && roster && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Session Overview Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Lớp: <span style={{ color: 'var(--color-primary)' }}>{roster.classCode}</span> — {roster.courseName}
                </h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Giáo viên: <strong>{roster.teacherName || 'Chưa phân công'}</strong> {roster.teacherCode && `(${roster.teacherCode})`}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    backgroundColor: isExistingSession
                      ? 'var(--status-info-bg, #e0f2fe)'
                      : 'var(--status-warning-bg, #fef3c7)',
                    color: isExistingSession
                      ? 'var(--status-info-text, #0369a1)'
                      : 'var(--status-warning-text, #b45309)',
                    border: '1px solid currentColor'
                  }}
                >
                  {isExistingSession ? '✓ Buổi học đã có bản ghi' : '⚠️ Buổi học mới (chưa có bản ghi)'}
                </div>

                {/* Quick mark all present */}
                {(isExistingSession || isTeacher) && (
                  <button
                    id="mark-all-present-btn"
                    type="button"
                    onClick={handleMarkAllPresent}
                    disabled={isSaving}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer'
                    }}
                    title="Đánh dấu Có mặt cho toàn bộ học viên đủ điều kiện"
                  >
                    ⚡ Tất cả có mặt
                  </button>
                )}
              </div>
            </div>

            {/* Session Time & Date Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Ngày học: </span>
                <strong>{formatAttendanceDate(roster.sessionDate)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Giờ bắt đầu: </span>
                <strong>{toDisplayTime(roster.startTime)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Sĩ số: </span>
                <strong>{roster.students.length}</strong> học viên
              </div>
            </div>

            {/* Section 15 Rule Banner: Admin/Staff without Teacher authority cannot create new session */}
            {!isExistingSession && (isAdmin || isStaff) && !isTeacher && (
              <div
                role="alert"
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-warning-bg, #fef3c7)',
                  color: 'var(--status-warning-text, #b45309)',
                  border: '1px solid var(--status-warning-border, #fcd34d)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5
                }}
              >
                <strong>ℹ️ Quyền hạn:</strong> Buổi học này chưa được khởi tạo điểm danh. Theo quy định bảo mật hệ thống, chỉ giảng viên phụ trách lớp học mới có quyền khởi tạo buổi học mới. Quản trị viên/Nhân viên chỉ có quyền xem hoặc điều chỉnh buổi học đã tồn tại.
              </div>
            )}
          </div>

          {/* Roster Table */}
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <table
              id="attendance-roster-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <th style={{ ...headerCellStyle, width: '120px' }}>Mã HV</th>
                  <th style={{ ...headerCellStyle, minWidth: '160px' }}>Họ và tên</th>
                  <th style={{ ...headerCellStyle, width: '120px' }}>Trạng thái lớp</th>
                  <th style={{ ...headerCellStyle, minWidth: '280px' }}>Điểm danh</th>
                  <th style={{ ...headerCellStyle, minWidth: '180px' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {roster.students.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Lớp học này chưa có học viên nào được ghi danh.
                    </td>
                  </tr>
                ) : (
                  roster.students.map((st) => {
                    const current = editingState[st.studentId] || {
                      status: st.status ?? null,
                      note: st.note ?? ''
                    };
                    const initial = initialSnapshot[st.studentId] || {
                      status: st.status ?? null,
                      note: st.note ?? ''
                    };

                    const isRowDirty =
                      current.status !== initial.status ||
                      current.note.trim() !== initial.note.trim();

                    return (
                      <RosterRow
                        key={st.studentId}
                        student={st}
                        currentStatus={current.status}
                        currentNote={current.note}
                        isDirty={isRowDirty}
                        isExistingSession={isExistingSession}
                        isTeacher={isTeacher}
                        isAdminOrStaff={isAdmin || isStaff}
                        onStatusChange={(status) => handleStatusChange(st.studentId, status)}
                        onNoteChange={(note) => handleNoteChange(st.studentId, note)}
                        disabled={isSaving}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sticky Bulk Save Bar */}
          <BulkSaveBar
            dirtyCount={dirtyCount}
            onSave={handleSaveSession}
            onDiscard={handleDiscardChanges}
            isSaving={isSaving}
            hasInvalidRows={hasInvalidRows}
            disabled={!isExistingSession && (isAdmin || isStaff) && !isTeacher}
          />
        </div>
      )}
    </AppShell>
  );
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap'
};
