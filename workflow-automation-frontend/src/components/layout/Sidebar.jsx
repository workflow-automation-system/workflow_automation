import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  LayoutGrid,
  Layers,
  LogOut,
  Plug,
  Settings,
  UserCircle2,
  Workflow,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Overview' },
  { path: '/organisation', icon: Building2, label: 'Organisation' },
  { path: '/workflows', icon: Workflow, label: 'Workflows' },
  { path: '/app-connections', icon: Plug, label: 'App Connections' },
  { path: '/templates', icon: Layers, label: 'Templates' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const { logout, user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-20 border-r border-[#E2E8F0]  p-3">
      <div className="flex h-full flex-col items-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
          <Workflow size={20} className="text-[#292D32]" />
        </div>

        <nav className="flex flex-1 flex-col items-center justify-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                [
                  'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                  isActive
                    ? 'border-[#D0FFA4] bg-[#D0FFA4] text-[#292D32]'
                    : 'border-transparent bg-white text-[#5E6672] hover:border-[#D0FFA4] hover:text-[#292D32]',
                ].join(' ')
              }
            >
              <item.icon size={18} />
            </NavLink>
          ))}
        </nav>

        <div className="w-full space-y-2">
          <button
            type="button"
            title={user?.name || 'User'}
            className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#292D32]"
          >
            <UserCircle2 size={18} />
          </button>
          <button
            type="button"
            title="Sign Out"
            onClick={logout}
            className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#5E6672] transition-colors hover:border-[#D0FFA4] hover:text-[#292D32]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
