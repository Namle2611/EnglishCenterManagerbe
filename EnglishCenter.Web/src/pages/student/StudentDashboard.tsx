import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppShell>
      <PageHeader
        title="Cổng thông tin học viên"
        subtitle={`Xin chào, ${user?.fullName || 'Học viên'}! Chúc bạn có những giờ học tập thật hiệu quả.`}
      />

      {/* Quick Action Navigation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
          maxWidth: '800px'
        }}
      >
        <Link
          to="/student/assignments"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>📑</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Bài tập của tôi
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Xem danh sách bài tập được giao, làm bài nộp và theo dõi kết quả chấm điểm
            </p>
          </div>
          <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>&rarr;</span>
        </Link>

        <Link
          to="/student/quizzes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>📝</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Bài kiểm tra của tôi
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Tham gia làm bài kiểm tra trực tuyến, theo dõi thời gian và tra cứu lịch sử kết quả
            </p>
          </div>
          <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>&rarr;</span>
        </Link>

        <Link
          to="/student/grades"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Điểm của tôi
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Xem bảng điểm chi tiết, kết quả bài tập và bài kiểm tra các lớp đang theo học
            </p>
          </div>
          <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>&rarr;</span>
        </Link>

        <Link
          to="/student/payments"
          id="student-tuition-quick-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>💳</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Học phí & Thanh toán
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Theo dõi học phí các khóa học và thanh toán nhanh qua mã VietQR SePay
            </p>
          </div>
          <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>&rarr;</span>
        </Link>
      </div>

      <div style={overviewCardStyle}>
        <h3 style={overviewTitleStyle}>Hồ sơ học viên</h3>
        <p style={overviewSubtitleStyle}>
          Thông tin tài khoản học viên trên hệ thống trung tâm Anh ngữ.
        </p>

        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Mã định danh</span>
            <span style={infoValueStyle} className="font-mono">#{user?.id}</span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Họ và tên</span>
            <span style={infoValueStyle}>{user?.fullName}</span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Email liên hệ</span>
            <span style={infoValueStyle}>{user?.email}</span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Vai trò hệ thống</span>
            <span style={roleBadgeStyle}>
              {user?.roles.join(', ')}
            </span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Trạng thái tài khoản</span>
            <span style={user?.isActive ? activeBadgeStyle : inactiveBadgeStyle}>
              {user?.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const overviewCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.75rem',
  maxWidth: '800px'
};

const overviewTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 0.375rem 0'
};

const overviewSubtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  margin: '0 0 1.25rem 0'
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  padding: '1.25rem',
  backgroundColor: 'var(--color-surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)'
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)'
};

const roleBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--role-student-bg)',
  color: 'var(--role-student-text)',
  border: '1px solid var(--role-student-border)',
  fontSize: '0.75rem',
  fontWeight: 600,
  width: 'fit-content'
};

const activeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--status-active-bg)',
  color: 'var(--status-active-text)',
  border: '1px solid var(--status-active-border)',
  fontSize: '0.75rem',
  fontWeight: 600,
  width: 'fit-content'
};

const inactiveBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--status-inactive-bg)',
  color: 'var(--status-inactive-text)',
  border: '1px solid var(--status-inactive-border)',
  fontSize: '0.75rem',
  fontWeight: 600,
  width: 'fit-content'
};
