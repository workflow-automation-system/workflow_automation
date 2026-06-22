export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

export const getRole = (user) => String(user?.role || ROLES.USER).toUpperCase();

export const isAdmin = (user) => getRole(user) === ROLES.ADMIN;

// Viewer role has been removed; isViewer always returns false
export const isViewer = (user) => false;

export const canCreateWorkflow = (user) => true; // Viewer role removed
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

export const canExecuteWorkflow = (workflow, user) => true; // Viewer role removed

export const canShareWorkflow = (workflow, user) => {
  if (typeof workflow?.canShare === 'boolean') {
    return workflow.canShare;
  }
  return isAdmin(user);
};
