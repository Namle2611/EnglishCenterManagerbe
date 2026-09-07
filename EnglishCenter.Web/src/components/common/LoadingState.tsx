import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Đang tải dữ liệu...' }) => {
  return (
    <div style={containerStyle} role="status" aria-live="polite">
      <div style={spinnerStyle} />
      <span style={messageStyle}>{message}</span>
      <style>{`
        @keyframes ec-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 1.5rem',
  gap: '0.875rem',
  color: 'var(--color-text-secondary)'
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid var(--color-border)',
  borderTopColor: 'var(--color-primary)',
  borderRadius: 'var(--radius-full)',
  animation: 'ec-spin 0.8s linear infinite'
};

const messageStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-secondary)'
};
