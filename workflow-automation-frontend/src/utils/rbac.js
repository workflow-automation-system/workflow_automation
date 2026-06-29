export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

export const getRole = (user) => String(user?.role || ROLES.USER).toUpperCase();

export const isAdmin = (user) => getRole(user) === ROLES.ADMIN;

export const canCreateWorkflow = (user) => true;
export const canManageOrganization = (user) => isAdmin(user);
export const canManageIntegrations = (user) => isAdmin(user);
export const canManageSettings = (user) => isAdmin(user);

export const canEditWorkflow = (workflow, user) => {
  if (typeof workflow?.canEdit === 'boolean') {
    return workflow.canEdit;
  }
  return canCreateWorkflow(user);
};

export const canDeleteWorkflow = (workflow, user) => {
  return canEditWorkflow(workflow, user);
};

export const canExecuteWorkflow = (workflow, user) => true;

export const canShareWorkflow = (workflow, user) => {
  if (typeof workflow?.canShare === 'boolean') {
    return workflow.canShare;
  }
  return isAdmin(user);
};

export const formatRole = (role = '') => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'USER') return 'Member';
  return role || 'Member';
};

export const roleBadgeClass = (role) => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'bg-[#292D32] text-white';
  return 'bg-[#D0FFA4] text-[#292D32]';
};
