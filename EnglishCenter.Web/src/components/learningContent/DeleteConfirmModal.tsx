import React, { useRef } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemType: 'section' | 'lesson';
  itemTitle: string;
  isBlocked?: boolean;
  blockReason?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  itemType,
  itemTitle,
  isBlocked = false,
  blockReason,
  isDeleting,
  onConfirm,
  onClose
}) => {
  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (isBlocked || isDeleting || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    onConfirm();
    // Reset after a safety tick in case parent keeps modal open on error
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);
  };

  const typeName = itemType === 'section' ? 'chương học' : 'bài học';

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
      aria-labelledby="delete-confirm-title"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '460px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isBlocked ? '#fef3c7' : 'var(--status-danger-bg)',
              color: isBlocked ? '#b45309' : 'var(--status-danger-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0
            }}
          >
            {isBlocked ? '⚠️' : '🗑️'}
          </div>
          <div>
            <h3
              id="delete-confirm-title"
              style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
            >
              {isBlocked ? `Không thể xóa ${typeName}` : `Xác nhận xóa ${typeName}`}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi hệ thống.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
            Tên {typeName}:
          </span>
          <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
            {itemTitle}
          </strong>
        </div>

        {isBlocked && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              lineHeight: 1.4
            }}
            role="alert"
          >
            {blockReason || `Không thể xóa ${typeName} này do vẫn còn dữ liệu phụ thuộc.`}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Đóng"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            {isBlocked ? 'Đóng' : 'Hủy bỏ'}
          </button>

          {!isBlocked && (
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isDeleting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--status-danger-border)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
