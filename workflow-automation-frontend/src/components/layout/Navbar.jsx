import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin } from '../../utils/rbac';
import NotificationBell from '../NotificationBell';

const routeTitles = {
  '/': 'Overview',
  '/dashboard': 'Overview',
  '/organisation': 'Organisation',
  '/workflows': 'Workflows',
  '/app-connections': 'App Connections',
  '/templates': 'Templates',
  '/audit': 'Audit Logs',
  '/forbidden': 'Permission Denied',
  '/create-workflow': 'Workflows',
  '/profile': 'My Profile',
};

const formatRole = (role = '') => {
  if (!role) return 'Member';
  if (role.toUpperCase() === 'ADMIN') return 'Admin';
  if (role.toUpperCase() === 'USER') return 'Member';
  return role;
};

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const pageTitle = React.useMemo(() => {
    if (location.pathname.startsWith('/workflow/') || location.pathname.startsWith('/workflows/')) {
      return 'Workflows';
    }
    if (location.pathname === '/organisation' && !isAdmin(user)) {
      return 'My Workspace';
    }
    return routeTitles[location.pathname] || 'Overview';
  }, [location.pathname, user]);

  return (
    <header className="fixed left-20 top-0 z-30 h-16 w-[calc(100%-5rem)] border-b border-[#E2E8F0] bg-[#E2E8F0]/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[#292D32]">{pageTitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          {user?.organization?.name && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2 text-right shadow-sm">
              <p className="text-sm font-bold text-[#292D32]">{user.organization.name}</p>
              <p className="text-[11px] font-medium text-[#8D95A1] uppercase tracking-wider mt-0.5">{formatRole(user?.role)} workspace</p>
            </div>
          )}
        </div>
      </div>
    </header >
  );
};

export default Navbar;
