import authService, { API } from './authService';
import { normalizeDepartmentList } from '../utils/departments';

const getOrganizationId = async () => {
  const currentUser = await authService.me();
  const organizationId =
    currentUser?.organizationId || currentUser?.organization?.id;

  if (!organizationId) {
    throw new Error('No organization is linked to the current user.');
  }

  return organizationId;
};

const organizationService = {
  getCurrent: async () => {
    const organizationId = await getOrganizationId();
    const response = await API.get(`/organizations/${organizationId}`);
    return response.data;
  },

  getMembers: async () => {
    const organizationId = await getOrganizationId();
    const response = await API.get(`/organizations/${organizationId}/members`);
    return response.data;
  },

  getDepartments: async () => {
    const organizationId = await getOrganizationId();
    const response = await API.get(`/organizations/${organizationId}/departments`);
    return normalizeDepartmentList(response.data);
  },

  createDepartment: async (name) => {
    const organizationId = await getOrganizationId();
    const response = await API.post(`/organizations/${organizationId}/departments`, { name });
    return normalizeDepartmentList([response.data])[0];
  },

  renameDepartment: async (departmentId, newName) => {
    const organizationId = await getOrganizationId();
    const response = await API.patch(
      `/organizations/${organizationId}/departments/${departmentId}`,
      { newName }
    );
    return normalizeDepartmentList([response.data])[0];
  },

  deleteDepartment: async (departmentId) => {
    const organizationId = await getOrganizationId();
    await API.delete(`/organizations/${organizationId}/departments/${departmentId}`);
  },
};

export default organizationService;
