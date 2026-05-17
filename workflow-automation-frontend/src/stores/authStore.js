import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

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
          const errorMessage = error.response?.data?.message || 'Invalid email or password';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(payload);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Registration error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          const errorMessage = error.response?.data?.message || 'Email already exists or registration failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
