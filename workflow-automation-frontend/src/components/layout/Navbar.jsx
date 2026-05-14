import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Moon, Sun } from 'lucide-react';

const routeTitles = {
  '/': 'Overview',
  '/organisation': 'Organisation',
  '/workflows': 'Workflows',
  '/app-connections': 'App Connections',
  '/templates': 'Templates',
  '/settings': 'Settings',
  '/create-workflow': 'Workflows',
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = React.useState(false);

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

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
               className="relative inline-flex rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#5E6672] transition-colors hover:border-[#D0FFA4] hover:bg-[#F6F5FA]"
            >
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D0FFA4]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-lg">
                <p className="text-sm font-semibold text-[#292D32]">Notifications</p>
                <p className="mt-1 text-xs text-[#5E6672]">All enterprise systems are running normally.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
