import React from 'react';
import {
  Building2,
  BriefcaseBusiness,

  Mail,
  Pencil,
  Plus,
  Search,

  Trash2,
  UserCircle2,
  UserPlus,

  X,
} from 'lucide-react';
import authService, { API } from '../services/authService';
import organizationService from '../services/organizationService';
import Toast from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { useAuthStore } from '../stores/authStore';
import { isAdmin } from '../utils/rbac';
import {
  isActiveMember,
  isPendingInvitation,
  memberIdentityId,
  memberKey,
  MEMBER_TYPE,
} from '../constants/memberStatus';
import { mergeDepartmentsWithMembers } from '../utils/departments';

const formatRole = (role = '') => {
  if (!role) return 'Member';
  const upper = role.toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'USER') return 'Member';
  return role;
};

const roleBadgeClass = (role) => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'bg-[#292D32] text-white';
  return 'bg-[#D0FFA4] text-[#292D32]';
};



const Organisation = () => {
  const [orgMeta, setOrgMeta] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [managedDepartments, setManagedDepartments] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState('All');
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [showInviteForm, setShowInviteForm] = React.useState(false);
  const [pageView, setPageView] = React.useState('members');
  const [showDeptForm, setShowDeptForm] = React.useState(false);
  const [deptFormName, setDeptFormName] = React.useState('');
  const [editingDepartment, setEditingDepartment] = React.useState(null);
  const [deptSaving, setDeptSaving] = React.useState(false);
  const [deletingDeptId, setDeletingDeptId] = React.useState(null);
  const [deleteDeptModal, setDeleteDeptModal] = React.useState({ open: false, department: null });
  const [updatingMemberDeptKey, setUpdatingMemberDeptKey] = React.useState(null);
  const [inviteForm, setInviteForm] = React.useState({
    name: '',
    email: '',
    department: '',
    jobTitle: '',
  });
  const [activeTab, setActiveTab] = React.useState('active');

  const { user } = useAuthStore();
  const currentUserIsAdmin = isAdmin(user);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });
  const [deletingMemberKey, setDeletingMemberKey] = React.useState(null);
  const [deleteMemberModal, setDeleteMemberModal] = React.useState({ open: false, member: null });

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
        const [orgRes, membersRes, departmentsRes] = await Promise.all([
          orgId ? API.get(`/organizations/${orgId}`) : Promise.resolve({ data: null }),
          authService.getMembers(),
          currentUserIsAdmin ? organizationService.getDepartments() : Promise.resolve([]),
        ]);
        if (isMounted) {
          setOrgMeta(orgRes.data);
          const memberList = membersRes || [];
          setMembers(memberList);
          setManagedDepartments(
            mergeDepartmentsWithMembers(departmentsRes || [], memberList)
          );
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
  }, [user?.organizationId, currentUserIsAdmin]);

  const handleRemoveMember = (member) => {
    const identityId = memberIdentityId(member);
    const isInvitation = member.type === MEMBER_TYPE.INVITATION;
    const isSelf = !isInvitation && identityId === user?.id;

    if (isSelf) {
      showToast('You cannot remove yourself.', 'error');
      return;
    }

    setDeleteMemberModal({ open: true, member });
  };

  const confirmRemoveMember = async () => {
    const member = deleteMemberModal.member;
    if (!member) return;

    const identityId = memberIdentityId(member);
    const isInvitation = member.type === MEMBER_TYPE.INVITATION;
    const actionLabel = isInvitation ? 'cancel this invitation for' : 'remove';
    const key = memberKey(member);

    setDeletingMemberKey(key);
    try {
      if (isInvitation) {
        await authService.cancelInvitation(identityId);
      } else {
        await authService.deleteUser(identityId);
      }
      setMembers((prev) => prev.filter((m) => memberKey(m) !== key));
      showToast(
        isInvitation
          ? `Invitation for ${member.name || member.email} has been cancelled.`
          : `${member.name || member.email} has been removed.`,
        'success'
      );
      setDeleteMemberModal({ open: false, member: null });
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to ${actionLabel} member.`, 'error');
    } finally {
      setDeletingMemberKey(null);
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
      });
      setMembers((prev) => [...prev, { ...invited, type: MEMBER_TYPE.INVITATION }]);
      setShowInviteForm(false);
      setInviteForm({ name: '', email: '', department: '', jobTitle: '' });
      showToast(`${invited.name || invited.email} has been invited.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to invite member.', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const refreshWorkspace = React.useCallback(async () => {
    const [membersRes, departmentsRes] = await Promise.all([
      authService.getMembers(),
      currentUserIsAdmin ? organizationService.getDepartments() : Promise.resolve([]),
    ]);
    const memberList = membersRes || [];
    setMembers(memberList);
    setManagedDepartments(mergeDepartmentsWithMembers(departmentsRes || [], memberList));
  }, [currentUserIsAdmin]);

  const openCreateDepartment = () => {
    setEditingDepartment(null);
    setDeptFormName('');
    setShowDeptForm(true);
  };

  const openEditDepartment = (department) => {
    setEditingDepartment(department);
    setDeptFormName(department.name);
    setShowDeptForm(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    const name = deptFormName.trim();
    if (!name) {
      showToast('Department name is required.', 'error');
      return;
    }

    setDeptSaving(true);
    try {
      if (editingDepartment?.id) {
        await organizationService.renameDepartment(editingDepartment.id, name);
        showToast(`Department renamed to "${name}".`, 'success');
      } else {
        await organizationService.createDepartment(name);
        showToast(`Department "${name}" created.`, 'success');
      }
      setShowDeptForm(false);
      setEditingDepartment(null);
      setDeptFormName('');
      await refreshWorkspace();
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || 'Failed to save department.',
        'error'
      );
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDepartment = (department) => {
    if (!department.id) {
      showToast('This department is not synced yet. Refresh the page or recreate it from Department Management.', 'error');
      return;
    }

    if (department.memberCount > 0) {
      showToast('Reassign all members before deleting this department.', 'error');
      return;
    }

    setDeleteDeptModal({ open: true, department });
  };

  const confirmDeleteDepartment = async () => {
    const department = deleteDeptModal.department;
    if (!department) return;

    setDeletingDeptId(department.id);
    try {
      await organizationService.deleteDepartment(department.id);
      showToast(`Department "${department.name}" deleted.`, 'success');
      if (selectedDept === department.name) {
        setSelectedDept('All');
      }
      setDeleteDeptModal({ open: false, department: null });
      await refreshWorkspace();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete department.', 'error');
    } finally {
      setDeletingDeptId(null);
    }
  };

  const handleAssignMemberDepartment = async (member, nextDepartment) => {
    const identityId = memberIdentityId(member);
    const currentDepartment = member.department || 'Unassigned';
    const normalizedNext = nextDepartment || 'Unassigned';

    if (normalizedNext === currentDepartment) {
      return;
    }

    const key = memberKey(member);
    setUpdatingMemberDeptKey(key);
    try {
      const updated = await authService.assignMemberDepartment(identityId, {
        type: member.type || MEMBER_TYPE.MEMBER,
        department: normalizedNext === 'Unassigned' ? '' : normalizedNext,
      });

      setMembers((prev) => prev.map((item) => (memberKey(item) === key ? { ...item, ...updated } : item)));
      await refreshWorkspace();
      showToast(
        `${updated.name || updated.email} assigned to ${updated.department || 'Unassigned'}.`,
        'success'
      );
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update member department.', 'error');
    } finally {
      setUpdatingMemberDeptKey(null);
    }
  };

  const activeMembers = members.filter(isActiveMember);
  const pendingMembers = members.filter(isPendingInvitation);

  const filteredMembers = (activeTab === 'active' ? activeMembers : pendingMembers).filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [member.name, member.email, member.department, member.jobTitle, member.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    const matchesDept = selectedDept === 'All' || (member.department || 'Unassigned') === selectedDept;
    return matchesSearch && matchesDept;
  }).sort((a, b) => {
    const isAdminA = (a.role || '').toUpperCase() === 'ADMIN';
    const isAdminB = (b.role || '').toUpperCase() === 'ADMIN';
    
    if (isAdminA && !isAdminB) return -1;
    if (!isAdminA && isAdminB) return 1;
    
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    
    if (dateA && dateB && dateA !== dateB) {
      return dateA - dateB;
    }
    return 0;
  });



  const departmentFilterOptions = React.useMemo(() => {
    const options = [...managedDepartments].sort((a, b) => b.memberCount - a.memberCount);
    const unassignedCount = activeMembers.filter(
      (member) => !member.department || member.department === 'Unassigned'
    ).length;

    if (unassignedCount > 0) {
      options.push({ name: 'Unassigned', memberCount: unassignedCount, adminCount: 0 });
    }

    return options;
  }, [managedDepartments, activeMembers]);



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
    <div className="space-y-5 font-urbanist animate-fadeIn">
      {/* 1. Global Header and Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Organisation</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            {orgMeta?.name
              ? `${orgMeta.name} - members, roles, and enterprise access governance.`
              : 'Manage enterprise teams, permissions, and department-level workflow governance.'}
          </p>
        </div>
      </div>


      {/* 2. Main Tabs */}
      {currentUserIsAdmin && (
        <div className="flex gap-2 border-b border-[#E2E8F0] pb-2">
          <button
            type="button"
            onClick={() => setPageView('members')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${pageView === 'members' ? 'bg-[#292D32] text-white' : 'bg-transparent text-[#5C5C5C] hover:bg-[#F6F5FA]'}`}
          >
            Team Directory
          </button>
          <button
            type="button"
            onClick={() => setPageView('departments')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${pageView === 'departments' ? 'bg-[#292D32] text-white' : 'bg-transparent text-[#5C5C5C] hover:bg-[#F6F5FA]'}`}
          >
            Departments ({managedDepartments.length})
          </button>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
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
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {managedDepartments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
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

      {showDeptForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#292D32]">
                {editingDepartment ? 'Rename Department' : 'Create Department'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowDeptForm(false);
                  setEditingDepartment(null);
                  setDeptFormName('');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5C5C5C] transition-colors hover:bg-[#F6F5FA]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              {editingDepartment?.memberCount > 0 && (
                <p className="rounded-xl border border-[#E2E8F0] bg-[#F6F5FA] px-3 py-2 text-xs text-[#5C5C5C]">
                  Renaming updates all {editingDepartment.memberCount} assigned member
                  {editingDepartment.memberCount !== 1 ? 's' : ''} in real time.
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5C5C5C]">Department Name *</label>
                <input
                  type="text"
                  value={deptFormName}
                  onChange={(e) => setDeptFormName(e.target.value)}
                  placeholder="Engineering"
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeptForm(false);
                    setEditingDepartment(null);
                    setDeptFormName('');
                  }}
                  className="flex-1 rounded-xl border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#5C5C5C] transition-colors hover:bg-[#F6F5FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292D32] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a3f44] disabled:opacity-60"
                >
                  {deptSaving ? 'Saving...' : editingDepartment ? 'Rename' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments View */}
      {pageView === 'departments' && currentUserIsAdmin && (
        <section className="enterprise-card overflow-hidden animate-fadeIn">
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between bg-[#f9fafb]">
            <div>
              <h2 className="text-lg font-semibold text-[#292D32]">Department Management</h2>
              <p className="text-sm text-[#5C5C5C]">
                Create departments, rename them in real time for all assigned members, and delete only empty departments.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateDepartment}
              className="flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a3f44]"
            >
              <Plus size={16} />
              Add Department
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {managedDepartments.map((department) => (
              <div
                key={department.id ?? department.name}
                className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between transition-colors hover:bg-[#F6F5FA]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D0FFA4]">
                    <Building2 size={20} className="text-[#292D32]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#292D32]">{department.name}</p>
                    <p className="text-xs text-[#5C5C5C]">
                      {department.memberCount} member{department.memberCount !== 1 ? 's' : ''}
                      {department.adminCount > 0
                        ? ` · ${department.adminCount} admin${department.adminCount !== 1 ? 's' : ''}`
                        : ''}
                      {department.memberCount === 0 ? ' · unused' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Rename department"
                    onClick={() => openEditDepartment(department)}
                    disabled={!department.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#292D32] transition-colors hover:bg-[#E2E8F0] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title={department.memberCount > 0 ? 'Reassign members before deleting' : 'Delete department'}
                    onClick={() => handleDeleteDepartment(department)}
                    disabled={
                      !department.id
                      || deletingDeptId === department.id
                      || department.memberCount > 0
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#EF4444] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {!managedDepartments.length && (
              <div className="px-5 py-8 text-center text-sm text-[#5C5C5C]">
                No departments yet. Create one to organize your team.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Members View */}
      {pageView === 'members' && (
        <section className="enterprise-card overflow-hidden animate-fadeIn">
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between bg-[#f9fafb]">
            <div>
              <h2 className="text-lg font-semibold text-[#292D32]">Team Directory</h2>
              <p className="text-sm text-[#5C5C5C]">Role-based access controls for automation assets.</p>
            </div>
            {currentUserIsAdmin && (
              <button
                type="button"
                onClick={() => setShowInviteForm(true)}
                className="flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a3f44]"
              >
                <UserPlus size={16} />
                Invite Member
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-3 md:flex-row md:items-center md:justify-between bg-white">
            <div className="flex gap-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] bg-[#F6F5FA] px-3 py-2 text-sm font-semibold text-[#292D32] focus:border-[#D0FFA4] focus:outline-none transition-colors hover:bg-[#E2E8F0]"
              >
                <option value="active">Status: Active ({activeMembers.length})</option>
                <option value="pending">Status: Pending ({pendingMembers.length})</option>
              </select>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] bg-[#F6F5FA] px-3 py-2 text-sm font-semibold text-[#292D32] focus:border-[#D0FFA4] focus:outline-none transition-colors hover:bg-[#E2E8F0]"
              >
                <option value="All">All Departments</option>
                {departmentFilterOptions.map((dept) => (
                  <option key={dept.name} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
              <input
                type="text"
                placeholder="Search members"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none md:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredMembers.length > 0 ? (
              <table className="w-full text-left text-sm text-[#5C5C5C]">
                <thead className="bg-[#f9fafb] text-xs uppercase text-[#8D95A1] border-b border-[#E2E8F0]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Member</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Department</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Job Title</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredMembers.map((member) => {
                    const key = memberKey(member);
                    const identityId = memberIdentityId(member);
                    const isSelf = member.type !== MEMBER_TYPE.INVITATION && identityId === user?.id;
                    const isDeleting = deletingMemberKey === key;
                    const isUpdatingDepartment = updatingMemberDeptKey === key;

                    return (
                      <tr key={key} className="bg-white hover:bg-[#F6F5FA] transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E2E8F0]">
                              <UserCircle2 size={18} className="text-[#292D32]" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#292D32]">{member.name || member.email}</span>
                                {isSelf && (
                                  <span className="rounded-full bg-[#E2E8F0] px-2 py-0.5 text-[10px] font-medium text-[#5C5C5C]">You</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${roleBadgeClass(member.role)}`}>
                            {formatRole(member.role)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {currentUserIsAdmin && !isSelf ? (
                            <div className="flex flex-col">
                              <label className="inline-flex items-center gap-1">
                                <Building2 size={14} className="text-[#8D95A1]" />
                                <select
                                  value={member.department || 'Unassigned'}
                                  onChange={(e) => handleAssignMemberDepartment(member, e.target.value)}
                                  disabled={isUpdatingDepartment}
                                  className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-medium text-[#292D32] focus:border-[#D0FFA4] focus:outline-none disabled:opacity-60 hover:bg-[#F6F5FA] transition-colors cursor-pointer"
                                >
                                  <option value="Unassigned">Unassigned</option>
                                  {managedDepartments.map((dept) => (
                                    <option key={dept.id ?? dept.name} value={dept.name}>{dept.name}</option>
                                  ))}
                                </select>
                              </label>
                              {isUpdatingDepartment && (
                                <span className="text-[10px] text-[#5C5C5C] ml-5 mt-0.5">Updating...</span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-medium text-[#5C5C5C]">
                              <Building2 size={12} />
                              {member.department || 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {member.jobTitle ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-medium text-[#5C5C5C]">
                              <BriefcaseBusiness size={12} />
                              {member.jobTitle}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8D95A1] italic">None</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Mail size={14} className="text-[#8D95A1]" />
                            <span className="text-xs">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {currentUserIsAdmin && !isSelf && (
                            <div className="flex justify-end items-center gap-2">
                              {isDeleting && <span className="text-xs text-[#5C5C5C]">...</span>}
                              <button
                                type="button"
                                title={activeTab === 'pending' ? 'Cancel invitation' : 'Remove member'}
                                onClick={() => handleRemoveMember(member)}
                                disabled={isDeleting}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#EF4444] transition-colors hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-[#5C5C5C]">
                No members match your search criteria.
              </div>
            )}
          </div>
        </section>
      )}

      <Modal
        isOpen={deleteDeptModal.open}
        onClose={() => setDeleteDeptModal({ open: false, department: null })}
        title="Delete Department"
      >
        <p className="mb-5 text-sm text-[#5C5C5C]">
          Delete department <strong className="text-[#292D32]">{deleteDeptModal.department?.name}</strong>? This department has no assigned members.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteDeptModal({ open: false, department: null })}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteDepartment}
            disabled={deletingDeptId === deleteDeptModal.department?.id}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-70"
          >
            {deletingDeptId === deleteDeptModal.department?.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={deleteMemberModal.open}
        onClose={() => setDeleteMemberModal({ open: false, member: null })}
        title={deleteMemberModal.member?.type === MEMBER_TYPE.INVITATION ? 'Cancel Invitation' : 'Remove Member'}
      >
        <p className="mb-5 text-sm text-[#5C5C5C]">
          {deleteMemberModal.member?.type === MEMBER_TYPE.INVITATION ? 'Cancel' : 'Remove'}{' '}
          <strong className="text-[#292D32]">{deleteMemberModal.member?.name || deleteMemberModal.member?.email}</strong> from the organization? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteMemberModal({ open: false, member: null })}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmRemoveMember}
            disabled={deletingMemberKey === memberKey(deleteMemberModal.member || {})}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-70"
          >
            {deletingMemberKey === memberKey(deleteMemberModal.member || {}) ? 'Deleting...' : (deleteMemberModal.member?.type === MEMBER_TYPE.INVITATION ? 'Cancel Invitation' : 'Remove')}
          </button>
        </div>
      </Modal>

      <Toast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
};

export default Organisation;