import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { DeleteQuizModal } from '../../components/quizzes/DeleteQuizModal';
import { QuizDetailCard } from '../../components/quizzes/QuizDetailCard';
import { QuizFormModal } from '../../components/quizzes/QuizFormModal';
import { quizService } from '../../services/quiz.service';
import type { QuizDetailResponse, TeacherQuizClassLookupItemResponse } from '../../types/quiz.types';

export const QuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const id = quizId ? parseInt(quizId, 10) : NaN;

  const [quiz, setQuiz] = useState<QuizDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Lookups for edit modal
  const [classes, setClasses] = useState<TeacherQuizClassLookupItemResponse[]>([]);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        setQuiz(res.data as QuizDetailResponse);
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

  useEffect(() => {
    let isCancelled = false;
    const loadClasses = async () => {
      try {
        const res = await quizService.getTeacherClassLookup({ page: 1, pageSize: 100 });
        if (!isCancelled && res.success && res.data) {
          setClasses(res.data.items);
        }
      } catch {
        // Ignore
      }
    };
    loadClasses();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handlePublish = async () => {
    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      const res = await quizService.publishQuiz(id);
      if (res.success && res.data) {
        setQuiz(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất bản bài kiểm tra thất bại.';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCloseQuiz = async () => {
    const confirmed = window.confirm(
      'Đóng bài kiểm tra sẽ không cho phép học viên bắt đầu lượt làm bài mới. Các lượt làm bài có thời gian đếm ngược đang diễn ra vẫn được tiếp tục đến khi hết giờ. Bạn có chắc chắn muốn đóng?'
    );
    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      const res = await quizService.closeQuiz(id);
      if (res.success && res.data) {
        setQuiz(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đóng bài kiểm tra thất bại.';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopen = async () => {
    try {
      setIsActionLoading(true);
      setErrorMessage(null);
      const res = await quizService.reopenQuiz(id);
      if (res.success && res.data) {
        setQuiz(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mở lại bài kiểm tra thất bại.';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditSubmit = async (formData: {
    classId: number;
    title: string;
    description: string;
    durationMinutes: number | null;
    maxAttempts: number;
    startAt: string;
    endAt: string;
  }) => {
    const res = await quizService.updateQuiz(id, formData);
    if (res.success && res.data) {
      setQuiz(res.data);
    }
  };

  const handleDeleteConfirm = async () => {
    await quizService.deleteQuiz(id);
    navigate(`${roleBaseUrl}/quizzes`, { replace: true });
  };

  return (
    <AppShell>
      <PageHeader
        title={quiz?.title || 'Chi tiết bài kiểm tra'}
        subtitle="Tổng quan thiết lập bài kiểm tra, ngân hàng câu hỏi và thống kê nộp bài."
        breadcrumbs={[
          { label: 'Danh sách bài kiểm tra', path: `${roleBaseUrl}/quizzes` },
          { label: quiz?.title || 'Chi tiết bài kiểm tra' }
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
            marginBottom: '1.25rem'
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
        <>
          <QuizDetailCard
            quiz={quiz}
            roleBaseUrl={roleBaseUrl}
            isActionLoading={isActionLoading}
            onPublish={handlePublish}
            onCloseQuiz={handleCloseQuiz}
            onReopen={handleReopen}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
          />

          <QuizFormModal
            isOpen={isEditModalOpen}
            quizToEdit={quiz}
            classes={classes}
            onSubmit={handleEditSubmit}
            onClose={() => setIsEditModalOpen(false)}
          />

          <DeleteQuizModal
            isOpen={isDeleteModalOpen}
            quiz={quiz}
            onConfirm={handleDeleteConfirm}
            onClose={() => setIsDeleteModalOpen(false)}
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Không tìm thấy bài kiểm tra.
        </div>
      )}
    </AppShell>
  );
};
