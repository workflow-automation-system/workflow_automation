import React from 'react';
import {
  Building2,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Info,
  Mail,
  Search,
  Shield,
  Trash2,
  UserCircle2,
  UserPlus,
  Users,
  X,
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

const roleBadgeClass = (role) => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'bg-[#292D32] text-white';
  if (upper === 'VIEWER') return 'bg-[#E2E8F0] text-[#5C5C5C]';
  return 'bg-[#D0FFA4] text-[#292D32]';
};

const ROLE_OPTIONS = [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER];

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

const Organisation = () => {
  const [orgMeta, setOrgMeta] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updatingUserId, setUpdatingUserId] = React.useState(null);
  const [deletingUserId, setDeletingUserId] = React.useState(null);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });
  const [showInviteForm, setShowInviteForm] = React.useState(false);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteForm, setInviteForm] = React.useState({
    name: '',
    email: '',
    department: '',
    jobTitle: '',
    role: 'USER',
  });
  const [showRoleGuide, setShowRoleGuide] = React.useState(false);

  // Department CRUD Modals
  const [showRenameDeptForm, setShowRenameDeptForm] = React.useState(false);
  const [renameDeptOldName, setRenameDeptOldName] = React.useState('');
  const [renameDeptNewName, setRenameDeptNewName] = React.useState('');
  const [renameDeptLoading, setRenameDeptLoading] = React.useState(false);

  const [showDeleteDeptForm, setShowDeleteDeptForm] = React.useState(false);
  const [deleteDeptName, setDeleteDeptName] = React.useState('');
  const [deleteDeptLoading, setDeleteDeptLoading] = React.useState(false);

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
    if (!window.confirm(`Remove ${member.name || member.email} from the organization? This action cannot be undone.`)) return;

    setDeletingUserId(memberId);
    try {
      await authService.deleteUser(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast(`${member.name || member.email} has been removed.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member.', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setInviteLoading(true);
    try {
      const invited = await authService.inviteUser({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        department: inviteForm.department.trim() || undefined,
        jobTitle: inviteForm.jobTitle.trim() || undefined,
        role: inviteForm.role,
      });
      setMembers((prev) => [...prev, invited]);
      setShowInviteForm(false);
      setInviteForm({ name: '', email: '', department: '', jobTitle: '', role: 'USER' });
      showToast(`${invited.name || invited.email} has been invited.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to invite member.', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRenameDepartment = async (e) => {
    e.preventDefault();
    if (!renameDeptNewName.trim()) {
      showToast('New department name is required.', 'error');
      return;
    }
    setRenameDeptLoading(true);
    try {
      await authService.renameDepartment(renameDeptOldName, renameDeptNewName.trim());
      setMembers(prev => prev.map(m => m.department === renameDeptOldName ? { ...m, department: renameDeptNewName.trim() } : m));
      setShowRenameDeptForm(false);
      showToast(`Department renamed to ${renameDeptNewName.trim()}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to rename department.', 'error');
    } finally {
      setRenameDeptLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    setDeleteDeptLoading(true);
    try {
      await authService.deleteDepartment(deleteDeptName);
      setMembers(prev => prev.map(m => m.department === deleteDeptName ? { ...m, department: 'Unassigned' } : m));
      setShowDeleteDeptForm(false);
      showToast(`Department ${deleteDeptName} deleted`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete department.', 'error');
    } finally {
      setDeleteDeptLoading(false);
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
              ? `${orgMeta.name} - members, roles, and enterprise access governance.`
              : 'Manage enterprise teams, permissions, and department-level workflow governance.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {orgMeta?.domain && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#5C5C5C]">
              <span className="font-semibold text-[#292D32]">{orgMeta.domain}</span>
            </div>
          )}
          {currentUserIsAdmin && (
            <button
              type="button"
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3a3f44]"
            >
              <UserPlus size={16} />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#292D32]">Invite New Member</h2>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5C5C5C] transition-colors hover:bg-[#F6F5FA]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">Full Name *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@company.com"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">Department</label>
                  <input
                    type="text"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="Engineering"
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">Job Title</label>
                  <input
                    type="text"
                    value={inviteForm.jobTitle}
                    onChange={(e) => setInviteForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="Developer"
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{formatRole(role)}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-[#5C5C5C]">
                An invitation email will be sent with a secure link to choose a password.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 rounded-xl border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#5C5C5C] transition-colors hover:bg-[#F6F5FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292D32] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a3f44] disabled:opacity-60"
                >
                  {inviteLoading ? 'Sending...' : (
                    <>
                      <Mail size={14} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
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
          <p className="text-3xl font-bold text-[#292D32]">{adminCount}</p>
          <p className="text-sm text-[#5C5C5C]">Admins</p>
        </div>
      </div>

      {/* Departments */}
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
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#D0FFA4] px-2 py-1 text-[11px] font-semibold text-[#292D32]">
                      {dept.admins} admin{dept.admins !== 1 ? 's' : ''}
                    </span>
                    {currentUserIsAdmin && dept.name !== 'Unassigned' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRenameDeptOldName(dept.name);
                            setRenameDeptNewName(dept.name);
                            setShowRenameDeptForm(true);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#5C5C5C] hover:bg-[#F6F5FA]"
                          title="Rename Department"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteDeptName(dept.name);
                            setShowDeleteDeptForm(true);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#EF4444] hover:bg-red-50"
                          title="Delete Department"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#5C5C5C]">{dept.members} member{dept.members !== 1 ? 's' : ''}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Team Directory */}
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
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${roleBadgeClass(member.role)}`}>
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

      {/* Rename Department Modal */}
      {showRenameDeptForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#292D32]">Rename Department</h2>
              <button onClick={() => setShowRenameDeptForm(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5C5C5C] hover:bg-[#F6F5FA]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRenameDepartment} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">New Name for {renameDeptOldName} *</label>
                <input
                  type="text"
                  value={renameDeptNewName}
                  onChange={(e) => setRenameDeptNewName(e.target.value)}
                  placeholder="New Department Name"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRenameDeptForm(false)} className="flex-1 rounded-xl border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#5C5C5C] hover:bg-[#F6F5FA]">Cancel</button>
                <button type="submit" disabled={renameDeptLoading} className="flex-1 rounded-xl bg-[#292D32] py-2.5 text-sm font-semibold text-white hover:bg-[#3a3f44] disabled:opacity-60">{renameDeptLoading ? 'Saving...' : 'Rename'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Department Modal */}
      {showDeleteDeptForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#EF4444]">Delete Department</h2>
              <button onClick={() => setShowDeleteDeptForm(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5C5C5C] hover:bg-[#F6F5FA]">
                <X size={18} />
              </button>
            </div>
            <p className="mb-5 text-sm text-[#5C5C5C]">
              Are you sure you want to delete the <strong>{deleteDeptName}</strong> department? <br /><br />
              All members currently in this department will be moved to the <strong>Unassigned</strong> department.
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowDeleteDeptForm(false)} className="flex-1 rounded-xl border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#5C5C5C] hover:bg-[#F6F5FA]">Cancel</button>
              <button type="button" onClick={handleDeleteDepartment} disabled={deleteDeptLoading} className="flex-1 rounded-xl bg-[#EF4444] py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">{deleteDeptLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <Toast open={toast.open} message={toast.message} tone={toast.tone} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
};

export default Organisation;