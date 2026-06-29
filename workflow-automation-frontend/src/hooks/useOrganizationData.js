import React from 'react';
import authService, { API } from '../services/authService';
import organizationService from '../services/organizationService';
import { mergeDepartmentsWithMembers } from '../utils/departments';

export const useOrganizationData = (user, currentUserIsAdmin) => {
  const [orgMeta, setOrgMeta] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [managedDepartments, setManagedDepartments] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const orgId = user?.organizationId;
      const [orgRes, membersRes, departmentsRes] = await Promise.all([
        orgId ? API.get(`/organizations/${orgId}`) : Promise.resolve({ data: null }),
        authService.getMembers(),
        currentUserIsAdmin ? organizationService.getDepartments() : Promise.resolve([]),
      ]);
      setOrgMeta(orgRes.data);
      const memberList = membersRes || [];
      setMembers(memberList);
      setManagedDepartments(
        mergeDepartmentsWithMembers(departmentsRes || [], memberList)
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your organization workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.organizationId, currentUserIsAdmin]);

  const refreshWorkspace = React.useCallback(async () => {
    try {
      const [membersRes, departmentsRes] = await Promise.all([
        authService.getMembers(),
        currentUserIsAdmin ? organizationService.getDepartments() : Promise.resolve([]),
      ]);
      const memberList = membersRes || [];
      setMembers(memberList);
      setManagedDepartments(mergeDepartmentsWithMembers(departmentsRes || [], memberList));
    } catch (err) {
      console.error('Failed to refresh workspace:', err);
    }
  }, [currentUserIsAdmin]);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    orgMeta,
    members,
    managedDepartments,
    isLoading,
    error,
    setMembers,
    refreshWorkspace,
  };
};
