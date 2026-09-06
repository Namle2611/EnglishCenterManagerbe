import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching your criteria.',
  actionText,
  onAction
}) => {
  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>
        <svg
          style={{ width: '40px', height: '40px', color: '#94a3b8' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h4 style={titleStyle}>{title}</h4>
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
  padding: '3rem 1.5rem',
  textAlign: 'center',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px dashed #cbd5e1'
};

const iconContainerStyle: React.CSSProperties = {
  marginBottom: '0.75rem',
  opacity: 0.8
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem 0',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#1e293b'
};

const descStyle: React.CSSProperties = {
  margin: '0 0 1.25rem 0',
  fontSize: '0.9rem',
  color: '#64748b',
  maxWidth: '360px'
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};
