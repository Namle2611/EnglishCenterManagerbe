import React, { useEffect, useState } from 'react';

interface SearchInputProps {
  value?: string;
  onChange: (debouncedValue: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: externalValue = '',
  onChange,
  placeholder = 'Tìm kiếm...',
  debounceMs = 400,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState(externalValue);

  // Sync internal state if external value changes
  useEffect(() => {
    setSearchTerm(externalValue);
  }, [externalValue]);

  // Debounce notification to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== externalValue) {
        onChange(searchTerm);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs, onChange, externalValue]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div style={wrapperStyle}>
      <span style={searchIconStyle} aria-hidden="true">
        <svg
          style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={inputStyle}
        aria-label={placeholder}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          style={clearButtonStyle}
          aria-label="Xóa từ khóa tìm kiếm"
        >
          &times;
        </button>
      )}
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '360px'
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 2rem 0.5rem 2.25rem',
  fontSize: '0.875rem',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
};

const clearButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.625rem',
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: '0 0.25rem',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
