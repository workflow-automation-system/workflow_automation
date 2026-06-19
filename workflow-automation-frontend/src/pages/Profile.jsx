import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { getRole } from '../utils/rbac';
import {
  UserCircle2,
  Mail,
  Building2,
  BriefcaseBusiness,
  Shield,
  Layers,
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

const ROLE_CAPABILITIES = {
  ADMIN: [
    'Full platform access',
    'Manage organization members and roles',
    'Create, edit, delete workflows',
    'Execute all workflows',
    'Manage integrations and settings',
    'View audit logs',
  ],
  USER: [
    'Create and edit own workflows',
    'Execute permitted workflows',
    'View templates',
  ],
  VIEWER: [
    'View workflows (read-only)',
    'View execution history',
    'Execute where granted',
  ],
};

const Profile = () => {
  const { user } = useAuthStore();
  const role = getRole(user);
  const capabilities = ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES.USER;

  const infoItems = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Building2, label: 'Organization', value: user?.organization?.name || `Org #${user?.organizationId}` },
    { icon: BriefcaseBusiness, label: 'Department', value: user?.department || 'Unassigned' },
    { icon: Layers, label: 'Job Title', value: user?.jobTitle || 'Team Member' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 font-urbanist">
      <div>
        <h1 className="text-3xl font-bold text-[#292D32]">My Profile</h1>
        <p className="mt-1 text-sm text-[#5C5C5C]">
          Your account information and role within the organization.
        </p>
      </div>

      <div className="enterprise-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E2E8F0]">
            <UserCircle2 size={32} className="text-[#292D32]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#292D32]">{user?.name || 'User'}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}
              >
                {roleLabels[role] || 'Member'}
              </span>
              <span className="text-xs text-[#5C5C5C]">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="enterprise-card divide-y divide-[#E2E8F0]">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-center gap-4 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E2E8F0]">
              <item.icon size={18} className="text-[#292D32]" />
            </div>
            <div>
              <p className="text-xs text-[#5C5C5C]">{item.label}</p>
              <p className="text-sm font-semibold text-[#292D32]">{item.value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="enterprise-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-6 py-4">
          <Shield size={16} className="text-[#292D32]" />
          <h3 className="text-sm font-semibold text-[#292D32]">Your Permissions</h3>
        </div>
        <ul className="space-y-2 p-6">
          {capabilities.map((cap) => (
            <li key={cap} className="flex items-center gap-2 text-sm text-[#5C5C5C]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D0FFA4]" />
              {cap}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
