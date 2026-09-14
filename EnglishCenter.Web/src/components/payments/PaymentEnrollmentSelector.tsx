import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { enrollmentService } from '../../services/enrollment.service';
import type { PagedResult } from '../../types/common.types';
import type { EnrollmentListItem, EnrollmentStatus } from '../../types/enrollment.types';
import { formatVND } from '../../utils/paymentHelper';
import { ENROLLMENT_STATUS_LABELS } from '../../utils/enrollmentHelper';

type EligibleStatusTab = 'ALL' | 'Confirmed' | 'Enrolled' | 'Paid';

interface PaymentEnrollmentSelectorProps {
  selectedEnrollmentId: number | '';
  onSelectEnrollment: (enrollment: EnrollmentListItem | null) => void;
  disabled?: boolean;
}

interface MultiStatusPaginationState {
  confirmedPage: number;
  confirmedHasMore: boolean;
  paidPage: number;
  paidHasMore: boolean;
  enrolledPage: number;
  enrolledHasMore: boolean;
}

export const PaymentEnrollmentSelector: React.FC<PaymentEnrollmentSelectorProps> = ({
  selectedEnrollmentId,
  onSelectEnrollment,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<EligibleStatusTab>('Confirmed');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single tab pagination
  const [singlePage, setSinglePage] = useState<number>(1);
  const [singleHasMore, setSingleHasMore] = useState<boolean>(false);

  // Independent multi-status pagination state for "Tất cả hợp lệ" (ALL)
  const [multiPagination, setMultiPagination] = useState<MultiStatusPaginationState>({
    confirmedPage: 1,
    confirmedHasMore: false,
    paidPage: 1,
    paidHasMore: false,
    enrolledPage: 1,
    enrolledHasMore: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch helper for single status tab
  const fetchSingleStatus = useCallback(
    async (status: EnrollmentStatus, page: number, search: string, append = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await enrollmentService.getEnrollments(
          {
            status,
            search: search.trim() || undefined,
            page,
            pageSize: 20,
            sortBy: 'id',
            sortDirection: 'desc'
          },
          controller.signal
        );

        if (res.success && res.data) {
          const items = res.data.items;
          setEnrollments((prev) => (append ? [...prev, ...items] : items));
          setSinglePage(page);
          setSingleHasMore(page < (res.data.totalPages || 1));
        }
      } catch (err) {
        if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
          return;
        }
        setErrorMessage('Không thể tải danh sách ghi danh hợp lệ.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch helper for ALL tab (3 independent status streams)
  const fetchAllEligible = useCallback(
    async (
      search: string,
      pagination: MultiStatusPaginationState,
      isLoadMore = false
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const promises: Promise<{ status: EnrollmentStatus; page: number; data?: PagedResult<EnrollmentListItem> }>[] = [];

        // Determine which statuses need to be fetched
        if (!isLoadMore) {
          // Initial load: fetch page 1 of all 3 statuses
          promises.push(
            enrollmentService
              .getEnrollments(
                { status: 'Confirmed', search: search.trim() || undefined, page: 1, pageSize: 20 },
                controller.signal
              )
              .then((r) => ({ status: 'Confirmed' as EnrollmentStatus, page: 1, data: r.data }))
          );
          promises.push(
            enrollmentService
              .getEnrollments(
                { status: 'Enrolled', search: search.trim() || undefined, page: 1, pageSize: 20 },
                controller.signal
              )
              .then((r) => ({ status: 'Enrolled' as EnrollmentStatus, page: 1, data: r.data }))
          );
          promises.push(
            enrollmentService
              .getEnrollments(
                { status: 'Paid', search: search.trim() || undefined, page: 1, pageSize: 20 },
                controller.signal
              )
              .then((r) => ({ status: 'Paid' as EnrollmentStatus, page: 1, data: r.data }))
          );
        } else {
          // Load more: only fetch next page for statuses where hasMore is true
          if (pagination.confirmedHasMore) {
            const nextPage = pagination.confirmedPage + 1;
            promises.push(
              enrollmentService
                .getEnrollments(
                  { status: 'Confirmed', search: search.trim() || undefined, page: nextPage, pageSize: 20 },
                  controller.signal
                )
                .then((r) => ({ status: 'Confirmed' as EnrollmentStatus, page: nextPage, data: r.data }))
            );
          }
          if (pagination.enrolledHasMore) {
            const nextPage = pagination.enrolledPage + 1;
            promises.push(
              enrollmentService
                .getEnrollments(
                  { status: 'Enrolled', search: search.trim() || undefined, page: nextPage, pageSize: 20 },
                  controller.signal
                )
                .then((r) => ({ status: 'Enrolled' as EnrollmentStatus, page: nextPage, data: r.data }))
            );
          }
          if (pagination.paidHasMore) {
            const nextPage = pagination.paidPage + 1;
            promises.push(
              enrollmentService
                .getEnrollments(
                  { status: 'Paid', search: search.trim() || undefined, page: nextPage, pageSize: 20 },
                  controller.signal
                )
                .then((r) => ({ status: 'Paid' as EnrollmentStatus, page: nextPage, data: r.data }))
            );
          }
        }

        const results = await Promise.all(promises);

        // Update independent pagination states
        const newPagination = { ...pagination };
        const newItems: EnrollmentListItem[] = [];

        for (const res of results) {
          if (res.data) {
            newItems.push(...res.data.items);
            const hasMore = res.page < (res.data.totalPages || 1);
            if (res.status === 'Confirmed') {
              newPagination.confirmedPage = res.page;
              newPagination.confirmedHasMore = hasMore;
            } else if (res.status === 'Enrolled') {
              newPagination.enrolledPage = res.page;
              newPagination.enrolledHasMore = hasMore;
            } else if (res.status === 'Paid') {
              newPagination.paidPage = res.page;
              newPagination.paidHasMore = hasMore;
            }
          }
        }

        setMultiPagination(newPagination);

        // Merge, deduplicate by ID, and sort descending by ID
        setEnrollments((prev) => {
          const combined = isLoadMore ? [...prev, ...newItems] : newItems;
          const map = new Map<number, EnrollmentListItem>();
          for (const item of combined) {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          }
          return Array.from(map.values()).sort((a, b) => b.id - a.id);
        });
      } catch (err) {
        if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
          return;
        }
        setErrorMessage('Không thể tải danh sách ghi danh hợp lệ.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger search / tab change with 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'ALL') {
        const initialPagination: MultiStatusPaginationState = {
          confirmedPage: 1,
          confirmedHasMore: false,
          paidPage: 1,
          paidHasMore: false,
          enrolledPage: 1,
          enrolledHasMore: false
        };
        fetchAllEligible(searchTerm, initialPagination, false);
      } else {
        fetchSingleStatus(activeTab as EnrollmentStatus, 1, searchTerm, false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, searchTerm, fetchAllEligible, fetchSingleStatus]);

  // Clean up AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle Load More
  const handleLoadMore = () => {
    if (activeTab === 'ALL') {
      fetchAllEligible(searchTerm, multiPagination, true);
    } else {
      fetchSingleStatus(activeTab as EnrollmentStatus, singlePage + 1, searchTerm, true);
    }
  };

  const hasMoreToLoad =
    activeTab === 'ALL'
      ? multiPagination.confirmedHasMore ||
        multiPagination.enrolledHasMore ||
        multiPagination.paidHasMore
      : singleHasMore;

  const selectedItem = enrollments.find((e) => e.id === selectedEnrollmentId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          htmlFor="enrollment-select"
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}
        >
          Chọn đơn ghi danh thanh toán <span style={{ color: 'var(--status-danger-text)' }}>*</span>
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          (Chỉ chấp nhận Confirmed, Enrolled, Paid)
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(
          [
            { key: 'Confirmed', label: 'Đã xác nhận' },
            { key: 'Enrolled', label: 'Đã vào lớp' },
            { key: 'Paid', label: 'Đã đóng tiền' },
            { key: 'ALL', label: 'Tất cả hợp lệ' }
          ] as { key: EligibleStatusTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            disabled={disabled}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor:
                activeTab === tab.key
                  ? 'var(--color-primary)'
                  : 'var(--color-surface-subtle)',
              color:
                activeTab === tab.key
                  ? 'var(--color-text-inverse)'
                  : 'var(--color-text-secondary)',
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <input
        type="text"
        id="enrollment-lookup-search"
        placeholder="Tìm kiếm theo mã/tên học viên, khóa học, lớp học..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '0.8125rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          outline: 'none'
        }}
      />

      {/* Select Box + Load More */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          id="enrollment-select"
          value={selectedEnrollmentId}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : '';
            const found = enrollments.find((item) => item.id === id) || null;
            onSelectEnrollment(found);
          }}
          disabled={disabled || isLoading}
          required
          style={{
            flex: 1,
            padding: '0.625rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none'
          }}
        >
          <option value="">
            {isLoading
              ? '-- Đang tải danh sách ghi danh... --'
              : '-- Chọn đơn ghi danh cần thanh toán --'}
          </option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>
              #{e.id} — {e.studentName} ({e.studentCode}) | {e.courseName}
              {e.classCode ? ` - Lớp: ${e.classCode}` : ''} | Học phí: {formatVND(e.tuitionAmount)} [
              {ENROLLMENT_STATUS_LABELS[e.status] || e.status}]
            </option>
          ))}
        </select>

        {hasMoreToLoad && (
          <button
            type="button"
            id="load-more-enrollments-btn"
            onClick={handleLoadMore}
            disabled={isLoading || disabled}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-secondary)',
              cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isLoading ? 'Đang tải...' : 'Tải thêm ghi danh'}
          </button>
        )}
      </div>

      {/* Selected Preview Box */}
      {selectedItem && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.8125rem',
            lineHeight: 1.5
          }}
        >
          <div>
            Học viên: <strong>{selectedItem.studentName}</strong> (Mã:{' '}
            <span className="font-mono">{selectedItem.studentCode}</span>)
          </div>
          <div>
            Khóa học: <strong>{selectedItem.courseName}</strong> (Mã:{' '}
            <span className="font-mono">{selectedItem.courseCode}</span>)
          </div>
          {selectedItem.classCode && (
            <div>
              Lớp học: <span className="font-mono">{selectedItem.classCode}</span>
            </div>
          )}
          <div>
            Học phí thỏa thuận: <strong>{formatVND(selectedItem.tuitionAmount)}</strong> | Trạng thái:{' '}
            <strong>{ENROLLMENT_STATUS_LABELS[selectedItem.status]}</strong>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--status-danger-text)'
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
};
