import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import { AUTH_STORAGE_KEY, clearStoredSession } from '../utils/session';

const normalizeUser = (response) => ({
  id: response?.id ?? null,
  email: response?.email ?? '',
  name: response?.name ?? '',
  role: response?.role ?? 'USER',
  department: response?.department ?? '',
  jobTitle: response?.jobTitle ?? '',
  organizationId: response?.organizationId ?? response?.organization?.id ?? null,
  organization: response?.organization ?? null,
});

const applySession = (response, set) => {
  const token = response?.token || localStorage.getItem('token');
  if (token) {
    localStorage.setItem('token', token);
  }

  set({
    token: token || null,
    user: normalizeUser(response),
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    error: null,
  });
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: localStorage.getItem('token'),
      user: null,
      isAuthenticated: Boolean(localStorage.getItem('token')),
      isLoading: false,
      isInitialized: false,
      error: null,

      initializeAuth: async () => {
        const existingToken = get().token || localStorage.getItem('token');
        if (!existingToken) {
          clearStoredSession();
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authService.me();
          applySession(response, set);
        } catch {
          clearStoredSession();
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          localStorage.setItem('token', response.token);

          const user = {
            id: response.id,
            email: response.email,
            name: response.name,
            role: response.role,
            department: response.department,
            jobTitle: response.jobTitle,
            organization: response.organization,
          };

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.message || 'Invalid email or password';
          set({ error: errorMessage, isLoading: false, isInitialized: true });
          return { success: false, error: errorMessage, needsVerification: status === 403 };
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(payload);
          set({ isLoading: false, isInitialized: true });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Email already exists or registration failed';
          set({ error: errorMessage, isLoading: false, isInitialized: true });
          return { success: false, error: errorMessage };
        }
      },

      requestPasswordReset: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(email);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to request password reset';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(token, newPassword);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to reset password';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        clearStoredSession();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
