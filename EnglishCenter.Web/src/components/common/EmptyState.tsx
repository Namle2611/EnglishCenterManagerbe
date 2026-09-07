import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description = 'Hiện tại không có mục nào khớp với điều kiện tìm kiếm của bạn.',
  actionText,
  onAction,
  icon
}) => {
  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>
        {icon || (
          <svg
            style={{ width: '48px', height: '48px', color: 'var(--color-text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>
      {actionText && onAction && (
        <button type="button" onClick={onAction} style={buttonStyle}>
          {actionText}
        </button>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3.5rem 1.5rem',
  textAlign: 'center',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px dashed var(--color-border-strong)',
  margin: '0.5rem 0'
};

const iconContainerStyle: React.CSSProperties = {
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-surface-subtle)'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem 0',
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const descStyle: React.CSSProperties = {
  margin: '0 0 1.5rem 0',
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  maxWidth: '400px',
  lineHeight: 1.5
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease'
};
