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
  placeholder = 'Search...',
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
        &#128269;
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
          aria-label="Clear search"
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
  maxWidth: '320px'
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '0.75rem',
  color: '#94a3b8',
  fontSize: '0.85rem',
  pointerEvents: 'none'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 2rem 0.5rem 2.25rem',
  fontSize: '0.875rem',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box'
};

const clearButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.5rem',
  background: 'none',
  border: 'none',
  fontSize: '1.1rem',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '0 0.25rem',
  lineHeight: 1
};
