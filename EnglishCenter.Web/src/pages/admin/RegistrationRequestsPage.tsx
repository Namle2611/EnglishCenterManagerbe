import React, { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { adminRegistrationService } from '../../services/adminRegistration.service';
import type {
  AdminRegistrationRequestDto,
  RegistrationStatus
} from '../../types/registration.types';

export const RegistrationRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AdminRegistrationRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('PendingApproval');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Approval Modal state
  const [approveTarget, setApproveTarget] = useState<AdminRegistrationRequestDto | null>(null);
  const [teacherCode, setTeacherCode] = useState<string>('');
  const [hireDate, setHireDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Rejection Modal state
  const [rejectTarget, setRejectTarget] = useState<AdminRegistrationRequestDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminRegistrationService.getRequests({
        status: (selectedStatus as RegistrationStatus) || undefined,
        role: selectedRole || undefined,
        search: search.trim() || undefined,
        page,
        pageSize: 10
      });

      if (res.success && res.data) {
        setRequests(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalItems);
      } else {
        setErrorMessage(res.message || 'Không thể tải danh sách yêu cầu đăng ký.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Đã xảy ra lỗi khi tải danh sách yêu cầu.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedRole, search, page]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        const res = await adminRegistrationService.getRequests({
          status: (selectedStatus as RegistrationStatus) || undefined,
          role: selectedRole || undefined,
          search: search.trim() || undefined,
          page,
          pageSize: 10
        });

        if (!isCancelled) {
          if (res.success && res.data) {
            setRequests(res.data.items);
            setTotalPages(res.data.totalPages);
            setTotalCount(res.data.totalItems);
          } else {
            setErrorMessage(res.message || 'Không thể tải danh sách yêu cầu đăng ký.');
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Đã xảy ra lỗi khi tải danh sách yêu cầu.');
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedStatus, selectedRole, search, page]);

  const handleOpenApproveModal = (req: AdminRegistrationRequestDto) => {
    setApproveTarget(req);
    setModalError(null);
    setTeacherCode('');
    setHireDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;

    if (approveTarget.requestedRole === 'TEACHER') {
      if (!teacherCode.trim()) {
        setModalError('Mã giáo viên là bắt buộc đối với tài khoản giáo viên.');
        return;
      }
      if (!hireDate) {
        setModalError('Ngày bắt đầu công tác là bắt buộc.');
        return;
      }
    }

    setIsApproving(true);
    setModalError(null);

    try {
      const payload = {
        teacherCode: approveTarget.requestedRole === 'TEACHER' ? teacherCode.trim() : undefined,
        hireDate: approveTarget.requestedRole === 'TEACHER' ? hireDate : undefined
      };

      const res = await adminRegistrationService.approve(approveTarget.id, payload);
      if (res.success) {
        setSuccessMessage(res.message || `Đã phê duyệt tài khoản ${approveTarget.fullName} thành công.`);
        setApproveTarget(null);
        await fetchRequests();
      } else {
        setModalError(res.message || 'Không thể phê duyệt yêu cầu.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setModalError(axErr.response?.data?.message || 'Lỗi hệ thống khi phê duyệt.');
      } else if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Đã xảy ra lỗi trong quá trình phê duyệt.');
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenRejectModal = (req: AdminRegistrationRequestDto) => {
    setRejectTarget(req);
    setRejectReason('');
    setModalError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;

    setIsRejecting(true);
    setModalError(null);

    try {
      const res = await adminRegistrationService.reject(rejectTarget.id, {
        reason: rejectReason.trim() || undefined
      });

      if (res.success) {
        setSuccessMessage(`Đã từ chối yêu cầu đăng ký của ${rejectTarget.fullName}.`);
        setRejectTarget(null);
        await fetchRequests();
      } else {
        setModalError(res.message || 'Không thể từ chối yêu cầu.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setModalError(axErr.response?.data?.message || 'Lỗi hệ thống khi từ chối.');
      } else if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Đã xảy ra lỗi trong quá trình từ chối.');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'PendingApproval':
        return <span style={badgePendingStyle}>Chờ phê duyệt</span>;
      case 'Completed':
        return <span style={badgeCompletedStyle}>Đã kích hoạt</span>;
      case 'Rejected':
        return <span style={badgeRejectedStyle}>Đã từ chối</span>;
      case 'PendingEmailVerification':
        return <span style={badgeEmailPendingStyle}>Chờ xác thực email</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'TEACHER':
        return <span style={badgeTeacherStyle}>👨‍🏫 Giáo viên</span>;
      case 'STAFF':
        return <span style={badgeStaffStyle}>💼 Nhân viên</span>;
      case 'STUDENT':
        return <span style={badgeStudentStyle}>🎓 Học viên</span>;
      default:
        return <span>{roleName}</span>;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Yêu cầu đăng ký tài khoản"
        subtitle="Danh sách hồ sơ đăng ký của Giảng viên và Nhân viên đang chờ duyệt"
      />

      {successMessage && (
        <div style={alertSuccessStyle} role="status">
          <span>✅ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'right' }}
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div style={alertDangerStyle} role="alert">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'right' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={filterContainerStyle}>
        <div style={filterGroupStyle}>
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            style={selectStyle}
          >
            <option value="">-- Tất cả vai trò --</option>
            <option value="TEACHER">Giáo viên (Teacher)</option>
            <option value="STAFF">Nhân viên (Staff)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            style={selectStyle}
          >
            <option value="PendingApproval">Chờ phê duyệt</option>
            <option value="Completed">Đã hoàn tất / kích hoạt</option>
            <option value="Rejected">Đã từ chối</option>
            <option value="">Tất cả trạng thái</option>
          </select>
        </div>

        <button
          onClick={() => {
            setPage(1);
            fetchRequests();
          }}
          style={primaryButtonStyle}
        >
          🔍 Tìm kiếm
        </button>
      </div>

      {/* Table Data */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách yêu cầu đăng ký..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="Không tìm thấy yêu cầu đăng ký nào"
          description="Hiện tại không có hồ sơ nào phù hợp với bộ lọc tìm kiếm đã chọn."
        />
      ) : (
        <div style={tableCardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>Họ và tên</th>
                  <th style={thStyle}>Email & SĐT</th>
                  <th style={thStyle}>Vai trò</th>
                  <th style={thStyle}>Hồ sơ / Chuyên môn</th>
                  <th style={thStyle}>Xác thực Email</th>
                  <th style={thStyle}>Thời gian nộp</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} style={trStyle}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {r.fullName}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.875rem' }}>{r.email}</div>
                      {r.phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          📞 {r.phone}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>{getRoleBadge(r.requestedRole)}</td>
                    <td style={tdStyle}>
                      {r.requestedRole === 'TEACHER' ? (
                        <div style={{ fontSize: '0.8125rem' }}>
                          <div><strong>Chuyên môn:</strong> {r.specialization || 'N/A'}</div>
                          {r.qualification && <div><strong>Chứng chỉ:</strong> {r.qualification}</div>}
                          <div><strong>Kinh nghiệm:</strong> {r.experienceYears ?? 0} năm</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {r.emailVerifiedAt ? (
                        <span style={{ color: 'var(--status-success-text, #059669)', fontSize: '0.8125rem', fontWeight: 500 }}>
                          ✓ Đã xác thực
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Chưa</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')} {new Date(r.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={tdStyle}>{getStatusBadge(r.status)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {r.status === 'PendingApproval' ? (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            id={`approve-btn-${r.id}`}
                            onClick={() => handleOpenApproveModal(r)}
                            disabled={isApproving || isRejecting}
                            style={approveButtonStyle}
                          >
                            Phê duyệt
                          </button>
                          <button
                            id={`reject-btn-${r.id}`}
                            onClick={() => handleOpenRejectModal(r)}
                            disabled={isApproving || isRejecting}
                            style={rejectButtonStyle}
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                          {r.reviewedByAdminName ? `Duyệt bởi: ${r.reviewedByAdminName}` : 'Đã xử lý'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div style={paginationBarStyle}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Tổng cộng {totalCount} yêu cầu (Trang {page} / {totalPages})
              </span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  style={pageNavButtonStyle}
                >
                  &larr; Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  style={pageNavButtonStyle}
                >
                  Sau &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Approve */}
      {approveTarget && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <h3 style={modalTitleStyle}>
              Xác nhận phê duyệt tài khoản {approveTarget.requestedRole === 'TEACHER' ? 'Giáo viên' : 'Nhân viên'}
            </h3>

            {modalError && (
              <div style={alertDangerStyle} role="alert">
                ⚠️ {modalError}
              </div>
            )}

            <div style={modalInfoBoxStyle}>
              <div><strong>Họ và tên:</strong> {approveTarget.fullName}</div>
              <div><strong>Email:</strong> {approveTarget.email}</div>
              {approveTarget.phone && <div><strong>SĐT:</strong> {approveTarget.phone}</div>}
              {approveTarget.requestedRole === 'TEACHER' && (
                <>
                  <div><strong>Chuyên môn:</strong> {approveTarget.specialization || 'N/A'}</div>
                  {approveTarget.qualification && <div><strong>Bằng cấp:</strong> {approveTarget.qualification}</div>}
                  <div><strong>Kinh nghiệm:</strong> {approveTarget.experienceYears ?? 0} năm</div>
                </>
              )}
            </div>

            {approveTarget.requestedRole === 'TEACHER' && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '0.875rem' }}>
                  <label style={labelStyle} htmlFor="admin-teacher-code-input">
                    Mã giáo viên (Teacher Code) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                  </label>
                  <input
                    id="admin-teacher-code-input"
                    type="text"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    placeholder="VD: TCH011"
                    disabled={isApproving}
                    style={inputStyle}
                  />
                  <span style={hintTextStyle}>Mã định danh duy nhất trong hệ thống (tối đa 20 ký tự).</span>
                </div>

                <div style={{ marginBottom: '0.875rem' }}>
                  <label style={labelStyle} htmlFor="admin-hire-date-input">
                    Ngày bắt đầu công tác (Hire Date) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                  </label>
                  <input
                    id="admin-hire-date-input"
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    disabled={isApproving}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                disabled={isApproving}
                style={cancelButtonStyle}
              >
                Hủy bỏ
              </button>
              <button
                id="confirm-approve-submit-btn"
                type="button"
                onClick={handleConfirmApprove}
                disabled={isApproving}
                style={confirmApproveButtonStyle}
              >
                {isApproving ? 'Đang kích hoạt tài khoản...' : 'Xác nhận tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {rejectTarget && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <h3 style={modalTitleStyle}>Từ chối yêu cầu đăng ký</h3>

            {modalError && (
              <div style={alertDangerStyle} role="alert">
                ⚠️ {modalError}
              </div>
            )}

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Bạn có chắc chắn muốn từ chối yêu cầu đăng ký của <strong>{rejectTarget.fullName}</strong> ({rejectTarget.email})?
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle} htmlFor="reject-reason-input">
                Lý do từ chối (Tùy chọn)
              </label>
              <textarea
                id="reject-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do hồ sơ chưa phù hợp..."
                disabled={isRejecting}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                disabled={isRejecting}
                style={cancelButtonStyle}
              >
                Hủy bỏ
              </button>
              <button
                id="confirm-reject-submit-btn"
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                style={confirmRejectButtonStyle}
              >
                {isRejecting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

const filterContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  marginBottom: '1.5rem'
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  flex: 1
};

const searchInputStyle: React.CSSProperties = {
  minWidth: '220px',
  flex: 1,
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  backgroundColor: 'var(--color-canvas)',
  color: 'var(--color-text-primary)'
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  backgroundColor: 'var(--color-canvas)',
  color: 'var(--color-text-primary)'
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const tableCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-canvas)',
  borderBottom: '1px solid var(--color-border)'
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)'
};

const tdStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontSize: '0.875rem',
  color: 'var(--color-text-primary)',
  verticalAlign: 'middle'
};

const approveButtonStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: 'var(--status-success-text, #059669)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const rejectButtonStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--status-danger-text)',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const badgePendingStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-warning-bg, #fef3c7)',
  color: 'var(--status-warning-text, #92400e)'
};

const badgeCompletedStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-success-bg, #ecfdf5)',
  color: 'var(--status-success-text, #065f46)'
};

const badgeRejectedStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-danger-bg)',
  color: 'var(--status-danger-text)'
};

const badgeEmailPendingStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-canvas)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)'
};

const badgeTeacherStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: '#eff6ff',
  color: '#1d4ed8'
};

const badgeStaffStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: '#f0fdf4',
  color: '#15803d'
};

const badgeStudentStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: '#faf5ff',
  color: '#7e22ce'
};

const paginationBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  borderTop: '1px solid var(--color-border)'
};

const pageNavButtonStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.8125rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer'
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '480px',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-lg)'
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  margin: '0 0 1rem 0'
};

const modalInfoBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-canvas)',
  borderRadius: 'var(--radius-md)',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  border: '1px solid var(--color-border)'
};

const modalActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.25rem'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer'
};

const confirmApproveButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-success-text, #059669)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const confirmRejectButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-danger-text)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: '0.25rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  boxSizing: 'border-box'
};

const hintTextStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
  marginTop: '0.25rem'
};

const alertSuccessStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--status-success-bg, #ecfdf5)',
  border: '1px solid var(--status-success-border, #a7f3d0)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--status-success-text, #065f46)',
  fontSize: '0.875rem',
  marginBottom: '1rem'
};

const alertDangerStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--status-danger-text)',
  fontSize: '0.875rem',
  marginBottom: '1rem'
};
