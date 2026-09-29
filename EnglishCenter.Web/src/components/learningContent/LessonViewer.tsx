import React, { useState } from 'react';
import type { LessonStatus, SyllabusLessonItem } from '../../types/learningContent.types';
import { LessonStatusBadge } from './LessonStatusBadge';
import { ResourceLinkCard } from './ResourceLinkCard';
import { validatePublishedLesson } from '../../utils/learningContentHelper';

interface LessonViewerProps {
  lesson: SyllabusLessonItem | null;
  userRole: 'ADMIN' | 'STAFF' | 'TEACHER';
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (newStatus: LessonStatus) => void;
  isStatusPatching: boolean;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  userRole,
  onEdit,
  onDelete,
  onStatusChange,
  isStatusPatching
}) => {
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!lesson) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          minHeight: '360px'
        }}
      >
        <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">
          📖
        </span>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
          Chưa chọn bài học
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: '320px' }}>
          Vui lòng chọn một bài học từ khung danh mục bên cạnh để xem nội dung chi tiết.
        </p>
      </div>
    );
  }

  const isTeacher = userRole === 'TEACHER';
  const hasResources = Boolean(lesson.videoUrl || lesson.audioUrl || lesson.documentUrl);

  const handleQuickStatus = (targetStatus: LessonStatus) => {
    if (targetStatus === lesson.status || isStatusPatching) return;

    if (targetStatus === 'Published') {
      const isValid = validatePublishedLesson({
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        audioUrl: lesson.audioUrl,
        documentUrl: lesson.documentUrl
      });

      if (!isValid) {
        setStatusError(
          'Không thể xuất bản: Bài học phải có nội dung văn bản hoặc ít nhất một liên kết tài nguyên.'
        );
        return;
      }
    }

    setStatusError(null);
    onStatusChange(targetStatus);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.5rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-subtle)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)'
              }}
            >
              Thứ tự #{lesson.orderIndex}
            </span>
            <LessonStatusBadge status={lesson.status} />
          </div>

          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {lesson.title}
          </h2>
        </div>

        {/* Action Controls for Admin/Staff ONLY */}
        {!isTeacher && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Quick Status Action Controls */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {lesson.status !== 'Published' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus('Published')}
                  disabled={isStatusPatching}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #bbf7d0',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: isStatusPatching ? 'not-allowed' : 'pointer'
                  }}
                  title="Xuất bản bài học ngay"
                >
                  ✓ Xuất bản
                </button>
              )}

              {lesson.status !== 'Draft' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus('Draft')}
                  disabled={isStatusPatching}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fde68a',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: isStatusPatching ? 'not-allowed' : 'pointer'
                  }}
                  title="Chuyển về bản nháp"
                >
                  ✎ Bản nháp
                </button>
              )}

              {lesson.status !== 'Hidden' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus('Hidden')}
                  disabled={isStatusPatching}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: isStatusPatching ? 'not-allowed' : 'pointer'
                  }}
                  title="Ẩn bài học"
                >
                  Ẩn
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onEdit}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Chỉnh sửa
            </button>

            <button
              type="button"
              onClick={onDelete}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--status-danger-border)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Xóa bài học"
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      {statusError && (
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
          {statusError}
        </div>
      )}

      {/* Lesson Text Content (Safe plain text with pre-wrap) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Nội dung bài học
        </h4>
        {lesson.content ? (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {lesson.content}
          </div>
        ) : (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-border)',
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
              fontStyle: 'italic'
            }}
          >
            Bài học này không có nội dung văn bản.
          </div>
        )}
      </div>

      {/* Resource Links Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tài nguyên trực tuyến ({hasResources ? 'Đính kèm' : 'Trống'})
        </h4>

        {hasResources ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {lesson.videoUrl && <ResourceLinkCard type="video" url={lesson.videoUrl} />}
            {lesson.audioUrl && <ResourceLinkCard type="audio" url={lesson.audioUrl} />}
            {lesson.documentUrl && <ResourceLinkCard type="document" url={lesson.documentUrl} />}
          </div>
        ) : (
          <div
            style={{
              padding: '0.875rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--color-border)',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem'
            }}
          >
            Chưa có tài nguyên trực tuyến đính kèm cho bài học này.
          </div>
        )}
      </div>
    </div>
  );
};
