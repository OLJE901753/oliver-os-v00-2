/**
 * Register Component
 * User registration form with validation
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { RegisterData } from '../../types/register';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  onSwitchToLogin 
}) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    name: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, error, clearError } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    clearError();

    try {
      await register(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-lime-400 mb-2 neon-text">Join Oliver-OS</h2>
        <p className="text-gray-300">Create your account to get started</p>
        <div className="mt-3 w-16 h-0.5 bg-gradient-to-r from-lime-400 to-cyan-400 mx-auto rounded-full"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`futuristic-input w-full ${
                errors.name ? 'border-red-500 focus:border-red-400' : 'border-lime-500/30 focus:border-lime-400'
              }`}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
          </div>
          {errors.name && (
            <p className="text-sm text-red-400 flex items-center">
              <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`futuristic-input w-full ${
                errors.email ? 'border-red-500 focus:border-red-400' : 'border-lime-500/30 focus:border-lime-400'
              }`}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
          </div>
          {errors.email && (
            <p className="text-sm text-red-400 flex items-center">
              <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`futuristic-input w-full ${
                errors.password ? 'border-red-500 focus:border-red-400' : 'border-lime-500/30 focus:border-lime-400'
              }`}
              placeholder="Create a strong password"
              disabled={isSubmitting}
            />
            <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
          </div>
          {errors.password && (
            <p className="text-sm text-red-400 flex items-center">
              <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
              {errors.password}
            </p>
          )}
          <div className="mt-1 text-xs text-gray-400 flex items-center">
            <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
            Password must be at least 8 characters with uppercase, lowercase, and numbers
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              className={`futuristic-input w-full ${
                errors.confirmPassword ? 'border-red-500 focus:border-red-400' : 'border-lime-500/30 focus:border-lime-400'
              }`}
              placeholder="Confirm your password"
              disabled={isSubmitting}
            />
            <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400 flex items-center">
              <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3 animate-neon-pulse"></div>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="neon-button w-full py-3 px-6 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </span>
        </button>
      </form>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-lime-400 hover:text-lime-300 font-medium transition-colors duration-200 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      )}

      {/* Terms and Privacy */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-lime-400 hover:text-lime-300 transition-colors duration-200">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-lime-400 hover:text-lime-300 transition-colors duration-200">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
