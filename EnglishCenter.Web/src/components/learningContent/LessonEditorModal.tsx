import React, { useState, useRef } from 'react';
import type { LessonStatus, SyllabusLessonItem } from '../../types/learningContent.types';
import { learningContentService } from '../../services/learningContent.service';
import {
  extractErrorMessage,
  validatePublishedLesson,
  validateUrl
} from '../../utils/learningContentHelper';

interface LessonEditorModalProps {
  isOpen: boolean;
  sectionId: number;
  sectionTitle: string;
  lesson: SyllabusLessonItem | null; // null = Create, non-null = Edit
  onClose: () => void;
  onSuccess: () => void;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  sectionId,
  sectionTitle,
  lesson,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || '');
  const [audioUrl, setAudioUrl] = useState(lesson?.audioUrl || '');
  const [documentUrl, setDocumentUrl] = useState(lesson?.documentUrl || '');
  const [orderIndex, setOrderIndex] = useState<string>(lesson ? String(lesson.orderIndex) : '');
  const [status, setStatus] = useState<LessonStatus>(lesson?.status || 'Draft');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const isEdit = Boolean(lesson);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    // Client-side validations
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Tiêu đề bài học không được để trống.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setErrorMessage('Tiêu đề bài học không được vượt quá 200 ký tự.');
      return;
    }

    // URL validations
    const vCheck = validateUrl(videoUrl);
    if (!vCheck.isValid) {
      setErrorMessage(`Đường dẫn Video: ${vCheck.error}`);
      return;
    }
    const aCheck = validateUrl(audioUrl);
    if (!aCheck.isValid) {
      setErrorMessage(`Đường dẫn Audio: ${aCheck.error}`);
      return;
    }
    const dCheck = validateUrl(documentUrl);
    if (!dCheck.isValid) {
      setErrorMessage(`Đường dẫn Tài liệu: ${dCheck.error}`);
      return;
    }

    // Published content rule
    if (status === 'Published') {
      const hasContent = validatePublishedLesson({
        content,
        videoUrl,
        audioUrl,
        documentUrl
      });

      if (!hasContent) {
        setErrorMessage(
          'Bài học ở trạng thái "Đã xuất bản" phải có nội dung văn bản hoặc ít nhất một liên kết tài nguyên (video, audio, tài liệu).'
        );
        return;
      }
    }

    let parsedOrderIndex: number | null = null;
    if (orderIndex.trim() !== '') {
      const num = Number(orderIndex);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        setErrorMessage('Thứ tự sắp xếp phải là số nguyên lớn hơn hoặc bằng 0.');
        return;
      }
      parsedOrderIndex = num;
    } else if (isEdit && lesson) {
      parsedOrderIndex = lesson.orderIndex;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEdit && lesson) {
        // Update payload strictly: { title, content, videoUrl, audioUrl, documentUrl, orderIndex, status }
        const res = await learningContentService.updateLesson(lesson.id, {
          title: trimmedTitle,
          content: content.trim() || null,
          videoUrl: videoUrl.trim() || null,
          audioUrl: audioUrl.trim() || null,
          documentUrl: documentUrl.trim() || null,
          orderIndex: parsedOrderIndex ?? 0,
          status
        });

        if (res.success) {
          onSuccess();
        } else {
          setErrorMessage(res.message || 'Cập nhật bài học thất bại.');
        }
      } else {
        // Create payload strictly: { sectionId, title, content, videoUrl, audioUrl, documentUrl, orderIndex, status }
        const res = await learningContentService.createLesson({
          sectionId,
          title: trimmedTitle,
          content: content.trim() || null,
          videoUrl: videoUrl.trim() || null,
          audioUrl: audioUrl.trim() || null,
          documentUrl: documentUrl.trim() || null,
          orderIndex: parsedOrderIndex,
          status
        });

        if (res.success) {
          onSuccess();
        } else {
          setErrorMessage(res.message || 'Tạo mới bài học thất bại.');
        }
      }
    } catch (err: unknown) {
      // Preserve form content on failure
      const msg = extractErrorMessage(err, 'Thao tác bài học không thành công. Vui lòng kiểm tra lại.');
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
      aria-labelledby="lesson-modal-title"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3
              id="lesson-modal-title"
              style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
            >
              {isEdit ? 'Chỉnh sửa bài học' : 'Thêm mới bài học'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Thuộc chương: {sectionTitle}
            </span>
          </div>
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
              htmlFor="lesson-title-input"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
            >
              Tiêu đề bài học <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="lesson-title-input"
              type="text"
              required
              maxLength={200}
              placeholder="VD: Bài 1: Ngữ pháp thì hiện tại đơn"
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label
                htmlFor="lesson-status-select"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
              >
                Trạng thái bài học <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="lesson-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonStatus)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="Draft">Bản nháp (Draft)</option>
                <option value="Published">Đã xuất bản (Published)</option>
                <option value="Hidden">Đã ẩn (Hidden)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="lesson-order-input"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
              >
                Thứ tự bài học {isEdit && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <input
                id="lesson-order-input"
                type="number"
                min={0}
                placeholder={isEdit ? 'VD: 1' : 'Tự động tính nếu để trống'}
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
          </div>

          <div>
            <label
              htmlFor="lesson-content-input"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}
            >
              Nội dung văn bản (Plain Text)
            </label>
            <textarea
              id="lesson-content-input"
              rows={5}
              placeholder="Nhập nội dung bài học, hướng dẫn, ghi chú..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div
            style={{
              padding: '0.875rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              🔗 Liên kết tài nguyên số (tùy chọn)
            </span>

            <div>
              <label
                htmlFor="lesson-videourl-input"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--color-text-secondary)' }}
              >
                🎥 Video URL (HTTP/HTTPS)
              </label>
              <input
                id="lesson-videourl-input"
                type="url"
                maxLength={500}
                placeholder="https://example.com/videos/lesson1.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="lesson-audiourl-input"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--color-text-secondary)' }}
              >
                🎧 Audio URL (HTTP/HTTPS)
              </label>
              <input
                id="lesson-audiourl-input"
                type="url"
                maxLength={500}
                placeholder="https://example.com/audio/listening_part1.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="lesson-docurl-input"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.2rem', color: 'var(--color-text-secondary)' }}
              >
                📄 Tài liệu / Slides / PDF URL (HTTP/HTTPS)
              </label>
              <input
                id="lesson-docurl-input"
                type="url"
                maxLength={500}
                placeholder="https://example.com/docs/handout.pdf"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
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
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
