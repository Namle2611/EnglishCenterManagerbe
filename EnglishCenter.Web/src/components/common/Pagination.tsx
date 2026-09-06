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
    <div style={containerStyle}>
      <div style={infoStyle}>
        {totalItems !== undefined && (
          <span>
            Total: <strong>{totalItems}</strong> items
          </span>
        )}
        {onPageSizeChange && (
          <label style={pageSizeLabelStyle}>
            Show:
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={selectStyle}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
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
          style={{ ...navButtonStyle, opacity: isFirstPage ? 0.5 : 1 }}
          aria-label="Previous page"
        >
          &larr; Previous
        </button>

        <span style={pageIndicatorStyle}>
          Page <strong>{page}</strong> of <strong>{Math.max(totalPages, 1)}</strong>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          style={{ ...navButtonStyle, opacity: isLastPage ? 0.5 : 1 }}
          aria-label="Next page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  flexWrap: 'wrap',
  gap: '1rem'
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  fontSize: '0.875rem',
  color: '#64748b'
};

const pageSizeLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem'
};

const selectStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  fontSize: '0.875rem',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  backgroundColor: '#ffffff',
  color: '#1e293b',
  cursor: 'pointer'
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const navButtonStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#334155',
  cursor: 'pointer'
};

const pageIndicatorStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#475569'
};
