import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard
    const dashboards: Record<string, string> = {
      FARMER: '/farmer',
      CONSUMER: '/consumer',
      BULK_BUYER: '/buyer',
      FPO: '/fpo',
      LOGISTICS: '/logistics',
      ADMIN: '/admin'
    };
    return <Navigate to={dashboards[user.role] || '/'} replace />;
  }

  return <>{children}</>;
}
