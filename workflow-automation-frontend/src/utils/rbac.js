export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  VIEWER: 'VIEWER',
};

export const getRole = (user) => String(user?.role || ROLES.USER).toUpperCase();

export const isAdmin = (user) => getRole(user) === ROLES.ADMIN;
export const isViewer = (user) => getRole(user) === ROLES.VIEWER;

export const canCreateWorkflow = (user) => !isViewer(user);
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
  if (typeof workflow?.canDelete === 'boolean') {
    return workflow.canDelete;
  }

  return canEditWorkflow(workflow, user);
};

export const canExecuteWorkflow = (workflow, user) => {
  if (typeof workflow?.canExecute === 'boolean') {
    return workflow.canExecute;
  }

  return !isViewer(user);
};

export const canShareWorkflow = (workflow, user) => {
  if (typeof workflow?.canShare === 'boolean') {
    return workflow.canShare;
  }

  return isAdmin(user);
};
