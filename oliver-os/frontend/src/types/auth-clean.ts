export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    user: User
    tokens: AuthTokens
  }
  error?: string
  details?: any
}

export interface ApiError {
  success: false
  error: string
  message?: string
  details?: any
}

export interface ValidationError {
  field: string
  message: string
}
