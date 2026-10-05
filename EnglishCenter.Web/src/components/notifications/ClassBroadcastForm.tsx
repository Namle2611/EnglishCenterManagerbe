import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AssignmentClassLookupItem } from '../../types/assignment.types';
import { assignmentService } from '../../services/assignment.service';
import { notificationService } from '../../services/notification.service';
import {
  buildClassBroadcastPayload,
  formatBroadcastResultMessage,
  isClassBroadcastable,
  triggerUnreadCountRefresh,
  validateNotificationForm
} from '../../utils/notificationHelper';

export const ClassBroadcastForm: React.FC = () => {
  // Form fields
  const [selectedClass, setSelectedClass] = useState<AssignmentClassLookupItem | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Lookup state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lookupClasses, setLookupClasses] = useState<AssignmentClassLookupItem[]>([]);
  const [lookupPage, setLookupPage] = useState<number>(1);
  const [lookupTotalPages, setLookupTotalPages] = useState<number>(1);
  const [isSearchingClasses, setIsSearchingClasses] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // Status / Feedback
  const [fieldErrors, setFieldErrors] = useState<{ class?: string; title?: string; content?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  const lookupAbortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Debounced class search using assignmentService.getClassLookup
  const fetchClasses = useCallback(async (search: string, pageNum: number) => {
    setIsSearchingClasses(true);

    if (lookupAbortControllerRef.current) {
      lookupAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    lookupAbortControllerRef.current = controller;

    try {
      const response = await assignmentService.getClassLookup(
        {
          search: search.trim() || undefined,
          page: pageNum,
          pageSize: 20
        },
        controller.signal
      );

      if (response && response.success && response.data) {
        setLookupClasses(response.data.items || []);
        setLookupTotalPages(response.data.totalPages || 1);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') {
        return;
      }
    } finally {
      setIsSearchingClasses(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setLookupPage(1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchClasses(val, 1);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (lookupAbortControllerRef.current) lookupAbortControllerRef.current.abort();
    };
  }, []);

  const handleOpenDropdown = () => {
    setIsDropdownOpen(true);
    if (lookupClasses.length === 0) {
      fetchClasses(searchQuery, lookupPage);
    }
  };

  const handleSelectClass = (cls: AssignmentClassLookupItem) => {
    if (!isClassBroadcastable(cls.status)) {
      return;
    }
    setSelectedClass(cls);
    setIsDropdownOpen(false);
    setFieldErrors((prev) => ({ ...prev, class: undefined }));
  };

  const handleClearSelectedClass = () => {
    setSelectedClass(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setNetworkWarning(null);

    // Validation
    const validation = validateNotificationForm(title, content);
    const newErrors: { class?: string; title?: string; content?: string } = {
      ...validation.errors
    };

    if (!selectedClass) {
      newErrors.class = 'Vui lòng chọn lớp học để phát thông báo.';
    } else if (!isClassBroadcastable(selectedClass.status)) {
      newErrors.class = 'Không thể phát thông báo cho lớp đã hoàn thành hoặc đã hủy.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = buildClassBroadcastPayload(title, content);
      const response = await notificationService.createClassBroadcast(selectedClass!.classId, payload);

      if (response && response.success) {
        const sentCount = response.data?.sentCount ?? 0;
        const msg = formatBroadcastResultMessage(sentCount);
        setSuccessMessage(msg);

        // Reset form ONLY on confirmed 201
        setSelectedClass(null);
        setTitle('');
        setContent('');
        setSearchQuery('');

        triggerUnreadCountRefresh();
      } else {
        setErrorMessage(response?.message || 'Không thể phát thông báo lớp học. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes('Network Error') ||
          err.message.includes('timeout') ||
          (err as { code?: string }).code === 'ERR_NETWORK');

      if (isNetworkError) {
        setNetworkWarning(
          'Trạng thái gửi có thể chưa xác định do lỗi kết nối mạng. Vui lòng kiểm tra hộp thư/lịch sử trước khi gửi lại.'
        );
      } else {
        setErrorMessage('Đã xảy ra lỗi khi phát thông báo tới lớp học. Vui lòng thử lại.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formContainerStyle} noValidate>
      <div style={formHeaderStyle}>
        <h3 style={formTitleStyle}>Phát thông báo tới lớp học</h3>
        <p style={formDescriptionStyle}>
          Gửi thông báo tới toàn bộ học viên đang theo học (Active) trong lớp được chọn.
        </p>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div style={successBannerStyle} role="status">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={closeBannerBtnStyle}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* Network Warning Banner */}
      {networkWarning && (
        <div style={warningBannerStyle} role="alert">
          <span>⚠️ {networkWarning}</span>
          <button
            type="button"
            onClick={() => setNetworkWarning(null)}
            style={closeBannerBtnStyle}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div style={errorBannerStyle} role="alert">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={closeBannerBtnStyle}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Class Selector */}
      <div style={fieldGroupStyle} ref={dropdownRef}>
        <label htmlFor="broadcast-class-search-input" style={labelStyle}>
          Lớp học <span style={requiredMarkStyle}>*</span>
        </label>

        {selectedClass ? (
          <div style={selectedCardStyle}>
            <div style={selectedClassInfoStyle}>
              <span style={selectedClassCodeStyle}>Lớp {selectedClass.classCode}</span>
              <span style={selectedCourseNameStyle}>- {selectedClass.courseName}</span>
              <span style={getStatusBadgeStyle(selectedClass.status)}>
                {selectedClass.status}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSelectedClass}
              style={clearSelectionBtnStyle}
              aria-label="Chọn lớp học khác"
            >
              Thay đổi
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <input
              id="broadcast-class-search-input"
              type="text"
              placeholder="Tìm kiếm lớp học theo mã lớp hoặc tên khóa học..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleOpenDropdown}
              style={{
                ...inputStyle,
                ...(fieldErrors.class ? inputErrorStyle : {})
              }}
              aria-invalid={!!fieldErrors.class}
              aria-describedby={fieldErrors.class ? 'class-error' : undefined}
              autoComplete="off"
            />

            {/* Dropdown list */}
            {isDropdownOpen && (
              <div style={dropdownMenuContainerStyle}>
                {isSearchingClasses ? (
                  <div style={dropdownEmptyStyle}>Đang tìm kiếm lớp học...</div>
                ) : lookupClasses.length === 0 ? (
                  <div style={dropdownEmptyStyle}>Không tìm thấy lớp học phù hợp.</div>
                ) : (
                  <div style={dropdownListStyle}>
                    {lookupClasses.map((cls) => {
                      const selectable = isClassBroadcastable(cls.status);
                      return (
                        <button
                          key={cls.classId}
                          type="button"
                          onClick={() => handleSelectClass(cls)}
                          disabled={!selectable}
                          style={{
                            ...dropdownItemStyle,
                            ...(!selectable ? disabledDropdownItemStyle : {})
                          }}
                          title={
                            !selectable
                              ? 'Không thể phát thông báo cho lớp đã hoàn thành hoặc đã hủy'
                              : undefined
                          }
                        >
                          <div style={dropdownItemInfoStyle}>
                            <span style={dropdownItemNameStyle}>
                              {cls.classCode} - {cls.courseName}
                            </span>
                          </div>
                          <div style={dropdownItemBadgesStyle}>
                            <span style={getStatusBadgeStyle(cls.status)}>
                              {cls.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown pagination */}
                {lookupTotalPages > 1 && (
                  <div style={dropdownPaginationStyle}>
                    <button
                      type="button"
                      onClick={() => {
                        const p = Math.max(1, lookupPage - 1);
                        setLookupPage(p);
                        fetchClasses(searchQuery, p);
                      }}
                      disabled={lookupPage <= 1}
                      style={dropdownPageBtnStyle}
                    >
                      ←
                    </button>
                    <span style={dropdownPageIndicatorStyle}>
                      {lookupPage} / {lookupTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const p = Math.min(lookupTotalPages, lookupPage + 1);
                        setLookupPage(p);
                        fetchClasses(searchQuery, p);
                      }}
                      disabled={lookupPage >= lookupTotalPages}
                      style={dropdownPageBtnStyle}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {fieldErrors.class && (
          <span id="class-error" style={errorTextStyle}>
            {fieldErrors.class}
          </span>
        )}
      </div>

      {/* 2. Title Field */}
      <div style={fieldGroupStyle}>
        <div style={labelRowStyle}>
          <label htmlFor="broadcast-notification-title" style={labelStyle}>
            Tiêu đề <span style={requiredMarkStyle}>*</span>
          </label>
          <span style={charCountStyle}>{title.length}/200</span>
        </div>
        <input
          id="broadcast-notification-title"
          type="text"
          maxLength={200}
          placeholder="Nhập tiêu đề thông báo tới lớp (tối đa 200 ký tự)..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined }));
          }}
          style={{
            ...inputStyle,
            ...(fieldErrors.title ? inputErrorStyle : {})
          }}
          aria-invalid={!!fieldErrors.title}
          aria-describedby={fieldErrors.title ? 'broadcast-title-error' : undefined}
        />
        {fieldErrors.title && (
          <span id="broadcast-title-error" style={errorTextStyle}>
            {fieldErrors.title}
          </span>
        )}
      </div>

      {/* 3. Content Field */}
      <div style={fieldGroupStyle}>
        <label htmlFor="broadcast-notification-content" style={labelStyle}>
          Nội dung <span style={requiredMarkStyle}>*</span>
        </label>
        <textarea
          id="broadcast-notification-content"
          rows={5}
          placeholder="Nhập nội dung thông báo phát cho học viên..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (fieldErrors.content) setFieldErrors((p) => ({ ...p, content: undefined }));
          }}
          style={{
            ...textareaStyle,
            ...(fieldErrors.content ? inputErrorStyle : {})
          }}
          aria-invalid={!!fieldErrors.content}
          aria-describedby={fieldErrors.content ? 'broadcast-content-error' : undefined}
        />
        {fieldErrors.content && (
          <span id="broadcast-content-error" style={errorTextStyle}>
            {fieldErrors.content}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <div style={actionsRowStyle}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...submitButtonStyle,
            ...(isSubmitting ? disabledSubmitBtnStyle : {})
          }}
        >
          {isSubmitting ? 'Đang phát thông báo...' : 'Phát thông báo'}
        </button>
      </div>
    </form>
  );
};

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const s = status?.toLowerCase();
  if (s === 'ongoing') {
    return {
      padding: '0.15rem 0.45rem',
      fontSize: '0.6875rem',
      fontWeight: 600,
      borderRadius: '4px',
      backgroundColor: '#dcfce7',
      color: '#15803d'
    };
  }
  if (s === 'planned') {
    return {
      padding: '0.15rem 0.45rem',
      fontSize: '0.6875rem',
      fontWeight: 600,
      borderRadius: '4px',
      backgroundColor: '#e0f2fe',
      color: '#0369a1'
    };
  }
  return {
    padding: '0.15rem 0.45rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    color: '#64748b'
  };
}

// Styles
const formContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg, 12px)',
  border: '1px solid var(--color-border, #e2e8f0)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  maxWidth: '720px'
};

const formHeaderStyle: React.CSSProperties = {
  marginBottom: '0.25rem'
};

const formTitleStyle: React.CSSProperties = {
  margin: '0 0 0.25rem 0',
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary, #0f172a)'
};

const formDescriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary, #64748b)'
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem'
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--color-text-primary, #1e293b)'
};

const requiredMarkStyle: React.CSSProperties = {
  color: '#ef4444'
};

const charCountStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary, #94a3b8)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  borderRadius: 'var(--radius-md, 8px)',
  border: '1px solid var(--color-border, #cbd5e1)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  color: 'var(--color-text-primary, #0f172a)',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  lineHeight: 1.5,
  fontFamily: 'inherit'
};

const inputErrorStyle: React.CSSProperties = {
  borderColor: '#ef4444'
};

const errorTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#ef4444'
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '0.5rem'
};

const submitButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.625rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#16a34a',
  border: 'none',
  borderRadius: 'var(--radius-md, 8px)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease'
};

const disabledSubmitBtnStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed'
};

const selectedCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.625rem 0.875rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: 'var(--radius-md, 8px)',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const selectedClassInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const selectedClassCodeStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#0f172a'
};

const selectedCourseNameStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#64748b'
};

const clearSelectionBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#2563eb',
  backgroundColor: '#ffffff',
  border: '1px solid #bfdbfe',
  borderRadius: 'var(--radius-sm, 6px)',
  cursor: 'pointer'
};

const dropdownMenuContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 'var(--radius-md, 8px)',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  zIndex: 50,
  maxHeight: '260px',
  overflowY: 'auto'
};

const dropdownListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.625rem 0.875rem',
  border: 'none',
  borderBottom: '1px solid #f1f5f9',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'background-color 0.1s ease'
};

const disabledDropdownItemStyle: React.CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
  backgroundColor: '#f8fafc'
};

const dropdownItemInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem'
};

const dropdownItemNameStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#0f172a'
};

const dropdownItemBadgesStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem'
};

const dropdownEmptyStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'center',
  fontSize: '0.875rem',
  color: '#64748b'
};

const dropdownPaginationStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem',
  borderTop: '1px solid #f1f5f9',
  gap: '0.5rem',
  backgroundColor: '#f8fafc'
};

const dropdownPageBtnStyle: React.CSSProperties = {
  padding: '0.2rem 0.5rem',
  fontSize: '0.75rem',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  cursor: 'pointer'
};

const dropdownPageIndicatorStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#64748b'
};

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  backgroundColor: '#f0fdf4',
  color: '#15803d',
  border: '1px solid #bbf7d0',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '0.875rem'
};

const warningBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  backgroundColor: '#fffbeb',
  color: '#b45309',
  border: '1px solid #fde68a',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '0.875rem'
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '0.875rem'
};

const closeBannerBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'inherit',
  opacity: 0.7
};
