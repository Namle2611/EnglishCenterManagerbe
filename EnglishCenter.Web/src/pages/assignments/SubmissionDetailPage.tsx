import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { SubmissionDetailCard } from '../../components/assignments/SubmissionDetailCard';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { assignmentService } from '../../services/assignment.service';
import type { SubmissionDetail } from '../../types/assignment.types';

export const SubmissionDetailPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const location = useLocation();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const id = submissionId ? parseInt(submissionId, 10) : NaN;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback(async () => {
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

    try {
      const res = await assignmentService.getSubmissionById(id, controller.signal);
      if (res.success && res.data) {
        setSubmission(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 404) {
          setError('Không tìm thấy bài nộp hoặc bài nộp không tồn tại.');
        } else if (axErr.response?.status === 403) {
          setError('Bạn không có quyền xem bài nộp này.');
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
      fetchDetail();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDetail]);

  const backLink = submission
    ? `${roleBaseUrl}/assignments/${submission.assignmentId}`
    : `${roleBaseUrl}/assignments`;

  return (
    <AppShell>
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to={backLink}
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
          ← Quay lại chi tiết bài tập
        </Link>
      </div>

      <PageHeader
        title="Chi tiết bài nộp"
        subtitle={
          submission
            ? `Học viên: ${submission.studentName} (${submission.studentCode}) • ${submission.assignmentTitle}`
            : 'Đang tải bài nộp...'
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
            to={`${roleBaseUrl}/assignments`}
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
        <SubmissionDetailCard submission={submission} isStudent={false} />
      )}
    </AppShell>
  );
};
