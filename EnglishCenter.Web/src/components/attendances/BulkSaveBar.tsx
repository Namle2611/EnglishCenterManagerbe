import React from 'react';

interface BulkSaveBarProps {
  dirtyCount: number;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  hasInvalidRows?: boolean;
  disabled?: boolean;
}

export const BulkSaveBar: React.FC<BulkSaveBarProps> = ({
  dirtyCount,
  onSave,
  onDiscard,
  isSaving,
  hasInvalidRows = false,
  disabled = false
}) => {
  if (dirtyCount === 0) {
    return null;
  }

  return (
    <div
      id="attendance-bulk-save-bar"
      style={{
        position: 'sticky',
        bottom: '1.5rem',
        zIndex: 50,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.875rem 1.25rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginTop: '1.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          {dirtyCount}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Bạn có <strong>{dirtyCount}</strong> học viên có thay đổi điểm danh chưa lưu.
        </span>
        {hasInvalidRows && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--status-danger-text)', fontWeight: 600 }}>
            ⚠️ Có học viên có ghi chú nhưng chưa chọn trạng thái!
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <button
          id="attendance-discard-changes-btn"
          type="button"
          onClick={onDiscard}
          disabled={disabled || isSaving}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-subtle)',
            color: 'var(--color-text-secondary)',
            cursor: disabled || isSaving ? 'not-allowed' : 'pointer'
          }}
        >
          Hủy thay đổi
        </button>

        <button
          id="attendance-save-changes-btn"
          type="button"
          onClick={onSave}
          disabled={disabled || isSaving || hasInvalidRows}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: hasInvalidRows ? 'var(--color-surface-subtle)' : 'var(--color-primary)',
            color: hasInvalidRows ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
            cursor: disabled || isSaving || hasInvalidRows ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          {isSaving ? (
            <>
              <span className="spinner" style={{ width: '14px', height: '14px' }} /> Đang lưu...
            </>
          ) : (
            <>
              <span>💾</span> Lưu điểm danh ({dirtyCount})
            </>
          )}
        </button>
      </div>
    </div>
  );
};
