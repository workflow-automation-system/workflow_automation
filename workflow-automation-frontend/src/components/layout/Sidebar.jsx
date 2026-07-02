import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutGrid,
  Layers,
  LogOut,
  Plug,
  ScrollText,
  UserCircle2,
  Users,
  Workflow,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { isAdmin, getRole } from '../../utils/rbac';

const roleBadgeStyles = {
  ADMIN: 'bg-[#292D32] text-white',
  USER: 'bg-[#D0FFA4] text-[#292D32]',
};

const roleLabel = { ADMIN: 'A', USER: 'U' };

const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const role = getRole(user);
  const admin = isAdmin(user);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const items = [
    { path: '/dashboard', icon: LayoutGrid, label: 'Overview' },
    {
      path: '/organisation',
      icon: admin ? Building2 : Users,
      label: admin ? 'Organisation' : 'My Team',
    },
    { path: '/workflows', icon: Workflow, label: 'Workflows' },
    { path: '/app-connections', icon: Plug, label: 'App Connections' },
    { path: '/templates', icon: Layers, label: 'Templates' },
    admin ? { path: '/audit', icon: ScrollText, label: 'Audit' } : null,
  ].filter(Boolean);

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-20 border-r border-[#E2E8F0] p-3">
        <div className="flex h-full flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D0FFA4] shadow-sm">
            <Workflow size={22} className="text-[#292D32]" />
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-2">
            {items.map((item) => (
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
            <div className="relative">
              <button
                type="button"
                title={`${user?.name || 'User'} (${role}) — View Profile`}
                onClick={() => navigate('/profile')}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#292D32] transition-colors hover:border-[#D0FFA4]"
              >
                <UserCircle2 size={18} />
              </button>
              <span
                title={role}
                className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}
              >
                {roleLabel[role] || 'U'}
              </span>
            </div>
            <button
              type="button"
              title="Sign Out"
              onClick={() => setShowLogoutModal(true)}
              className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#5E6672] transition-colors hover:border-[#D0FFA4] hover:text-[#292D32]"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-[#292D32]">Confirm Logout</h3>
            <p className="mb-6 text-sm text-[#5E6672]">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#5E6672] transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                  navigate('/login');
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
