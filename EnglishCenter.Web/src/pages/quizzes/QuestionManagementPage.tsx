import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { DeleteQuestionModal } from '../../components/quizzes/DeleteQuestionModal';
import { QuestionFormModal } from '../../components/quizzes/QuestionFormModal';
import { QuestionList } from '../../components/quizzes/QuestionList';
import { quizService } from '../../services/quiz.service';
import type {
  QuestionManagementResponse,
  QuestionOptionRequest,
  QuestionType,
  QuizDetailResponse
} from '../../types/quiz.types';

export const QuestionManagementPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const id = quizId ? parseInt(quizId, 10) : NaN;

  const [quiz, setQuiz] = useState<QuizDetailResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionManagementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<QuestionManagementResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionManagementResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
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

      const [quizRes, qnRes] = await Promise.all([
        quizService.getQuizDetail(id, controller.signal),
        quizService.getQuestions(id, controller.signal)
      ]);

      if (quizRes.success && quizRes.data) {
        setQuiz(quizRes.data as QuizDetailResponse);
      }
      if (qnRes.success && qnRes.data) {
        setQuestions(qnRes.data);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách câu hỏi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [loadData]);

  const isReadOnly = (quiz?.attemptCount || 0) > 0;

  const handleCreateOpen = () => {
    setQuestionToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditOpen = (qn: QuestionManagementResponse) => {
    setQuestionToEdit(qn);
    setIsFormModalOpen(true);
  };

  const handleDeleteOpen = (qn: QuestionManagementResponse) => {
    setQuestionToDelete(qn);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData: {
    content: string;
    questionType: QuestionType;
    correctTextAnswer?: string | null;
    score: number;
    orderIndex: number;
    options?: QuestionOptionRequest[];
  }) => {
    try {
      if (questionToEdit) {
        await quizService.updateQuestion(id, questionToEdit.id, formData);
      } else {
        await quizService.createQuestion(id, formData);
      }
      loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Post-attempt immutability conflict
        setIsFormModalOpen(false);
        loadData();
        setErrorMessage(
          'Bài kiểm tra đã có lượt làm bài từ học viên. Không thể chỉnh sửa hoặc thêm câu hỏi mới.'
        );
        return;
      }
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;
    try {
      await quizService.deleteQuestion(id, questionToDelete.id);
      loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setIsDeleteModalOpen(false);
        loadData();
        setErrorMessage(
          'Bài kiểm tra đã có học viên làm bài. Không thể xóa câu hỏi.'
        );
        return;
      }
      throw err;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={`Ngân hàng câu hỏi: ${quiz?.title || 'Bài kiểm tra'}`}
        subtitle={`Lớp: ${quiz?.classCode || '...'} • Tổng điểm: ${quiz?.maxScore || 0} điểm`}
        breadcrumbs={[
          { label: 'Chi tiết bài kiểm tra', path: `${roleBaseUrl}/quizzes/${id}` },
          { label: 'Ngân hàng câu hỏi' }
        ]}
        actions={
          !isReadOnly ? (
            <button
              type="button"
              onClick={handleCreateOpen}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>+</span> Thêm câu hỏi
            </button>
          ) : undefined
        }
      />

      {isReadOnly && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.12))',
            color: 'var(--status-warning-text, #b45309)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.3))',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
          <div>
            <strong>Chế độ chỉ xem:</strong> Bài kiểm tra đã có <strong>{quiz?.attemptCount}</strong> lượt làm bài.
            Nội dung câu hỏi và thang điểm đã được khóa để bảo đảm tính toàn vẹn kết quả thi.
          </div>
        </div>
      )}

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
          Đang tải danh sách câu hỏi...
        </div>
      ) : (
        <QuestionList
          questions={questions}
          isReadOnly={isReadOnly}
          onEdit={handleEditOpen}
          onDelete={handleDeleteOpen}
        />
      )}

      <QuestionFormModal
        isOpen={isFormModalOpen}
        questionToEdit={questionToEdit}
        defaultOrderIndex={questions.length + 1}
        onSubmit={handleFormSubmit}
        onClose={() => setIsFormModalOpen(false)}
      />

      <DeleteQuestionModal
        isOpen={isDeleteModalOpen}
        question={questionToDelete}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </AppShell>
  );
};
