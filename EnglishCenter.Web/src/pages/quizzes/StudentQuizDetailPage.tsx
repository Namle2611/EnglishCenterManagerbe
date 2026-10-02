import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { QuizStatusBadge } from '../../components/quizzes/QuizStatusBadge';
import { quizService } from '../../services/quiz.service';
import type { StudentQuizDetailResponse } from '../../types/quiz.types';
import { formatDateTime, getStudentQuizEligibility } from '../../utils/quizHelper';

export const StudentQuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const id = quizId ? parseInt(quizId, 10) : NaN;

  const [quiz, setQuiz] = useState<StudentQuizDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback(async () => {
    if (isNaN(id)) {
      setErrorMessage('Mã bài kiểm tra không hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await quizService.getQuizDetail(id, controller.signal);
      if (res.success && res.data) {
        setQuiz(res.data as StudentQuizDetailResponse);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin bài kiểm tra.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchDetail());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchDetail]);

  const handleStartOrResume = async () => {
    if (isStarting || !quiz) return;
    try {
      setIsStarting(true);
      setErrorMessage(null);
      const res = await quizService.startAttempt(quiz.id);
      if (res.success && res.data?.attemptId) {
        navigate(`/student/quiz-attempts/${res.data.attemptId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể bắt đầu lượt làm bài.';
      setErrorMessage(msg);
      fetchDetail();
    } finally {
      setIsStarting(false);
    }
  };

  const eligibility = quiz ? getStudentQuizEligibility(quiz) : null;

  return (
    <AppShell>
      <PageHeader
        title={quiz?.title || 'Thông tin bài kiểm tra'}
        subtitle="Chi tiết yêu cầu, thời lượng và quy định làm bài kiểm tra."
        breadcrumbs={[
          { label: 'Danh sách bài kiểm tra', path: '/student/quizzes' },
          { label: quiz?.title || 'Thông tin bài kiểm tra' }
        ]}
      />

      {errorMessage && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '1.5rem'
          }}
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Đang tải thông tin bài kiểm tra...
        </div>
      ) : quiz ? (
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {quiz.title}
            </h1>
            <QuizStatusBadge status={quiz.status} />
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Lớp học: <strong>{quiz.classCode}</strong> &bull; Khóa học: <strong>{quiz.courseName}</strong>
          </div>

          {quiz.description && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                lineHeight: 1.6,
                marginBottom: '1.5rem'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Hướng dẫn làm bài
              </h3>
              {quiz.description}
            </div>
          )}

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={labelStyle}>Thời lượng làm bài</div>
              <div style={valueStyle}>
                {quiz.durationMinutes ? `${quiz.durationMinutes} phút` : 'Không giới hạn thời gian'}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Số lần làm bài tối đa</div>
              <div style={valueStyle}>{quiz.maxAttempts} lần</div>
            </div>

            <div>
              <div style={labelStyle}>Lượt làm bài đã sử dụng</div>
              <div style={valueStyle}>{quiz.attemptCount} / {quiz.maxAttempts}</div>
            </div>

            <div>
              <div style={labelStyle}>Tổng điểm bài thi</div>
              <div style={valueStyle}>{quiz.maxScore} điểm</div>
            </div>

            <div>
              <div style={labelStyle}>Thời gian mở</div>
              <div style={valueStyle}>
                {quiz.startAt ? formatDateTime(quiz.startAt) : 'Mở tự do'}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Thời gian đóng</div>
              <div style={valueStyle}>
                {quiz.endAt ? formatDateTime(quiz.endAt) : 'Vô thời hạn'}
              </div>
            </div>
          </div>

          {eligibility?.reason && (
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>ℹ️</span>
              <span>{eligibility.reason}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleStartOrResume}
              disabled={isStarting || (!eligibility?.canStart && !eligibility?.canResume)}
              style={{
                flex: 1,
                minHeight: '48px',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: eligibility?.canResume
                  ? 'var(--status-warning-bg, #f59e0b)'
                  : eligibility?.canStart
                  ? 'var(--color-primary)'
                  : 'var(--color-surface-subtle)',
                color: eligibility?.canStart || eligibility?.canResume
                  ? 'var(--color-text-inverse, #ffffff)'
                  : 'var(--color-text-secondary)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: eligibility?.canStart || eligibility?.canResume ? 'pointer' : 'not-allowed',
                boxShadow: eligibility?.canStart || eligibility?.canResume ? 'var(--shadow-md)' : 'none'
              }}
            >
              {isStarting
                ? 'Đang chuẩn bị đề thi...'
                : eligibility?.buttonLabel || 'Bắt đầu làm bài'}
            </button>

            <Link
              to={`/student/quizzes/${quiz.id}/attempts`}
              style={{
                minHeight: '48px',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9375rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              📜 Lịch sử các lần làm bài ({quiz.attemptCount})
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Không tìm thấy bài kiểm tra.
        </div>
      )}
    </AppShell>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.25rem'
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)'
};
