/**
 * User Profile Component
 * Displays user information and account management
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export const UserProfile: React.FC = () => {
  const { user, logout, logoutAll, isLoading } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      setShowLogoutAllConfirm(false);
    } catch (error) {
      console.error('Logout all error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        {/* Avatar */}
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* User Info */}
        <div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400">{user.email}</p>
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              user.isActive ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-300">
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-1">Account Details</h3>
          <div className="bg-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Member since:</span>
              <span className="text-white">{formatDate(user.createdAt)}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last login:</span>
                <span className="text-white">{formatDate(user.lastLoginAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="text-white font-mono text-xs">{user.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {isLoading ? 'Signing Out...' : 'Sign Out'}
        </button>
        
        <button
          onClick={() => setShowLogoutAllConfirm(true)}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-red-700 hover:bg-red-600 disabled:bg-red-800 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign Out All Devices
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Sign Out</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout All Confirmation Modal */}
      {showLogoutAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Sign Out All Devices</h3>
            <p className="text-gray-300 mb-4">
              This will sign you out of all devices and sessions. You'll need to sign in again on all devices.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutAllConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAll}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Sign Out All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
