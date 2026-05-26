import React from 'react';
import {
  Building2,
  BriefcaseBusiness,
  Mail,
  Search,
  Shield,
  Trash2,
  UserCircle2,
  Users,
} from 'lucide-react';
import authService, { API } from '../services/authService';
import Toast from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import { isAdmin, ROLES } from '../utils/rbac';

const formatRole = (role = '') => {
  if (!role) return 'Member';
  const upper = role.toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'USER') return 'Member';
  if (upper === 'VIEWER') return 'Viewer';
  return role;
};

const ROLE_OPTIONS = [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER];

const Organisation = () => {
  const [orgMeta, setOrgMeta] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updatingUserId, setUpdatingUserId] = React.useState(null);
  const [deletingUserId, setDeletingUserId] = React.useState(null);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });
  const { user } = useAuthStore();
  const currentUserIsAdmin = isAdmin(user);

  const showToast = React.useCallback((message, tone = 'info') => {
    setToast({ open: true, message, tone });
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const orgId = user?.organizationId;
        const [orgRes, usersRes] = await Promise.all([
          orgId ? API.get(`/organizations/${orgId}`) : Promise.resolve({ data: null }),
          API.get('/auth/admin/users'),
        ]);
        if (isMounted) {
          setOrgMeta(orgRes.data);
          setMembers(usersRes.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Unable to load your organization workspace.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [user?.organizationId]);

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
    return [member.name, member.email, member.department, member.jobTitle, member.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const departments = React.useMemo(() => {
    const grouped = members.reduce((acc, member) => {
      const key = member.department || 'Unassigned';
      if (!acc[key]) acc[key] = { name: key, members: 0, admins: 0 };
      acc[key].members += 1;
      if ((member.role || '').toUpperCase() === 'ADMIN') acc[key].admins += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.members - a.members);
  }, [members]);

  const adminCount = members.filter((m) => (m.role || '').toUpperCase() === 'ADMIN').length;

  if (isLoading) {
    return (
      <div className="space-y-5 font-urbanist">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Organisation</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">Loading your enterprise workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5 font-urbanist">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Organisation</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">Enterprise member directory and workspace governance.</p>
        </div>
        <div className="enterprise-card border border-red-200 bg-red-50 p-5 text-sm text-[#EF4444]">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-urbanist">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Organisation</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            {orgMeta?.name
              ? `${orgMeta.name} — members, roles, and enterprise access governance.`
              : 'Manage enterprise teams, permissions, and department-level workflow governance.'}
          </p>
        </div>
<<<<<<< Updated upstream
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#5C5C5C]">
          <span className="font-semibold text-[#292D32]">{organization?.domain || 'Enterprise workspace'}</span>
          <span className="ml-2">synced from auth-service</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
              <Users size={18} className="text-[#292D32]" />
            </div>
            <span className="rounded-full bg-[#D0FFA4] px-2 py-1 text-xs font-semibold text-[#292D32]">
              {organization?.activeMemberCount || 0} active
            </span>
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{organization?.memberCount || 0}</p>
          <p className="text-sm text-[#5C5C5C]">Organization Members</p>
        </div>

=======
        {orgMeta?.domain && (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#5C5C5C]">
            <span className="font-semibold text-[#292D32]">{orgMeta.domain}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
              <Users size={18} className="text-[#292D32]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{members.length}</p>
          <p className="text-sm text-[#5C5C5C]">Organization Members</p>
        </div>

>>>>>>> Stashed changes
        <div className="enterprise-card p-5">
          <div className="mb-3 rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5 w-fit">
            <Building2 size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{departments.length}</p>
          <p className="text-sm text-[#5C5C5C]">Departments</p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] p-2.5 w-fit">
            <Shield size={18} className="text-[#292D32]" />
          </div>
<<<<<<< Updated upstream
          <p className="text-3xl font-bold text-[#292D32]">{organization?.privilegedRoleCount || 0}</p>
          <p className="text-sm text-[#5C5C5C]">Privileged Roles</p>
        </div>
      </div>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">Department Coverage</h2>
          <p className="text-sm text-[#5C5C5C]">Business units currently represented inside your enterprise automation workspace.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          {departments.map((department) => (
            <article key={department.name} className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#292D32]">{department.name}</p>
                <span className="rounded-full bg-[#D0FFA4] px-2 py-1 text-[11px] font-semibold text-[#292D32]">
                  {department.admins} admin{department.admins > 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5C5C5C]">{department.members} members with workflow access</p>
            </article>
          ))}
          {!departments.length && (
            <article className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-4 text-sm text-[#5C5C5C]">
              No departments available yet. New members will appear here after registration.
            </article>
          )}
        </div>
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#292D32]">Team Directory</h2>
            <p className="text-sm text-[#5C5C5C]">Role-based access controls for automation assets and production workflows.</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search members"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none md:w-64"
            />
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredMembers.map((member) => (
            <div key={member.email} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2E8F0]">
                  <UserCircle2 size={20} className="text-[#292D32]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#292D32]">{member.name}</p>
                  <p className="text-xs text-[#5C5C5C]">{member.department}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#5C5C5C]">
                  {formatRole(member.role)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#5C5C5C]">
                  <BriefcaseBusiness size={12} />
                  {member.jobTitle}
                </span>
                <div className="flex items-center gap-1 text-[#5C5C5C]">
                  <Mail size={14} />
                  <span className="text-xs">{member.email}</span>
=======
          <p className="text-3xl font-bold text-[#292D32]">{adminCount}</p>
          <p className="text-sm text-[#5C5C5C]">Admins</p>
        </div>
      </div>

      {departments.length > 0 && (
        <section className="enterprise-card overflow-hidden">
          <div className="border-b border-[#E2E8F0] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#292D32]">Department Coverage</h2>
            <p className="text-sm text-[#5C5C5C]">Business units inside your enterprise workspace.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
            {departments.map((dept) => (
              <article key={dept.name} className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#292D32]">{dept.name}</p>
                  <span className="rounded-full bg-[#D0FFA4] px-2 py-1 text-[11px] font-semibold text-[#292D32]">
                    {dept.admins} admin{dept.admins !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#5C5C5C]">{dept.members} member{dept.members !== 1 ? 's' : ''}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="enterprise-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#292D32]">Team Directory</h2>
            <p className="text-sm text-[#5C5C5C]">Role-based access controls for automation assets and production workflows.</p>
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

        <div className="divide-y divide-[#E2E8F0]">
          {filteredMembers.map((member) => {
            const memberId = member.id;
            const isSelf = memberId === user?.id;
            const isUpdating = updatingUserId === memberId;
            const isDeleting = deletingUserId === memberId;

            return (
              <div key={memberId} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2E8F0]">
                    <UserCircle2 size={20} className="text-[#292D32]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#292D32]">{member.name || member.email}</p>
                      {isSelf && (
                        <span className="rounded-full bg-[#F6F5FA] px-2 py-0.5 text-[10px] text-[#5C5C5C]">You</span>
                      )}
                    </div>
                    <p className="text-xs text-[#5C5C5C]">{member.department || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#5C5C5C]">
                    {formatRole(member.role)}
                  </span>
                  {member.jobTitle && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#5C5C5C]">
                      <BriefcaseBusiness size={12} />
                      {member.jobTitle}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[#5C5C5C]">
                    <Mail size={14} />
                    <span className="text-xs">{member.email}</span>
                  </div>
                  {currentUserIsAdmin && (
                    <>
                      <select
                        value={(member.role || 'USER').toUpperCase()}
                        onChange={(e) => handleRoleChange(member, e.target.value)}
                        disabled={isUpdating || isSelf}
                        className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#292D32] focus:border-[#D0FFA4] focus:outline-none disabled:opacity-60"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{formatRole(role)}</option>
                        ))}
                      </select>
                      {!isSelf && (
                        <button
                          type="button"
                          title="Remove member"
                          onClick={() => handleRemoveMember(member)}
                          disabled={isDeleting}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#EF4444] transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                  {(isUpdating || isDeleting) && (
                    <span className="text-xs text-[#5C5C5C]">{isDeleting ? 'Removing...' : 'Saving...'}</span>
                  )}
>>>>>>> Stashed changes
                </div>
              </div>
            );
          })}
          {!filteredMembers.length && (
            <div className="px-5 py-6 text-sm text-[#5C5C5C]">
              No members match your search.
            </div>
          )}
        </div>
      </section>
<<<<<<< Updated upstream
=======

      <Toast open={toast.open} message={toast.message} tone={toast.tone} onClose={() => setToast((t) => ({ ...t, open: false }))} />
>>>>>>> Stashed changes
    </div>
  );
};

export default Organisation;
