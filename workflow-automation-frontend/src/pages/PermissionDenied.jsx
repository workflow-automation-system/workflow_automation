import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getRole } from '../utils/rbac';

const roleLabelMap = { ADMIN: 'Administrator', USER: 'Member' };
const roleBadgeStyles = {
  ADMIN: 'bg-[#292D32] text-white',
  USER: 'bg-[#D0FFA4] text-[#292D32]',
};

const PermissionDenied = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const { user } = useAuthStore();
  const role = getRole(user);

  return (
    <div className="enterprise-card flex min-h-[24rem] flex-col items-center justify-center px-6 py-10 text-center font-urbanist">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-red-50">
        <ShieldAlert className="text-[#EF4444]" size={28} />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-[#292D32]">Permission Denied</h1>
      <p className="mt-2 max-w-xl text-sm text-[#5C5C5C]">
        You do not have access to this area. Enterprise permissions are enforced on both the UI and API.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-[#8D95A1]">Your current role:</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}>
          {roleLabelMap[role] || role}
        </span>
      </div>
      {from ? (
        <p className="mt-2 text-xs text-[#8A8A8A]">Attempted route: {from}</p>
      ) : null}
      <p className="mt-2 text-xs text-[#8D95A1]">
        Contact your organization administrator to request a role change.
      </p>
      <div className="mt-5 flex gap-3">
        <Link
          to="/"
          className="rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C4249]"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/workflows"
          className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#292D32] hover:border-[#D0FFA4]"
        >
          Open Workflows
        </Link>
      </div>
    </div>
  );
};

export default PermissionDenied;
