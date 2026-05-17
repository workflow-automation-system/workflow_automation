import React from 'react';
import {
  Building2,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  UserCircle2,
  Users,
} from 'lucide-react';

const departments = [
  { name: 'Engineering', members: 34, risk: 'Low' },
  { name: 'Operations', members: 21, risk: 'Low' },
  { name: 'Finance', members: 18, risk: 'Medium' },
  { name: 'Customer Success', members: 27, risk: 'Low' },
];

const teamMembers = [
  { name: 'Sarah Chen', role: 'Admin', department: 'Engineering', email: 'sarah.chen@company.com', status: 'Active' },
  { name: 'Marcus Johnson', role: 'Editor', department: 'Operations', email: 'marcus.johnson@company.com', status: 'Active' },
  { name: 'Emily Davis', role: 'Viewer', department: 'Finance', email: 'emily.davis@company.com', status: 'Pending' },
  { name: 'James Wilson', role: 'Admin', department: 'Engineering', email: 'james.wilson@company.com', status: 'Active' },
];

const Organisation = () => {
  return (
    <div className="space-y-5 font-urbanist">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Organisation</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            Manage enterprise teams, permissions, and department-level workflow governance.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
        >
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
              <Users size={18} className="text-[#292D32]" />
            </div>
            <span className="rounded-full bg-[#D0FFA4] px-2 py-1 text-xs font-semibold text-[#292D32]">+4 this month</span>
          </div>
          <p className="text-3xl font-bold text-[#292D32]">100</p>
          <p className="text-sm text-[#5C5C5C]">Active Members</p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5 w-fit">
            <Building2 size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">12</p>
          <p className="text-sm text-[#5C5C5C]">Departments</p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] p-2.5 w-fit">
            <Shield size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">27</p>
          <p className="text-sm text-[#5C5C5C]">Privileged Roles</p>
        </div>
      </div>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292D32]">Department Risk Snapshot</h2>
          <p className="text-sm text-[#5C5C5C]">Ownership and risk profile for workflow-enabled business units.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          {departments.map((department) => (
            <article key={department.name} className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#292D32]">{department.name}</p>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[11px] font-semibold',
                    department.risk === 'Low' ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#D0FFA4] text-[#292D32]',
                  ].join(' ')}
                >
                  {department.risk} Risk
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5C5C5C]">{department.members} members with workflow access</p>
            </article>
          ))}
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
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none md:w-64"
            />
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {teamMembers.map((member) => (
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
                  {member.role}
                </span>
                <div className="flex items-center gap-1 text-[#5C5C5C]">
                  <Mail size={14} />
                  <span className="text-xs">{member.email}</span>
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[11px] font-semibold',
                    member.status === 'Active' ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#D0FFA4] text-[#292D32]',
                  ].join(' ')}
                >
                  {member.status}
                </span>
                <button type="button" className="rounded-lg p-1.5 text-[#5C5C5C] hover:bg-white">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Organisation;
