/**
 * Authentication Store
 * Zustand store for managing authentication state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  User,
  AuthTokens, 
  LoginCredentials, 
  RegisterData, 
  AuthState 
} from '../types/auth';
import { authService } from '../services/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Token management
  getAccessToken: () => string | null;
  isTokenValid: () => boolean;
  shouldRefreshToken: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login action
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.login(credentials);
            
            if (response.success && response.data) {
              const { user, tokens } = response.data;
              
              // Store tokens in localStorage for persistence
              localStorage.setItem('accessToken', tokens.accessToken);
              localStorage.setItem('refreshToken', tokens.refreshToken);
              
              set({
                user,
                tokens,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error(response.message || 'Login failed');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        // Register action
        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.register(data);
            
            if (response.success && response.data) {
              const { user, tokens } = response.data;
              
              // Store tokens in localStorage for persistence
              localStorage.setItem('accessToken', tokens.accessToken);
              localStorage.setItem('refreshToken', tokens.refreshToken);
              
              set({
                user,
                tokens,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error(response.message || 'Registration failed');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        // Logout action
        logout: async () => {
          const { tokens } = get();
          
          try {
            if (tokens?.refreshToken) {
              await authService.logout(tokens.refreshToken);
            }
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            // Clear local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            // Reset state
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        // Logout all sessions
        logoutAll: async () => {
          const { user, tokens } = get();
          
          if (!user || !tokens?.accessToken) {
            throw new Error('No user or token available');
          }
          
          try {
            await authService.logoutAll(user.id, tokens.accessToken);
          } catch (error) {
            console.error('Logout all error:', error);
            throw error;
          } finally {
            // Clear local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            // Reset state
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        // Refresh tokens
        refreshTokens: async () => {
          const { tokens } = get();
          
          if (!tokens?.refreshToken) {
            throw new Error('No refresh token available');
          }
          
          try {
            const newTokens = await authService.refreshToken(tokens.refreshToken);
            
            const updatedTokens: AuthTokens = {
              ...tokens,
              accessToken: newTokens.accessToken,
              expiresIn: newTokens.expiresIn,
            };
            
            // Update localStorage
            localStorage.setItem('accessToken', newTokens.accessToken);
            
            set({
              tokens: updatedTokens,
              error: null,
            });
          } catch (error) {
            console.error('Token refresh error:', error);
            
            // If refresh fails, logout user
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired. Please login again.',
            });
            
            throw error;
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Set loading state
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Get access token
        getAccessToken: () => {
          const { tokens } = get();
          return tokens?.accessToken || null;
        },

        // Check if token is valid
        isTokenValid: () => {
          const { tokens } = get();
          if (!tokens?.accessToken) return false;
          
          return !authService.isTokenExpired(tokens.accessToken);
        },

        // Check if token should be refreshed
        shouldRefreshToken: () => {
          const { tokens } = get();
          if (!tokens?.accessToken) return false;
          
          const expiry = authService.getTokenExpiry(tokens.accessToken);
          if (!expiry) return false;
          
          // Refresh if token expires in less than 5 minutes
          const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
          return expiry < fiveMinutesFromNow;
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Initialize auth state from localStorage on app start
export const initializeAuth = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (accessToken && refreshToken) {
    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes default
    };
    
    // Check if token is still valid
    if (!authService.isTokenExpired(accessToken)) {
      useAuthStore.setState({
        tokens,
        isAuthenticated: true,
      });
      
      // Try to get user info
      authService.getCurrentUser(accessToken)
        .then((user) => {
          useAuthStore.setState({ user });
        })
        .catch((error) => {
          console.error('Failed to get user info:', error);
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          useAuthStore.setState({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        });
    } else {
      // Token expired, try to refresh
      useAuthStore.getState().refreshTokens().catch(() => {
        // Refresh failed, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
    }
  }
};
