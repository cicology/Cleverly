import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAuthEnabled } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // If auth is not enabled, allow access to all routes
  if (!isAuthEnabled) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(93, 224, 230, 0.2)',
            borderTopColor: '#5de0e6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="muted">Loading...</p>
      </div>
    );
  }

  // Show fallback or nothing if not authenticated
  if (!isAuthenticated) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
