import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AssignmentDetailCard } from '../../components/assignments/AssignmentDetailCard';
import { SubmissionDetailCard } from '../../components/assignments/SubmissionDetailCard';
import { StudentSubmissionForm } from '../../components/assignments/StudentSubmissionForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { assignmentService } from '../../services/assignment.service';
import type {
  AssignmentDetail,
  CreateSubmissionPayload,
  SubmissionDetail,
  UpdateSubmissionPayload
} from '../../types/assignment.types';
import { canStudentResubmit, canStudentSubmit } from '../../utils/assignmentHelper';

export const StudentAssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const id = assignmentId ? parseInt(assignmentId, 10) : NaN;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionDetail | null>(null);
  const [hasLoadedSubmission, setHasLoadedSubmission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(id) || id <= 0) {
      setError('Mã bài tập không hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch assignment detail
      const assignRes = await assignmentService.getAssignmentById(id, controller.signal);
      if (assignRes.success && assignRes.data) {
        setAssignment(assignRes.data);
      }

      // 2. Fetch my-submission
      try {
        const subRes = await assignmentService.getMySubmission(id, controller.signal);
        if (subRes.success && subRes.data) {
          setMySubmission(subRes.data);
        } else {
          setMySubmission(null);
        }
      } catch (subErr: unknown) {
        // 404 from my-submission simply means no submission yet
        if (subErr && typeof subErr === 'object' && 'response' in subErr) {
          const axErr = subErr as { response?: { status?: number } };
          if (axErr.response?.status === 404) {
            setMySubmission(null);
          }
        }
      } finally {
        setHasLoadedSubmission(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 404) {
          setError('Không tìm thấy bài tập hoặc bài tập chưa được công bố.');
        } else if (axErr.response?.status === 403) {
          setError('Bạn không có quyền truy cập bài tập của lớp học này.');
        } else {
          setError(axErr.response?.data?.message || 'Không thể tải thông tin bài tập.');
        }
      } else {
        setError('Không thể tải thông tin bài tập.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Handle Initial Submission
  const handleSubmitInitial = async (payload: CreateSubmissionPayload | UpdateSubmissionPayload) => {
    const res = await assignmentService.createSubmission(id, payload as CreateSubmissionPayload);
    if (res.success && res.data) {
      setMySubmission(res.data);
      setActionSuccessMessage('Nộp bài tập thành công!');
      // Reload assignment state
      const updatedAssign = await assignmentService.getAssignmentById(id);
      if (updatedAssign.success && updatedAssign.data) {
        setAssignment(updatedAssign.data);
      }
    }
  };

  // Handle Resubmission
  const handleResubmit = async (payload: CreateSubmissionPayload | UpdateSubmissionPayload) => {
    if (!mySubmission) return;
    const res = await assignmentService.updateSubmission(mySubmission.id, payload as UpdateSubmissionPayload);
    if (res.success && res.data) {
      setMySubmission(res.data);
      setActionSuccessMessage('Cập nhật bài nộp thành công!');
    }
  };

  // Determine submission eligibility
  const isInitialEligible = assignment
    ? canStudentSubmit(
        assignment.studentMembershipStatus,
        assignment.classStatus,
        assignment.status,
        !!mySubmission
      )
    : false;

  const isResubmitEligible = assignment && mySubmission
    ? canStudentResubmit(
        assignment.studentMembershipStatus,
        assignment.classStatus,
        assignment.status,
        !!mySubmission,
        mySubmission.isGraded,
        mySubmission.score
      )
    : false;

  return (
    <AppShell>
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/student/assignments"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-primary, #2563eb)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          ← Quay lại danh sách bài tập của tôi
        </Link>
      </div>

      <PageHeader
        title="Làm bài tập"
        subtitle={
          assignment
            ? `Lớp ${assignment.classCode} • ${assignment.courseName}`
            : 'Đang tải bài tập...'
        }
      />

      {error ? (
        <div
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-xl, 12px)',
            border: '1px solid var(--color-border, #e5e7eb)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>{error}</h3>
          <Link
            to="/student/assignments"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md, 6px)',
              textDecoration: 'none'
            }}
          >
            Quay lại danh sách bài tập
          </Link>
        </div>
      ) : isLoading || !assignment ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-xl, 12px)',
            border: '1px solid var(--color-border, #e5e7eb)',
            color: 'var(--color-text-secondary, #6b7280)'
          }}
        >
          Đang tải thông tin bài tập...
        </div>
      ) : (
        <>
          {/* Assignment Description Card */}
          <AssignmentDetailCard
            assignment={assignment}
            roleBaseUrl="/student"
            isStudent
          />

          {/* Submission Area */}
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary, #111827)' }}>
              Bài làm của bạn
            </h2>

            {assignment.studentMembershipStatus === 'Completed' && (
              <div
                id="student-completed-readonly-banner"
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#1d4ed8',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-md, 6px)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}
              >
                ℹ️ Bạn đã hoàn thành lớp học. Bài tập được hiển thị ở chế độ chỉ đọc.
              </div>
            )}

            {actionSuccessMessage && (
              <div
                id="student-submission-success-banner"
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md, 6px)',
                  marginBottom: '1rem',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}
              >
                ✓ {actionSuccessMessage}
              </div>
            )}

            {/* If Student has existing submission */}
            {hasLoadedSubmission && mySubmission ? (
              <div>
                <SubmissionDetailCard submission={mySubmission} isStudent />

                {/* If eligible for resubmit */}
                {isResubmitEligible && (
                  <StudentSubmissionForm
                    assignment={assignment}
                    existingSubmission={mySubmission}
                    onSubmit={handleResubmit}
                    isResubmit
                  />
                )}
              </div>
            ) : hasLoadedSubmission && !mySubmission ? (
              /* If no existing submission */
              isInitialEligible ? (
                <StudentSubmissionForm
                  assignment={assignment}
                  onSubmit={handleSubmitInitial}
                  isResubmit={false}
                />
              ) : (
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    borderRadius: 'var(--radius-lg, 8px)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    color: 'var(--color-text-secondary, #4b5563)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5
                  }}
                >
                  {assignment.studentMembershipStatus === 'Completed' ? (
                    <span>Bạn đã hoàn thành lớp học. Bài tập được hiển thị ở chế độ chỉ đọc.</span>
                  ) : assignment.status === 'Closed' ? (
                    <span>Bài tập đã đóng. Bạn chưa nộp bài tập này trước thời điểm đóng bài.</span>
                  ) : (
                    <span>Không thể nộp bài tập do trạng thái lớp học hoặc phân quyền hiện tại.</span>
                  )}
                </div>
              )
            ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
};
