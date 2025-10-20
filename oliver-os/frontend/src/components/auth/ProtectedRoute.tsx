/**
 * Protected Route Component
 * Wrapper component that requires authentication
 */

import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { AuthPage } from './AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return fallback || <AuthPage />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

/**
 * Auth Guard Hook
 * Hook for checking authentication status
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    user,
    isProtected: isAuthenticated,
  };
};
