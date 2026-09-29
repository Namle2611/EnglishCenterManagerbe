import React from 'react';

interface ResourceLinkCardProps {
  type: 'video' | 'audio' | 'document';
  url: string;
}

export const ResourceLinkCard: React.FC<ResourceLinkCardProps> = ({ type, url }) => {
  const getMeta = () => {
    switch (type) {
      case 'video':
        return {
          label: 'Video bài giảng',
          icon: '🎥',
          badgeColor: '#e0f2fe',
          badgeText: '#0369a1'
        };
      case 'audio':
        return {
          label: 'Tập tin âm thanh',
          icon: '🎧',
          badgeColor: '#f3e8ff',
          badgeText: '#7e22ce'
        };
      case 'document':
        return {
          label: 'Tài liệu học tập',
          icon: '📄',
          badgeColor: '#fef3c7',
          badgeText: '#b45309'
        };
    }
  };

  const meta = getMeta();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }} aria-hidden="true">
          {meta.icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: meta.badgeText,
                backgroundColor: meta.badgeColor,
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {meta.label}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              wordBreak: 'break-all'
            }}
          >
            {url}
          </p>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.4rem 0.75rem',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--color-primary)',
          backgroundColor: 'var(--color-primary-subtle)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          flexShrink: 0
        }}
        aria-label={`Mở liên kết ${meta.label} trong tab mới`}
      >
        <span>Mở liên kết</span>
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
};
