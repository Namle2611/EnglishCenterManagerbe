import React from 'react';

interface AttachmentLinkProps {
  url: string | null | undefined;
  label?: string;
}

export const AttachmentLink: React.FC<AttachmentLinkProps> = ({ url, label }) => {
  if (!url || !url.trim()) {
    return <span style={{ color: 'var(--color-text-secondary, #6b7280)', fontStyle: 'italic', fontSize: '0.85rem' }}>Không có tài liệu đính kèm</span>;
  }

  const trimmed = url.trim();

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        color: 'var(--color-primary, #2563eb)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        wordBreak: 'break-all',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        borderRadius: 'var(--radius-md, 6px)',
        border: '1px solid rgba(37, 99, 235, 0.15)',
        transition: 'background-color 0.2s, border-color 0.2s'
      }}
      title={trimmed}
    >
      <span aria-hidden="true" style={{ fontSize: '0.95rem' }}>📎</span>
      <span style={{ textDecoration: 'underline' }}>{label || 'Xem tài liệu đính kèm'}</span>
      <span aria-hidden="true" style={{ fontSize: '0.75rem', opacity: 0.75 }}>↗</span>
    </a>
  );
};
