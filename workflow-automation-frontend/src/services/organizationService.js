import authService, { API } from './authService';

const organizationService = {
  getCurrent: async () => {
    const currentUser = await authService.me();
    const organizationId =
      currentUser?.organizationId || currentUser?.organization?.id;

    if (!organizationId) {
      throw new Error('No organization is linked to the current user.');
    }

    const response = await API.get(`/organizations/${organizationId}`);
    return response.data;
  },

  getMembers: async () => {
    const currentUser = await authService.me();
    const organizationId =
      currentUser?.organizationId || currentUser?.organization?.id;

    if (!organizationId) {
      throw new Error('No organization is linked to the current user.');
    }

    const response = await API.get(`/organizations/${organizationId}/members`);
    return response.data;
  },
};

export default organizationService;
