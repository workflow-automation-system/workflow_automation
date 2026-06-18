import React from 'react';
import { useAuthStore } from '../stores/authStore';
import authService from '../services/authService';
import { getRole } from '../utils/rbac';
import Toast from '../components/ui/Toast';
import {
  Mail,
  Building2,
  Shield,
  Lock,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

const roleBadgeStyles = {
  ADMIN: 'bg-[#292D32] text-white',
  USER: 'bg-[#D0FFA4] text-[#292D32]',
  VIEWER: 'bg-[#E2E8F0] text-[#5C5C5C]',
};

const roleLabels = {
  ADMIN: 'Admin',
  USER: 'Member',
  VIEWER: 'Viewer',
};

const ROLE_DESCRIPTIONS = {
  ADMIN: {
    description: 'Full access to the platform. You can manage organization members, assign roles, create/edit/delete workflows, manage integrations, and view audit logs.',
    capabilities: [
      'Manage organization members and roles',
      'Create, edit, and delete workflows',
      'Execute all workflows',
      'Manage integrations and app connections',
      'Configure platform settings',
      'View audit logs',
    ],
  },
  USER: {
    description: 'Standard access. You can create and manage your own workflows, execute permitted workflows, and view organization info.',
    capabilities: [
      'Create new workflows',
      'Edit own workflows',
      'Execute permitted workflows',
      'View organization members',
      'View templates',
    ],
  },
  VIEWER: {
    description: 'Read-only access. You can view workflows and execution history, but cannot create, edit, or delete anything.',
    capabilities: [
      'View all workflows (read-only)',
      'View execution history',
      'Execute workflows where access is granted',
      'View templates',
    ],
  },
};

const Profile = () => {
  const { user, updateProfile, deleteSelf } = useAuthStore();
  const role = getRole(user);
  const roleInfo = ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.USER;

  // Profile Form State
  const [profileForm, setProfileForm] = React.useState({
    name: user?.name || '',
    department: user?.department || '',
    jobTitle: user?.jobTitle || '',
  });
  const [profileLoading, setProfileLoading] = React.useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState({ current: false, new: false, confirm: false });

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Toast State
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });

  // Sync state with user if it loads later
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        department: user.department || '',
        jobTitle: user.jobTitle || '',
      });
    }
  }, [user]);

  const showToast = React.useCallback((message, tone = 'info') => {
    setToast({ open: true, message, tone });
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    setProfileLoading(true);
    try {
      const res = await updateProfile({
        name: profileForm.name.trim(),
        department: profileForm.department.trim(),
        jobTitle: profileForm.jobTitle.trim(),
      });
      if (res.success) {
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm.', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await deleteSelf();
      if (res.success) {
        window.location.href = '/login';
      } else {
        showToast(res.error || 'Failed to delete account.', 'error');
      }
    } catch (err) {
      showToast('An error occurred during account deletion.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-urbanist pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[#292D32]">My Profile</h1>
        <p className="mt-1 text-sm text-[#5C5C5C]">
          Manage your personal information, security credentials, and organization permissions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="enterprise-card p-6 text-center space-y-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-[#E2E8F0] bg-[#E2E8F0] text-3xl font-bold text-[#292D32]">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#292D32]">{user?.name || 'User'}</h2>
              <p className="text-xs text-[#5C5C5C] mt-0.5">{user?.email}</p>
            </div>
            <div className="flex justify-center">
              <span
                className={`rounded-full px-3.5 py-1 text-xs font-bold ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}
              >
                {roleLabels[role] || 'Member'}
              </span>
            </div>
          </div>

          {/* Quick Stats/Metadata Card */}
          <div className="enterprise-card divide-y divide-[#E2E8F0]">
            <div className="flex items-center gap-3 p-4">
              <Mail size={16} className="text-[#8D95A1]" />
              <div className="overflow-hidden">
                <p className="text-[10px] uppercase font-bold text-[#8D95A1] tracking-wider">Email</p>
                <p className="text-xs font-medium text-[#292D32] truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Building2 size={16} className="text-[#8D95A1]" />
              <div>
                <p className="text-[10px] uppercase font-bold text-[#8D95A1] tracking-wider">Organization</p>
                <p className="text-xs font-medium text-[#292D32]">
                  {user?.organization?.name || `Org #${user?.organizationId || '—'}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Account Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <section className="enterprise-card overflow-hidden">
            <div className="border-b border-[#E2E8F0] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#292D32]">Personal Information</h3>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    placeholder="e.g. Frontend Developer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="rounded-xl bg-[#292D32] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3C4249] disabled:opacity-60"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Role & Permissions Info */}
          <section className="enterprise-card overflow-hidden">
            <div className="border-b border-[#E2E8F0] px-6 py-4 flex items-center gap-2">
              <Shield size={18} className="text-[#292D32]" />
              <h3 className="text-lg font-semibold text-[#292D32]">Role & Permissions</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#5C5C5C]">{roleInfo.description}</p>
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F6F5FA] p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">Your Platform Capabilities</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roleInfo.capabilities.map((cap) => (
                    <div key={cap} className="flex items-center gap-2 text-sm text-[#292D32]">
                      <Check size={14} className="shrink-0 text-[#292D32]" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Change Password Form */}
          <section className="enterprise-card overflow-hidden">
            <div className="border-b border-[#E2E8F0] px-6 py-4 flex items-center gap-2">
              <Lock size={18} className="text-[#292D32]" />
              <h3 className="text-lg font-semibold text-[#292D32]">Security & Password</h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-4 pr-10 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => ({ ...p, current: !p.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D95A1] hover:text-[#292D32]"
                    >
                      {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-4 pr-10 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D95A1] hover:text-[#292D32]"
                    >
                      {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-4 pr-10 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D95A1] hover:text-[#292D32]"
                    >
                      {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded-xl bg-[#292D32] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3C4249] disabled:opacity-60"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          {/* Delete Account */}
          <section className="enterprise-card border border-red-100 overflow-hidden bg-red-50/10">
            <div className="border-b border-red-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#EF4444]">Danger Zone</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#5C5C5C]">
                Permanently delete your user account and all workspace configurations associated with it. This action is irreversible.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-xl bg-[#EF4444] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#DC2626]"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Delete Account Permanently</h3>
            </div>

            <p className="text-sm text-[#5C5C5C]">
              Are you absolutely sure? This will delete your user access across all services and cannot be undone.
            </p>

            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs text-red-700">
                To confirm deletion, please type <strong className="font-mono">DELETE</strong> in the box below:
              </p>
            </div>

            <input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm text-[#292D32] focus:border-[#EF4444] focus:outline-none"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 rounded-xl border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#5C5C5C] transition-colors hover:bg-[#F6F5FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="flex-1 rounded-xl bg-[#EF4444] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#DC2626] disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast open={toast.open} message={toast.message} tone={toast.tone} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
};

export default Profile;
