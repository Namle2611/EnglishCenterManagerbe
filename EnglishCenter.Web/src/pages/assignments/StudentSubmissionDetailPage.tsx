import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { canStudentResubmit } from '../../utils/assignmentHelper';

export const StudentSubmissionDetailPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const id = submissionId ? parseInt(submissionId, 10) : NaN;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isAssignmentForbidden, setIsAssignmentForbidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(id) || id <= 0) {
      setError('Mã bài nộp không hợp lệ.');
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
    setIsAssignmentForbidden(false);

    try {
      // 1. Load own submission
      const subRes = await assignmentService.getSubmissionById(id, controller.signal);
      if (!subRes.success || !subRes.data) {
        setError('Không tìm thấy bài nộp.');
        setIsLoading(false);
        return;
      }
      setSubmission(subRes.data);

      // 2. Load associated assignment to determine capabilities
      try {
        const assignRes = await assignmentService.getAssignmentById(
          subRes.data.assignmentId,
          controller.signal
        );
        if (assignRes.success && assignRes.data) {
          setAssignment(assignRes.data);
        }
      } catch (assignErr: unknown) {
        // If 403 on Assignment while Submission itself succeeded:
        // Supports Withdrawn student historical read-only access!
        if (assignErr && typeof assignErr === 'object' && 'response' in assignErr) {
          const axErr = assignErr as { response?: { status?: number } };
          if (axErr.response?.status === 403) {
            setIsAssignmentForbidden(true);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 404) {
          setError('Không tìm thấy bài nộp hoặc bài nộp đã bị xóa.');
        } else if (axErr.response?.status === 403) {
          setError('Bạn không có quyền truy cập bài nộp này.');
        } else {
          setError(axErr.response?.data?.message || 'Không thể tải thông tin bài nộp.');
        }
      } else {
        setError('Không thể tải thông tin bài nộp.');
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

  // Handle Resubmission
  const handleResubmit = async (payload: CreateSubmissionPayload | UpdateSubmissionPayload) => {
    if (!submission) return;
    const res = await assignmentService.updateSubmission(submission.id, payload as UpdateSubmissionPayload);
    if (res.success && res.data) {
      setSubmission(res.data);
    }
  };

  // Determine if student can resubmit
  // If assignment is forbidden (Withdrawn), resubmit is strictly false.
  const isResubmitEligible =
    !isAssignmentForbidden && assignment && submission
      ? canStudentResubmit(
          assignment.studentMembershipStatus,
          assignment.classStatus,
          assignment.status,
          true,
          submission.isGraded,
          submission.score
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
        title="Chi tiết bài nộp của tôi"
        subtitle={submission ? submission.assignmentTitle : 'Đang tải bài nộp...'}
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
      ) : isLoading || !submission ? (
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
          Đang tải thông tin bài nộp...
        </div>
      ) : (
        <>
          {/* If assignment forbidden (Withdrawn student historical state) */}
          {isAssignmentForbidden && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                color: '#4b5563',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5
              }}
            >
              ℹ️ Lịch sử bài nộp của lớp học trước đây. Bài làm được lưu trữ ở chế độ chỉ đọc.
            </div>
          )}

          <SubmissionDetailCard submission={submission} isStudent />

          {/* Resubmit form if eligible */}
          {isResubmitEligible && assignment && (
            <StudentSubmissionForm
              assignment={assignment}
              existingSubmission={submission}
              onSubmit={handleResubmit}
              isResubmit
            />
          )}
        </>
      )}
    </AppShell>
  );
};
