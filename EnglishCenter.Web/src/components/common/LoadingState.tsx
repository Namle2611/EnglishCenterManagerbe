import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div style={containerStyle} role="status" aria-live="polite">
      <div style={spinnerStyle} />
      <span style={messageStyle}>{message}</span>
      <style>{`
        @keyframes spin {
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
  padding: '2.5rem 1rem',
  gap: '0.75rem',
  color: '#64748b'
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid #e2e8f0',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite'
};

const messageStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 500
};
