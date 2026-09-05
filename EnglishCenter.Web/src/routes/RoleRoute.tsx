import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleRouteProps {
  requiredRole: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div>Loading permissions...</div>
      </div>
    );
  }

  if (!user || !user.roles.includes(requiredRole)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>403 - Access Denied</h2>
        <p>You do not have permission to view this page ({requiredRole} role required).</p>
      </div>
    );
  }

  return <Outlet />;
};
