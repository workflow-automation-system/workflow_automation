import { create } from 'zustand';
import * as permissionApi from '../api/permissionApi';

const usePermissionStore = create((set, get) => ({
  permissions: {}, // { [workflowId]: [...permissions] }
  workflowPermissions: {}, // { [workflowId]: [...user permissions] }
  isLoading: false,
  error: null,

  /**
   * Fetch all permissions for a workflow
   */
  fetchWorkflowPermissions: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await permissionApi.getWorkflowPermissions(workflowId);
      set((state) => ({
        workflowPermissions: {
          ...state.workflowPermissions,
          [workflowId]: data,
        },
        isLoading: false,
      }));
      return data;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Grant permissions to a user
   */
  grantPermission: async (workflowId, userId, permissions) => {
    set({ isLoading: true, error: null });
    try {
      const data = await permissionApi.grantPermission(workflowId, userId, permissions);
      // Refresh workflow permissions
      const state = get();
      await state.fetchWorkflowPermissions(workflowId);
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update permissions for a user
   */
  updatePermission: async (workflowId, userId, permissions) => {
    set({ isLoading: true, error: null });
    try {
      const data = await permissionApi.updatePermission(workflowId, userId, permissions);
      // Refresh workflow permissions
      const state = get();
      await state.fetchWorkflowPermissions(workflowId);
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Revoke permissions for a user
   */
  revokePermission: async (workflowId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await permissionApi.revokePermission(workflowId, userId);
      // Refresh workflow permissions
      const state = get();
      await state.fetchWorkflowPermissions(workflowId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Check if user has specific permission
   */
  checkPermission: async (workflowId, userId, permissionType) => {
    try {
      return await permissionApi.checkPermission(workflowId, userId, permissionType);
    } catch (error) {
      return false;
    }
  },

  /**
   * Get workflows accessible to user with specific permission
   */
  getAccessibleWorkflows: async (organizationId, userId, permissionType) => {
    set({ isLoading: true, error: null });
    try {
      const data = await permissionApi.getWorkflowsByPermission(
        organizationId,
        userId,
        permissionType
      );
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Get permissions for a workflow (cached)
   */
  getWorkflowPermissions: (workflowId) => {
    const state = get();
    return state.workflowPermissions[workflowId] || [];
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    permissions: {},
    workflowPermissions: {},
    isLoading: false,
    error: null,
  }),
}));

export default usePermissionStore;
