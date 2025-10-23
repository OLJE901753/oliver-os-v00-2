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
    <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
      <div className="flex items-center space-x-4 mb-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-full flex items-center justify-center shadow-neon-lime">
            <span className="text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 rounded-full border-2 border-background animate-neon-pulse"></div>
        </div>
        
        {/* User Info */}
        <div>
          <h2 className="text-xl font-bold text-lime-400 neon-text">{user.name}</h2>
          <p className="text-gray-300">{user.email}</p>
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 animate-neon-pulse ${
              user.isActive ? 'bg-lime-400' : 'bg-red-400'
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
          <h3 className="text-sm font-medium text-lime-300 mb-3 flex items-center">
            <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
            Account Details
          </h3>
          <div className="glass-panel p-4 space-y-3 border border-lime-500/10">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member since:</span>
              <span className="text-white font-mono text-sm">{formatDate(user.createdAt)}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last login:</span>
                <span className="text-white font-mono text-sm">{formatDate(user.lastLoginAt)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">User ID:</span>
              <span className="text-lime-300 font-mono text-xs bg-lime-500/10 px-2 py-1 rounded">
                {user.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          disabled={isLoading}
          className="neon-button-secondary w-full py-3 px-4 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing Out...</span>
              </div>
            ) : (
              'Sign Out'
            )}
          </span>
        </button>
        
        <button
          onClick={() => setShowLogoutAllConfirm(true)}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 text-red-300 hover:text-red-200 font-medium rounded-lg transition-all duration-300 border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-neon-pulse"></div>
            <span>Sign Out All Devices</span>
          </span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-md mx-4 border border-lime-500/20 shadow-neon-lime">
            <h3 className="text-lg font-bold text-lime-400 mb-2 neon-text">Sign Out</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-300 border border-gray-500/30"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 neon-button text-white font-medium rounded-lg transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout All Confirmation Modal */}
      {showLogoutAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-md mx-4 border border-red-500/20 shadow-neon-amber">
            <h3 className="text-lg font-bold text-red-400 mb-2 neon-text">Sign Out All Devices</h3>
            <p className="text-gray-300 mb-4">
              This will sign you out of all devices and sessions. You'll need to sign in again on all devices.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutAllConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-300 border border-gray-500/30"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAll}
                className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 font-medium rounded-lg transition-all duration-300 border border-red-500/30 hover:border-red-500/50"
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
