import { API_BASE_URL } from './config';
import { clearStoredSession } from '../utils/session';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    clearStoredSession();
    window.location.assign('/login');
    throw new Error('Your session expired. Please sign in again.');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const grantPermission = (workflowId, userId, permissions) =>
  request('/workflows/permissions/grant', {
    method: 'POST',
    body: { workflowId, userId, permissions },
  });

export const getWorkflowPermissions = (workflowId) =>
  request(`/workflows/permissions/${workflowId}`);

export const getUserPermission = (workflowId, userId) =>
  request(`/workflows/permissions/${workflowId}/user/${userId}`);

export const checkPermission = (workflowId, userId, permissionType) =>
  request(`/workflows/permissions/${workflowId}/user/${userId}/check/${permissionType}`);

export const updatePermission = (workflowId, userId, permissions) =>
  request(`/workflows/permissions/${workflowId}/user/${userId}`, {
    method: 'PUT',
    body: permissions,
  });

export const revokePermission = (workflowId, userId) =>
  request(`/workflows/permissions/${workflowId}/user/${userId}`, {
    method: 'DELETE',
  });

export const getWorkflowsByPermission = (organizationId, userId, permissionType) =>
  request(`/workflows/permissions/org/${organizationId}/user/${userId}/permission/${permissionType}`);

export const PERMISSION_TYPES = {
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  EXECUTE: 'EXECUTE',
};

export const PERMISSION_LABELS = {
  VIEW: 'View',
  EDIT: 'Edit',
  EXECUTE: 'Execute',
};

export const PERMISSION_DESCRIPTIONS = {
  VIEW: 'Read-only access to the workflow and execution history',
  EDIT: 'Modify workflow structure, settings, and lifecycle actions',
  EXECUTE: 'Run this workflow and inspect execution output',
};
