import React, { useState, useRef } from 'react';
import type { SyllabusSectionItem } from '../../types/learningContent.types';
import { learningContentService } from '../../services/learningContent.service';
import { extractErrorMessage } from '../../utils/learningContentHelper';

interface SectionModalProps {
  isOpen: boolean;
  courseId: number;
  section: SyllabusSectionItem | null; // null = Create, non-null = Edit
  onClose: () => void;
  onSuccess: () => void;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  courseId,
  section,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState(section?.title || '');
  const [description, setDescription] = useState(section?.description || '');
  const [orderIndex, setOrderIndex] = useState<string>(section ? String(section.orderIndex) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const isEdit = Boolean(section);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    // Client-side validations
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Tiêu đề chương học không được để trống.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setErrorMessage('Tiêu đề chương không được vượt quá 200 ký tự.');
      return;
    }

    let parsedOrderIndex: number | null = null;
    if (orderIndex.trim() !== '') {
      const num = Number(orderIndex);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        setErrorMessage('Thứ tự sắp xếp phải là số nguyên lớn hơn hoặc bằng 0.');
        return;
      }
      parsedOrderIndex = num;
    } else if (isEdit && section) {
      parsedOrderIndex = section.orderIndex;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEdit && section) {
        // Update payload strictly: { title, description, orderIndex }
        const res = await learningContentService.updateSection(section.id, {
          title: trimmedTitle,
          description: description.trim() || null,
          orderIndex: parsedOrderIndex ?? 0
        });

        if (res.success) {
          onSuccess();
        } else {
          setErrorMessage(res.message || 'Cập nhật chương học thất bại.');
        }
      } else {
        // Create payload strictly: { courseId, title, description, orderIndex }
        const res = await learningContentService.createSection({
          courseId,
          title: trimmedTitle,
          description: description.trim() || null,
          orderIndex: parsedOrderIndex
        });

        if (res.success) {
          onSuccess();
        } else {
          setErrorMessage(res.message || 'Tạo mới chương học thất bại.');
        }
      }
    } catch (err: unknown) {
      // Preserve form content on failure
      const msg = extractErrorMessage(err, 'Thao tác không thành công. Vui lòng kiểm tra lại.');
      setErrorMessage(msg);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '520px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            id="section-modal-title"
            style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
          >
            {isEdit ? 'Chỉnh sửa chương học' : 'Thêm mới chương học'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer'
            }}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem'
            }}
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label
              htmlFor="section-title-input"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
            >
              Tiêu đề chương <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="section-title-input"
              type="text"
              required
              maxLength={200}
              placeholder="VD: Chương 1: Giới thiệu và phát âm cơ bản"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="section-description-input"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
            >
              Mô tả nội dung (tùy chọn)
            </label>
            <textarea
              id="section-description-input"
              rows={3}
              placeholder="Mô tả mục tiêu, yêu cầu hoặc nội dung trọng tâm của chương..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="section-order-input"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
            >
              Thứ tự hiển thị {isEdit && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
              id="section-order-input"
              type="number"
              min={0}
              placeholder={isEdit ? 'VD: 1' : 'Tự động tính (lớn nhất + 1) nếu để trống'}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-primary-border)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo chương'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
