/**
 * Authentication Page
 * Main authentication page with login and register forms
 */

import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuthStore } from '../../stores/authStore';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to main app
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    // Redirect to main app after successful authentication
    window.location.href = '/';
  };

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">O</span>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Oliver-OS
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            For the honor, not the glory—by the people, for the people.
          </p>
        </div>

        {/* Auth Forms */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {mode === 'login' ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterForm 
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            A rebellious operating system for disrupting bureaucracy
          </p>
          <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
            <span>AI-Powered</span>
            <span>•</span>
            <span>Privacy-First</span>
            <span>•</span>
            <span>Open Source</span>
          </div>
        </div>
      </div>
    </div>
  );
};
