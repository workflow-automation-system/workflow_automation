import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getRole } from '../../utils/rbac';

const routeTitles = {
  '/': 'Overview',
  '/organisation': 'Organisation',
  '/workflows': 'Workflows',
  '/app-connections': 'App Connections',
  '/templates': 'Templates',
  '/profile': 'Profile',
  '/audit': 'Audit Logs',
  '/forbidden': 'Permission Denied',
  '/create-workflow': 'Workflows',
};

const formatRole = (role = '') => {
  if (!role) return 'Member';
  if (role.toUpperCase() === 'ADMIN') return 'Admin';
  if (role.toUpperCase() === 'USER') return 'Member';
  if (role.toUpperCase() === 'VIEWER') return 'Viewer';
  return role;
};

const roleBadgeColor = {
  ADMIN: 'bg-[#292D32] text-white',
  USER: 'bg-[#D0FFA4] text-[#292D32]',
  VIEWER: 'bg-[#E2E8F0] text-[#5C5C5C]',
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const pageTitle = React.useMemo(() => {
    if (location.pathname.startsWith('/workflow/')) return 'Workflows';
    return routeTitles[location.pathname] || 'Overview';
  }, [location.pathname]);

  const breadcrumbs = React.useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items = [{ label: 'Overview', path: '/' }];

    segments.forEach((segment, index) => {
      items.push({
        label: segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        path: `/${segments.slice(0, index + 1).join('/')}`,
      });
    });

    return items;
  }, [location.pathname]);

  return (
    <header className="fixed left-20 top-0 z-30 h-16 w-[calc(100%-5rem)] border-b border-[#E2E8F0] bg-[#F6F5FA]/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[#292D32]">{pageTitle}</p>
          <nav className="hidden items-center gap-1 text-xs text-[#8D95A1] md:flex">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronRight size={12} />}
                <button
                  type="button"
                  onClick={() => navigate(crumb.path)}
                  className={index === breadcrumbs.length - 1 ? 'text-[#292D32]' : 'hover:text-[#292D32]'}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${roleBadgeColor[getRole(user)] || roleBadgeColor.USER}`}>
            {formatRole(user?.role)}
          </span>
          {user?.organization?.name && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 text-right">
              <p className="text-xs font-semibold text-[#292D32]">{user.organization.name}</p>
              <p className="text-[11px] text-[#8D95A1]">{formatRole(user?.role)} workspace</p>
            </div>
          )}
        </div>
      </div >
    </header >
  );
};

export default Navbar;
