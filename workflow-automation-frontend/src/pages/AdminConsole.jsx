import React from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  Shield,
  Trash2,
  UserCircle2,
  UserPlus,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import authService, { API } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { ROLES } from '../utils/rbac';

const ROLE_OPTIONS = [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER];

const formatRole = (role = '') => {
  if (!role) return 'Member';
  const upper = role.toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'USER') return 'Member';
  if (upper === 'VIEWER') return 'Viewer';
  return role;
};

const roleBadgeClass = (role) => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'bg-[#292D32] text-white';
  if (upper === 'VIEWER') return 'bg-[#E2E8F0] text-[#5C5C5C]';
  return 'bg-[#D0FFA4] text-[#292D32]';
};

const ROLE_INFO = [
  {
    role: 'Admin',
    badge: 'bg-[#292D32] text-white',
    permissions: [
      'Full platform access',
      'Manage members and assign roles',
      'Create, edit, delete workflows',
      'Manage integrations and settings',
      'View audit logs',
    ],
  },
  {
    role: 'Member',
    badge: 'bg-[#D0FFA4] text-[#292D32]',
    permissions: [
      'Create and edit own workflows',
      'Execute permitted workflows',
      'View templates',
    ],
  },
  {
    role: 'Viewer',
    badge: 'bg-[#E2E8F0] text-[#5C5C5C]',
    permissions: [
      'View workflows (read-only)',
      'View execution history',
      'Execute where granted',
    ],
  },
];

const AdminConsole = () => {
  const [members, setMembers] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updatingUserId, setUpdatingUserId] = React.useState(null);
  const [deletingUserId, setDeletingUserId] = React.useState(null);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });
  const [showRoleGuide, setShowRoleGuide] = React.useState(false);
  const { user } = useAuthStore();

  const showToast = React.useCallback((message, tone = 'info') => {
    setToast({ open: true, message, tone });
  }, []);

  const loadMembers = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const users = await API.get('/auth/admin/users');
      setMembers(users.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load members.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRoleChange = async (member, newRole) => {
    if (newRole === member.role) return;
    const memberId = member.id;

    setUpdatingUserId(memberId);
    try {
      await authService.updateUserRole(memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m)
      );
      showToast(`${member.name || member.email} is now ${formatRole(newRole)}.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = member.id;
    if (memberId === user?.id) {
      showToast('You cannot remove yourself.', 'error');
      return;
    }
    if (!window.confirm(`Remove ${member.name || member.email} from the organization?`)) return;

    setDeletingUserId(memberId);
    try {
      const orgId = user?.organizationId;
      await API.delete(`/organizations/${orgId}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast(`${member.name || member.email} removed.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member.', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [member.name, member.email, member.department, member.role]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(query));
  });

  const adminCount = members.filter((m) => (m.role || '').toUpperCase() === 'ADMIN').length;
  const userCount = members.filter((m) => (m.role || '').toUpperCase() === 'USER' || !(m.role)).length;
  const viewerCount = members.filter((m) => (m.role || '').toUpperCase() === 'VIEWER').length;

  return (
    <div className="space-y-5 font-urbanist">
      <div>
        <h1 className="text-3xl font-bold text-[#292D32]">Admin Console</h1>
        <p className="mt-1 text-sm text-[#5C5C5C]">
          Manage your organization's members, assign roles, and enforce access policies.
        </p>
      </div>

      <section className="enterprise-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRoleGuide((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#F6F5FA]"
        >
          <div className="flex items-center gap-2">
            <Info size={16} className="text-[#292D32]" />
            <span className="text-sm font-semibold text-[#292D32]">How roles work</span>
          </div>
          {showRoleGuide
            ? <ChevronUp size={16} className="text-[#5C5C5C]" />
            : <ChevronDown size={16} className="text-[#5C5C5C]" />}
        </button>

        {showRoleGuide && (
          <div className="border-t border-[#E2E8F0] p-5 space-y-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F6F5FA] p-4 text-sm text-[#5C5C5C] space-y-2">
              <p><strong className="text-[#292D32]">First user</strong> who creates an organization is automatically assigned the <strong className="text-[#292D32]">Admin</strong> role.</p>
              <p>All subsequent users who sign up join as <strong className="text-[#292D32]">Member</strong> by default.</p>
              <p>Only an <strong className="text-[#292D32]">Admin</strong> can change a member's role to Admin, Member, or Viewer using the dropdown below.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {ROLE_INFO.map((info) => (
                <div key={info.role} className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${info.badge}`}>
                    {info.role}
                  </span>
                  <ul className="mt-3 space-y-1.5">
                    {info.permissions.map((perm) => (
                      <li key={perm} className="flex items-start gap-2 text-xs text-[#5C5C5C]">
                        <Check size={12} className="mt-0.5 shrink-0 text-[#292D32]" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="enterprise-card p-5">
          <p className="text-sm text-[#5C5C5C]">Total Members</p>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{members.length}</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#292D32]" />
            <p className="text-sm text-[#5C5C5C]">Admins</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{adminCount}</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D0FFA4]" />
            <p className="text-sm text-[#5C5C5C]">Members</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{userCount}</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
            <p className="text-sm text-[#5C5C5C]">Viewers</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{viewerCount}</p>
        </div>
      </div>

      <section className="enterprise-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#292D32]" />
            <h2 className="text-lg font-semibold text-[#292D32]">Role Management</h2>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none md:w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#5C5C5C]">Loading members...</div>
        ) : error ? (
          <div className="p-5 text-sm text-[#EF4444]">{error}</div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredMembers.map((member) => {
              const memberId = member.id;
              const isUpdating = updatingUserId === memberId;
              const isDeleting = deletingUserId === memberId;
              const isSelf = memberId === user?.id;

              return (
                <div
                  key={memberId}
                  className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2E8F0]">
                      <UserCircle2 size={20} className="text-[#292D32]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#292D32]">
                          {member.name || member.email}
                        </p>
                        {isSelf && (
                          <span className="rounded-full bg-[#F6F5FA] px-2 py-0.5 text-[10px] text-[#5C5C5C]">You</span>
                        )}
                      </div>
                      <p className="text-xs text-[#5C5C5C]">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${roleBadgeClass(member.role)}`}>
                      {formatRole(member.role)}
                    </span>
                    <select
                      value={(member.role || 'USER').toUpperCase()}
                      onChange={(e) => handleRoleChange(member, e.target.value)}
                      disabled={isUpdating || isSelf}
                      className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none disabled:opacity-60"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {formatRole(role)}
                        </option>
                      ))}
                    </select>
                    {!isSelf && (
                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => handleRemoveMember(member)}
                        disabled={isDeleting}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#EF4444] transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {(isUpdating || isDeleting) && (
                      <span className="text-xs text-[#5C5C5C]">
                        {isDeleting ? 'Removing...' : 'Saving...'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {!filteredMembers.length && (
              <div className="px-5 py-6 text-sm text-[#5C5C5C]">No members match your search.</div>
            )}
          </div>
        )}
      </section>

      <Toast open={toast.open} message={toast.message} tone={toast.tone} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
};

export default AdminConsole;
