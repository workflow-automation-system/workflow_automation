import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const routeTitles = {
  '/': 'Overview',
  '/dashboard': 'Overview',
  '/organisation': 'Organisation',
  '/workflows': 'Workflows',
  '/app-connections': 'App Connections',
  '/templates': 'Templates',
  '/settings': 'Settings',
  '/create-workflow': 'Workflows',
};

const formatRole = (role = '') => {
  if (!role) return 'Member';
  if (role.toUpperCase() === 'ADMIN') return 'Admin';
  if (role.toUpperCase() === 'USER') return 'Member';
  return role;
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const pageTitle = React.useMemo(() => {
    if (location.pathname.startsWith('/workflow/') || location.pathname.startsWith('/workflows/')) return 'Workflows';
    return routeTitles[location.pathname] || 'Overview';
  }, [location.pathname]);

  const breadcrumbs = React.useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items = [{ label: 'Overview', path: '/dashboard' }];

    segments.forEach((segment, index) => {
      if (segment.toLowerCase() === 'dashboard') {
        return; // skip duplicate overview breadcrumb
      }

      let label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let path = `/${segments.slice(0, index + 1).join('/')}`;

      if (/^\d+$/.test(segment)) {
        label = 'Detail';
      }

      const isWorkflowParent = segment.toLowerCase() === 'workflow' || segment.toLowerCase() === 'workflows';
      if (isWorkflowParent) {
        label = 'Workflows';
        path = '/workflows';
      }

      const isWorkflowDetail = index > 0 && (segments[index - 1].toLowerCase() === 'workflow' || segments[index - 1].toLowerCase() === 'workflows');
      if (isWorkflowDetail) {
        label = 'Detail';
        path = `/workflows/${segment}`;
      }

      items.push({ label, path });
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
          {user?.organization?.name && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 text-right">
              <p className="text-xs font-semibold text-[#292D32]">{user.organization.name}</p>
              <p className="text-[11px] text-[#8D95A1]">{formatRole(user.role)} workspace</p>
            </div>
          )}
        </div >
      </div >
    </header >
  );
};

export default Navbar;
