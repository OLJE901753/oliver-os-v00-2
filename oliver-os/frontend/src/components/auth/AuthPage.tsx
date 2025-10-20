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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Oliver-OS</h1>
          <p className="text-gray-300 text-lg">
            For the honor, not the glory—by the people, for the people.
          </p>
        </div>

        {/* Auth Forms */}
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            A rebellious operating system for disrupting bureaucracy
          </p>
        </div>
      </div>
    </div>
  );
};
