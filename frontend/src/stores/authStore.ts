// =============================================================================
// Auth Store (Zustand)
// =============================================================================
// Global authentication state management using Zustand.
//
// Why Zustand over React Context?
//   - No provider wrapper needed (less boilerplate)
//   - Selective re-renders (components only re-render when subscribed state changes)
//   - Works outside React components (e.g., in interceptors)
//   - Simpler API than Redux for our use case
//
// State shape:
//   { user, token, isAuthenticated, isLoading, error }
//
// Actions:
//   login(email, password)   → POST /api/auth/login
//   register(data)           → POST /api/auth/register
//   loadProfile()            → GET  /api/auth/profile
//   logout()                 → Clear state + localStorage
//   clearError()             → Reset error state
// =============================================================================

import { create } from 'zustand';
import api from '@/lib/api';

// =============================================================================
// Types
// =============================================================================

interface User {
  id: string;
  email: string;
  username: string;
  rating: number;
  streak: number;
  lastActiveAt: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initialize: () => void;
}

// =============================================================================
// Store
// =============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Initialize auth state from localStorage on app load.
   * Called once in the root layout to restore sessions across page refreshes.
   */
  initialize: () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        // Corrupted localStorage — clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  /**
   * Authenticate user with email and password.
   * On success: stores JWT + user in localStorage and Zustand state.
   * On failure: sets error message for UI display.
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, token } = data.data;

      // Persist to localStorage for session survival across page refreshes
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  /**
   * Register a new user account.
   * On success: automatically logs the user in (stores JWT + user).
   */
  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.post('/auth/register', {
        email,
        username,
        password,
      });
      const { user, token } = data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  /**
   * Fetch the current user's profile from the backend.
   * Uses the JWT stored in the Axios interceptor.
   * Useful for refreshing user data (e.g., after rating change).
   */
  loadProfile: async () => {
    try {
      const { data } = await api.get('/auth/profile');
      const user = data.data.user;

      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      // If profile load fails (e.g., token expired), clear auth state
      if (error.response?.status === 401) {
        get().logout();
      }
    }
  },

  /**
   * Sign out: clear all auth state and localStorage.
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Clear the error state (e.g., when user starts typing in the form again).
   */
  clearError: () => set({ error: null }),
}));
