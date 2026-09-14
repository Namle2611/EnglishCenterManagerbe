import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { PaymentTable } from '../../components/payments/PaymentTable';
import { PaymentFilters } from '../../components/payments/PaymentFilters';
import { PaymentStatusDialog } from '../../components/payments/PaymentStatusDialog';
import { PaymentDeleteDialog } from '../../components/payments/PaymentDeleteDialog';
import { paymentService } from '../../services/payment.service';
import type { PaymentDetail, PaymentFilterParams, PaymentListItem } from '../../types/payment.types';
import {
  buildPaymentQueryParams,
  getPaymentApiErrorMessage,
  getPaymentBasePath,
  normalizePaymentQueryParams,
  PAYMENT_PAGE_SIZES
} from '../../utils/paymentHelper';

export const PaymentListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = getPaymentBasePath(location.pathname);

  // Parse and normalize URL parameters defensively
  const queryParams = normalizePaymentQueryParams(searchParams);

  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flash message support
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  // Dialog states
  const [selectedPaymentForStatus, setSelectedPaymentForStatus] = useState<PaymentListItem | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false);

  const [selectedPaymentForDelete, setSelectedPaymentForDelete] = useState<PaymentListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear flash message when location changes
  useEffect(() => {
    if (location.state && (location.state as { flashMessage?: string }).flashMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch payments
  const fetchPayments = useCallback(
    async (params: PaymentFilterParams) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await paymentService.getPayments(params, controller.signal);
        if (response.success && response.data) {
          setPayments(response.data.items);
          setTotalItems(response.data.totalItems);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setErrorMessage(response.message || 'Không thể tải danh sách thanh toán.');
        }
      } catch (err: unknown) {
        if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
          return; // Superseded request, ignore silently
        }
        setErrorMessage(getPaymentApiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger fetch on queryParams change
  useEffect(() => {
    fetchPayments(queryParams);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    queryParams.page,
    queryParams.pageSize,
    queryParams.search,
    queryParams.status,
    queryParams.paymentMethod,
    queryParams.enrollmentId,
    queryParams.studentId,
    queryParams.courseId,
    queryParams.classId,
    queryParams.dateFrom,
    queryParams.dateTo,
    queryParams.minAmount,
    queryParams.maxAmount,
    queryParams.sortBy,
    queryParams.sortDirection,
    fetchPayments
  ]);

  // Update URL Search Parameters
  const updateUrlParams = (newParams: Partial<PaymentFilterParams>) => {
    const merged: PaymentFilterParams = {
      ...queryParams,
      ...newParams
    };

    const nextParams = buildPaymentQueryParams(merged);
    setSearchParams(nextParams as Record<string, string>);
  };

  // Sort change handler
  const handleSortChange = (column: string) => {
    const isCurrent = queryParams.sortBy?.toLowerCase() === column.toLowerCase();
    const newDirection = isCurrent && queryParams.sortDirection === 'asc' ? 'desc' : 'asc';
    updateUrlParams({
      sortBy: column,
      sortDirection: newDirection,
      page: 1
    });
  };

  // Filter change handler (resets page = 1)
  const handleFilterChange = (partial: Partial<PaymentFilterParams>) => {
    updateUrlParams({
      ...partial,
      page: 1
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchParams({ page: '1', pageSize: String(queryParams.pageSize || 10) });
  };

  // Page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUrlParams({ page: newPage });
    }
  };

  // Page size change
  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ pageSize: newSize, page: 1 });
  };

  // Open status modal
  const handleOpenStatusModal = (payment: PaymentListItem) => {
    setSelectedPaymentForStatus(payment);
    setIsStatusDialogOpen(true);
  };

  // Status transition success handler
  const handleStatusTransitionSuccess = (updated: PaymentDetail) => {
    setIsStatusDialogOpen(false);
    setSelectedPaymentForStatus(null);
    setFlashMessage(`Đã cập nhật trạng thái giao dịch #${updated.id} sang "${updated.status}".`);
    fetchPayments(queryParams);
  };

  // Open delete modal
  const handleOpenDeleteModal = (payment: PaymentListItem) => {
    setSelectedPaymentForDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  // Delete success handler with last-item page correction
  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setSelectedPaymentForDelete(null);
    setFlashMessage('Đã xóa vĩnh viễn giao dịch thanh toán.');

    // If last item on page N > 1, decrement page
    const currentPage = queryParams.page || 1;
    if (payments.length === 1 && currentPage > 1) {
      updateUrlParams({ page: currentPage - 1 });
    } else {
      fetchPayments(queryParams);
    }
  };

  const currentPage = queryParams.page || 1;
  const currentPageSize = queryParams.pageSize || 10;

  return (
    <AppShell>
      <PageHeader
        title="Quản lý thanh toán học phí"
        subtitle="Theo dõi sổ thu thanh toán, đối soát giao dịch và kiểm soát công nợ học viên"
        actions={
          <Link
            to={`${basePath}/new`}
            id="create-payment-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            ➕ Tạo giao dịch mới
          </Link>
        }
      />

      {/* Flash Banner */}
      {flashMessage && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-active-bg)',
            color: 'var(--status-active-text)',
            border: '1px solid var(--status-active-border)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <span>✓ {flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--status-active-text)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <PaymentFilters
        filters={queryParams}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        disabled={isLoading}
      />

      {/* Content Area */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách giao dịch thanh toán..." />
      ) : errorMessage ? (
        <div
          role="alert"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            textAlign: 'center',
            fontSize: '0.9375rem'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Không thể tải dữ liệu thanh toán</div>
          <div>{errorMessage}</div>
          <button
            type="button"
            onClick={() => fetchPayments(queryParams)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="Không tìm thấy giao dịch thanh toán"
          description={
            Object.keys(queryParams).length > 2
              ? 'Không có giao dịch nào khớp với bộ lọc hiện tại. Vui lòng thử lại với từ khóa hoặc điều kiện khác.'
              : 'Hệ thống chưa ghi nhận giao dịch thanh toán nào.'
          }
          actionText="Tạo giao dịch thanh toán mới"
          onAction={() => navigate(`${basePath}/new`)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Table */}
          <PaymentTable
            payments={payments}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onOpenStatusModal={handleOpenStatusModal}
            onDeleteClick={handleOpenDeleteModal}
            disabled={isLoading}
          />

          {/* Pagination Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.75rem 0.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)'
            }}
          >
            <div>
              Hiển thị <strong>{(currentPage - 1) * currentPageSize + 1}</strong> -{' '}
              <strong>{Math.min(currentPage * currentPageSize, totalItems)}</strong> trong tổng số{' '}
              <strong>{totalItems}</strong> giao dịch
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Page Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Hiển thị:</span>
                <select
                  id="page-size-selector"
                  value={currentPageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  style={{
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.8125rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                >
                  {PAYMENT_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>dòng / trang</span>
              </div>

              {/* Page Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <button
                  type="button"
                  id="prev-page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    cursor: currentPage <= 1 || isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  &larr; Trước
                </button>

                <span style={{ padding: '0 0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  id="next-page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    cursor: currentPage >= totalPages || isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Sau &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Status Modal */}
      <PaymentStatusDialog
        isOpen={isStatusDialogOpen}
        payment={selectedPaymentForStatus}
        onClose={() => {
          setIsStatusDialogOpen(false);
          setSelectedPaymentForStatus(null);
        }}
        onSuccess={handleStatusTransitionSuccess}
      />

      {/* Delete Confirmation Modal */}
      <PaymentDeleteDialog
        isOpen={isDeleteDialogOpen}
        payment={selectedPaymentForDelete}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedPaymentForDelete(null);
        }}
        onConfirmSuccess={handleDeleteSuccess}
        deleteAction={paymentService.deletePayment}
      />
    </AppShell>
  );
};
