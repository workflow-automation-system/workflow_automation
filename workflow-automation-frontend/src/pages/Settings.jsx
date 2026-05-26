import React from 'react';
import { Bell, Building2, Check, Copy, Eye, KeyRound, Monitor, Moon, Shield, Sun, UserCircle2, Workflow } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { getRole, isAdmin, isViewer } from '../utils/rbac';

const ROLE_DESCRIPTIONS = {
  ADMIN: {
    label: 'Administrator',
    color: 'bg-[#292D32] text-white',
    description: 'Full access to the platform. You can manage organization members, assign roles, create/edit/delete workflows, manage integrations, and view audit logs.',
    capabilities: [
      'Manage organization members and roles',
      'Create, edit, and delete workflows',
      'Execute any workflow',
      'Manage integrations and app connections',
      'Access admin console and audit logs',
      'Configure platform settings',
    ],
  },
  USER: {
    label: 'Member',
    color: 'bg-[#D0FFA4] text-[#292D32]',
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
    label: 'Viewer',
    color: 'bg-[#E2E8F0] text-[#5C5C5C]',
    description: 'Read-only access. You can view workflows and execution history, but cannot create, edit, or delete anything.',
    capabilities: [
      'View all workflows (read-only)',
      'View execution history',
      'Execute workflows where access is granted',
      'View templates',
    ],
  },
};

const Settings = () => {
  const { user } = useAuthStore();
  const { setTheme, theme } = useThemeStore();
  const [copied, setCopied] = React.useState(null);
  const [notifications, setNotifications] = React.useState({
    failures: true,
    summary: true,
    push: false,
  });
  const role = getRole(user);
  const roleInfo = ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.USER;

  const copy = (value, key) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 font-urbanist">
      <div>
        <h1 className="text-3xl font-bold text-[#292D32]">Settings</h1>
        <p className="mt-1 text-sm text-[#5C5C5C]">Manage profile, billing, API keys, and platform security preferences.</p>
      </div>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">Profile</h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[auto_1fr]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E2E8F0] bg-[#E2E8F0] text-2xl font-bold text-[#292D32]">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Display Name" value={user?.name || 'User'} />
            <Field label="Email Address" value={user?.email || 'user@company.com'} />
          </div>
        </div>
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#292D32]" />
            <h2 className="text-lg font-semibold text-[#292D32]">Role & Permissions</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
            <p className="text-sm text-[#5C5C5C]">{roleInfo.description}</p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
              Your permissions
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleInfo.capabilities.map((cap) => (
                <div key={cap} className="flex items-center gap-2 text-sm text-[#292D32]">
                  <Check size={14} className="shrink-0 text-[#292D32]" />
                  {cap}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#8D95A1]">
            As an administrator, you can manage member roles from the Admin Console.
          </p>
        </div>
      </section>

      <section className="enterprise-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#D0FFA4]">
              <Building2 size={18} className="text-[#292D32]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#292D32]">Enterprise Plan</h2>
              <p className="text-sm text-[#5C5C5C]">Unlimited workflows, priority support, and advanced governance controls.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#292D32]">$299/mo</p>
            <button type="button" className="mt-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#292D32] hover:border-[#D0FFA4]">
              Manage Billing
            </button>
          </div>
        </div>
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">Appearance</h2>
          <p className="text-sm text-[#5C5C5C]">Choose how the workspace should appear.</p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <ThemeCard icon={Sun} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
          <ThemeCard icon={Moon} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
          <ThemeCard icon={Monitor} label="System" active={theme === 'system'} onClick={() => setTheme('system')} />
        </div>
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">API & Webhooks</h2>
        </div>
        <div className="space-y-4 p-5">
          <SecretField
            icon={KeyRound}
            label="API Key"
            value="sk_live_****************************"
            onCopy={() => copy('sk_live_example', 'api_key')}
            copied={copied === 'api_key'}
          />
          <SecretField
            icon={KeyRound}
            label="Webhook URL"
            value="https://api.flowforge.io/webhooks/wh_****************************"
            onCopy={() => copy('https://api.flowforge.io/webhooks/example', 'webhook')}
            copied={copied === 'webhook'}
          />
        </div>
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">Notifications</h2>
        </div>
        <div className="divide-y divide-[#E2E8F0] p-5">
          <ToggleRow
            icon={Bell}
            label="Workflow failure alerts"
            checked={notifications.failures}
            onToggle={(value) => setNotifications((prev) => ({ ...prev, failures: value }))}
          />
          <ToggleRow
            icon={Bell}
            label="Daily summary digest"
            checked={notifications.summary}
            onToggle={(value) => setNotifications((prev) => ({ ...prev, summary: value }))}
          />
          <ToggleRow
            icon={Bell}
            label="Push notifications"
            checked={notifications.push}
            onToggle={(value) => setNotifications((prev) => ({ ...prev, push: value }))}
          />
        </div>
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">Security</h2>
        </div>
        <div className="space-y-3 p-5">
          <SecurityAction title="Password" detail="Last changed 30 days ago" actionLabel="Change Password" />
          <SecurityAction title="Two-Factor Authentication" detail="Recommended for all admins" actionLabel="Enable 2FA" primary />
          <button type="button" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-[#EF4444] hover:bg-red-100">
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, value }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">{label}</span>
    <input
      value={value}
      disabled
      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#292D32]"
    />
  </label>
);

const ThemeCard = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'rounded-2xl border p-4 text-left transition-colors',
      active ? 'border-[#D0FFA4] bg-[#D0FFA4]/30' : 'border-[#E2E8F0] bg-white hover:border-[#D0FFA4]',
    ].join(' ')}
  >
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-[#292D32]" />
      <span className="text-sm font-semibold text-[#292D32]">{label}</span>
    </div>
  </button>
);

const SecretField = ({ icon: Icon, label, value, onCopy, copied }) => (
  <div>
    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">{label}</span>
    <div className="flex gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5">
        <Icon size={15} className="text-[#5C5C5C]" />
        <input value={value} disabled className="w-full bg-transparent text-sm text-[#292D32] outline-none" />
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-xl border border-[#E2E8F0] bg-white px-3 text-[#5C5C5C] hover:border-[#D0FFA4]"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={15} className="text-[#D0FFA4]" /> : <Copy size={15} />}
      </button>
    </div>
  </div>
);

const ToggleRow = ({ icon: Icon, label, checked, onToggle }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-[#5C5C5C]" />
      <span className="text-sm font-medium text-[#292D32]">{label}</span>
    </div>
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={`relative h-6 w-11 rounded-full ${checked ? 'bg-[#D0FFA4]' : 'bg-[#E2E8F0]'}`}
    >
      <span
        className={[
          'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  </div>
);

const SecurityAction = ({ title, detail, actionLabel, primary = false }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-2">
      <Shield size={15} className="mt-0.5 text-[#5C5C5C]" />
      <div>
        <p className="text-sm font-semibold text-[#292D32]">{title}</p>
        <p className="text-xs text-[#5C5C5C]">{detail}</p>
      </div>
    </div>
    <button
      type="button"
      className={[
        'rounded-xl px-3 py-2 text-sm font-semibold',
        primary
          ? 'bg-[#D0FFA4] text-[#292D32] hover:bg-[#BDEB94]'
          : 'border border-[#E2E8F0] bg-white text-[#292D32] hover:border-[#D0FFA4]',
      ].join(' ')}
    >
      {actionLabel}
    </button>
  </div>
);

export default Settings;
