import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions
}) => {
  return (
    <div style={containerStyle}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={breadcrumbNavStyle}>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span style={separatorStyle}>/</span>}
                {crumb.path && !isLast ? (
                  <Link to={crumb.path} style={breadcrumbLinkStyle}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={isLast ? breadcrumbActiveStyle : breadcrumbTextStyle}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Title and Actions Row */}
      <div style={titleRowStyle}>
        <div>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>

        {actions && <div style={actionsContainerStyle}>{actions}</div>}
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  marginBottom: '1.5rem'
};

const breadcrumbNavStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.8125rem',
  marginBottom: '0.5rem'
};

const separatorStyle: React.CSSProperties = {
  color: 'var(--color-border-strong)',
  userSelect: 'none'
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontWeight: 500
};

const breadcrumbTextStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)'
};

const breadcrumbActiveStyle: React.CSSProperties = {
  color: 'var(--color-text-primary)',
  fontWeight: 600
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.02em',
  margin: 0
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  marginTop: '0.25rem'
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};
