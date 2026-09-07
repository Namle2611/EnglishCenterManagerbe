import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50]
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div style={containerStyle} aria-label="Phân trang">
      <div style={infoStyle}>
        {totalItems !== undefined && (
          <span className="tabular-nums">
            Tổng số: <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong> mục
          </span>
        )}
        {onPageSizeChange && (
          <label style={pageSizeLabelStyle}>
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={selectStyle}
              aria-label="Số mục mỗi trang"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div style={controlsStyle}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          style={{
            ...navButtonStyle,
            opacity: isFirstPage ? 0.4 : 1,
            cursor: isFirstPage ? 'not-allowed' : 'pointer'
          }}
          aria-label="Trang trước"
        >
          &larr; Trước
        </button>

        <span style={pageIndicatorStyle} className="tabular-nums">
          Trang <strong style={{ color: 'var(--color-text-primary)' }}>{page}</strong> / <strong>{Math.max(totalPages, 1)}</strong>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          style={{
            ...navButtonStyle,
            opacity: isLastPage ? 0.4 : 1,
            cursor: isLastPage ? 'not-allowed' : 'pointer'
          }}
          aria-label="Trang sau"
        >
          Sau &rarr;
        </button>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.875rem 1.25rem',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-xs)',
  flexWrap: 'wrap',
  gap: '1rem',
  marginTop: '0.5rem'
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)'
};

const pageSizeLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const selectStyle: React.CSSProperties = {
  padding: '0.3125rem 0.625rem',
  fontSize: '0.8125rem',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer'
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const navButtonStyle: React.CSSProperties = {
  padding: '0.375rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  transition: 'background-color 0.15s ease'
};

const pageIndicatorStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)'
};
