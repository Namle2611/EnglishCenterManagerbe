import React, { useEffect, useRef, useState } from 'react';
import type {
  AssignmentDetail,
  AssignmentListItem,
  AssignmentStatus,
  CreateAssignmentPayload,
  UpdateAssignmentPayload
} from '../../types/assignment.types';
import {
  canTransitionStatus,
  isValidHttpUrl,
  localInputToUtc,
  normalizeNullableString,
  utcToLocalInput
} from '../../utils/assignmentHelper';
import { ClassLookupSelector } from './ClassLookupSelector';

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate?: (payload: CreateAssignmentPayload) => Promise<void>;
  onSubmitUpdate?: (id: number, payload: UpdateAssignmentPayload) => Promise<void>;
  initialData?: AssignmentListItem | AssignmentDetail | null;
  defaultClassId?: number;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  initialData,
  defaultClassId
}) => {
  const isEdit = !!initialData;

  // Form State
  const [classId, setClassId] = useState<number>(initialData?.classId || defaultClassId || 0);
  const [classStatus, setClassStatus] = useState<string | undefined>(
    (initialData as AssignmentDetail)?.classStatus
  );
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [description, setDescription] = useState<string>(
    (initialData as AssignmentDetail)?.description || ''
  );
  const [attachmentUrl, setAttachmentUrl] = useState<string>(
    (initialData as AssignmentDetail)?.attachmentUrl || ''
  );
  const [localDeadline, setLocalDeadline] = useState<string>(
    initialData ? utcToLocalInput(initialData.deadline) : ''
  );
  const [maxScore, setMaxScore] = useState<string>(
    initialData ? initialData.maxScore.toString() : '100'
  );
  const [status, setStatus] = useState<AssignmentStatus>(
    initialData?.status || 'Draft'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (initialData) {
          setClassId(initialData.classId);
          setClassStatus((initialData as AssignmentDetail)?.classStatus);
          setTitle(initialData.title);
          setDescription((initialData as AssignmentDetail)?.description || '');
          setAttachmentUrl((initialData as AssignmentDetail)?.attachmentUrl || '');
          setLocalDeadline(utcToLocalInput(initialData.deadline));
          setMaxScore(initialData.maxScore.toString());
          setStatus(initialData.status);
        } else {
          setClassId(defaultClassId || 0);
          setClassStatus(undefined);
          setTitle('');
          setDescription('');
          setAttachmentUrl('');
          setLocalDeadline('');
          setMaxScore('100');
          setStatus('Draft');
        }
        setErrors({});
        setServerError(null);
        setIsSubmitting(false);
        submitLockRef.current = false;
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData, defaultClassId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Class selection (Create only)
    if (!isEdit) {
      if (!classId || classId <= 0) {
        newErrors.classId = 'Vui lòng chọn lớp học';
      }
      if (classStatus === 'Completed' || classStatus === 'Cancelled') {
        newErrors.classId = 'Không thể tạo bài tập cho lớp học đã kết thúc hoặc bị hủy.';
      }
    }

    // Title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Tiêu đề không được để trống';
    } else if (trimmedTitle.length > 200) {
      newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }

    // Attachment URL
    if (attachmentUrl && attachmentUrl.trim()) {
      const trimmedUrl = attachmentUrl.trim();
      if (trimmedUrl.length > 500) {
        newErrors.attachmentUrl = 'Đường dẫn đính kèm không được vượt quá 500 ký tự';
      } else if (!isValidHttpUrl(trimmedUrl)) {
        newErrors.attachmentUrl = 'Đường dẫn phải là URL hợp lệ bắt đầu bằng http:// hoặc https://';
      }
    }

    // Deadline
    if (!localDeadline) {
      newErrors.deadline = 'Hạn nộp không được để trống';
    } else {
      const utcIso = localInputToUtc(localDeadline);
      const deadlineTime = new Date(utcIso).getTime();

      if (isNaN(deadlineTime)) {
        newErrors.deadline = 'Thời gian hạn nộp không hợp lệ';
      } else if (!isEdit) {
        // Create always requires future deadline
        if (deadlineTime <= Date.now()) {
          newErrors.deadline = 'Hạn nộp khi tạo bài tập phải ở tương lai';
        }
      } else {
        // Edit: Resulting Draft requires future deadline
        if (status === 'Draft' && deadlineTime <= Date.now()) {
          newErrors.deadline = 'Bài tập ở trạng thái Bản nháp phải có hạn nộp ở tương lai';
        }
      }
    }

    // MaxScore
    const numScore = parseFloat(maxScore);
    if (isNaN(numScore)) {
      newErrors.maxScore = 'Điểm tối đa phải là một số';
    } else if (numScore <= 0) {
      newErrors.maxScore = 'Điểm tối đa phải lớn hơn 0';
    } else if (numScore > 999.99) {
      newErrors.maxScore = 'Điểm tối đa không được vượt quá 999.99';
    }

    // Status transition rules for Edit
    if (isEdit && initialData) {
      const transitionCheck = canTransitionStatus(
        initialData.status,
        status,
        initialData.submissionCount || 0
      );
      if (!transitionCheck.allowed) {
        newErrors.status = transitionCheck.reason || 'Chuyển trạng thái không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Synchronous double-submit guard
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setServerError(null);

    const utcDeadline = localInputToUtc(localDeadline);

    try {
      if (isEdit && initialData && onSubmitUpdate) {
        const updatePayload: UpdateAssignmentPayload = {
          title: title.trim(),
          description: normalizeNullableString(description),
          attachmentUrl: normalizeNullableString(attachmentUrl),
          deadline: utcDeadline,
          maxScore: parseFloat(maxScore),
          status
        };
        await onSubmitUpdate(initialData.id, updatePayload);
      } else if (!isEdit && onSubmitCreate) {
        const createPayload: CreateAssignmentPayload = {
          classId,
          title: title.trim(),
          description: normalizeNullableString(description),
          attachmentUrl: normalizeNullableString(attachmentUrl),
          deadline: utcDeadline,
          maxScore: parseFloat(maxScore),
          status
        };
        await onSubmitCreate(createPayload);
      }
      onClose();
    } catch (err: unknown) {
      // Preserve form values on error
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        const msg = axErr.response?.data?.message || '';
        if (msg.toLowerCase().includes('already exists')) {
          setServerError('Tiêu đề bài tập đã tồn tại trong lớp học này.');
        } else {
          setServerError(msg || 'Có lỗi xảy ra khi lưu bài tập');
        }
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Có lỗi xảy ra khi lưu bài tập');
      }
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div
      id="assignment-form-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 12px)',
          width: '100%',
          maxWidth: '36rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
            {isEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
          </h2>
          <button
            id="assignment-form-close-x-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--color-text-secondary, #6b7280)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body / Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {serverError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  borderRadius: 'var(--radius-md, 6px)',
                  fontSize: '0.875rem'
                }}
              >
                {serverError}
              </div>
            )}

            {/* Class Selector / Info */}
            {!isEdit ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Lớp học <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <ClassLookupSelector
                  id="modal-class-lookup-selector"
                  value={classId}
                  onChange={(cId, item) => {
                    setClassId(cId);
                    setClassStatus(item?.status);
                  }}
                  filterPlannedOngoingOnly
                  placeholder="-- Chọn lớp học --"
                />
                {errors.classId && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
                    {errors.classId}
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: '1px solid var(--color-border, #e5e7eb)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                  Lớp học & Giảng viên (Cố định)
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary, #111827)' }}>
                  {initialData?.classCode} - {initialData?.courseName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #4b5563)' }}>
                  Giảng viên khi tạo bài: <strong>{initialData?.teacherName}</strong>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="assignment-form-title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Tiêu đề bài tập <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="assignment-form-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài tập (tối đa 200 ký tự)..."
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${errors.title ? '#dc2626' : 'var(--color-border, #d1d5db)'}`,
                  borderRadius: 'var(--radius-md, 6px)',
                  boxSizing: 'border-box'
                }}
              />
              {errors.title && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
                  {errors.title}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="assignment-form-desc" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Mô tả chi tiết / Hướng dẫn
              </label>
              <textarea
                id="assignment-form-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập hướng dẫn làm bài tập (tùy chọn)..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid var(--color-border, #d1d5db)',
                  borderRadius: 'var(--radius-md, 6px)',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Attachment URL */}
            <div>
              <label htmlFor="assignment-form-attachment" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Đường dẫn tài liệu đính kèm (URL)
              </label>
              <input
                id="assignment-form-attachment"
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/document.pdf (tùy chọn, tối đa 500 ký tự)"
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${errors.attachmentUrl ? '#dc2626' : 'var(--color-border, #d1d5db)'}`,
                  borderRadius: 'var(--radius-md, 6px)',
                  boxSizing: 'border-box'
                }}
              />
              {errors.attachmentUrl && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
                  {errors.attachmentUrl}
                </span>
              )}
            </div>

            {/* Grid for Deadline, MaxScore, Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              {/* Deadline */}
              <div>
                <label htmlFor="assignment-form-deadline" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Hạn nộp <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="assignment-form-deadline"
                  type="datetime-local"
                  value={localDeadline}
                  onChange={(e) => setLocalDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.85rem',
                    border: `1px solid ${errors.deadline ? '#dc2626' : 'var(--color-border, #d1d5db)'}`,
                    borderRadius: 'var(--radius-md, 6px)',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.deadline && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
                    {errors.deadline}
                  </span>
                )}
              </div>

              {/* Max Score */}
              <div>
                <label htmlFor="assignment-form-maxscore" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Điểm tối đa <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="assignment-form-maxscore"
                  type="number"
                  step="any"
                  min="0.01"
                  max="999.99"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.85rem',
                    border: `1px solid ${errors.maxScore ? '#dc2626' : 'var(--color-border, #d1d5db)'}`,
                    borderRadius: 'var(--radius-md, 6px)',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.maxScore && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
                    {errors.maxScore}
                  </span>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="assignment-form-status" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Trạng thái <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id="assignment-form-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.85rem',
                    border: `1px solid ${errors.status ? '#dc2626' : 'var(--color-border, #d1d5db)'}`,
                    borderRadius: 'var(--radius-md, 6px)',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Draft option is disabled if editing Closed, or Published with >0 submissions */}
                  {(!isEdit ||
                    (initialData?.status !== 'Closed' &&
                      !(initialData?.status === 'Published' && (initialData.submissionCount || 0) > 0))) && (
                    <option value="Draft">Bản nháp</option>
                  )}
                  <option value="Published">Đang mở</option>
                  <option value="Closed">Đã đóng</option>
                </select>
                {errors.status && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
                    {errors.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--color-border, #e5e7eb)',
              backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button
              id="assignment-form-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary, #4b5563)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              id="assignment-form-submit-btn"
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: 'var(--color-primary, #2563eb)',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
