import React from 'react';

import {
  BriefcaseBusiness,
  Building2,
  Mail,
  Search,
  UserCircle2,
  Users,
  Workflow,
} from 'lucide-react';
import organizationService from '../services/organizationService';
import { useAuthStore } from '../stores/authStore';


const formatRole = (role = '') => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'Admin';
  if (upper === 'USER') return 'Member';
  return role || 'Member';
};

const roleBadgeClass = (role) => {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'bg-[#292D32] text-white';
  return 'bg-[#D0FFA4] text-[#292D32]';
};

const MemberWorkspace = () => {

  const { user } = useAuthStore();
  const [orgMeta, setOrgMeta] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState('All');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [org, team, deptList] = await Promise.all([
          organizationService.getCurrent(),
          organizationService.getMembers(),
          organizationService.getDepartments(),
        ]);
        if (isMounted) {
          setOrgMeta(org);
          setMembers(team || []);
          setDepartments(deptList || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Unable to load your workspace.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  const myDepartment = (user?.department || 'Unassigned').trim();
  const teammatesInDept = members.filter(
    (member) => (member.department || 'Unassigned') === myDepartment
  );

  const departmentOptions = React.useMemo(() => {
    const names = new Set(
      members
        .map((member) => (member.department || 'Unassigned').trim())
        .filter(Boolean)
    );
    departments.forEach((dept) => names.add(dept.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [members, departments]);

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query
      || [member.name, member.email, member.department, member.jobTitle, member.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    const matchesDept =
      selectedDept === 'All' || (member.department || 'Unassigned') === selectedDept;
    return matchesSearch && matchesDept;
  });

  if (isLoading) {
    return (
      <div className="space-y-5 font-urbanist">
        <h1 className="text-3xl font-bold text-[#292D32]">My Workspace</h1>
        <p className="text-sm text-[#5C5C5C]">Loading your team context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5 font-urbanist">
        <h1 className="text-3xl font-bold text-[#292D32]">My Workspace</h1>
        <div className="enterprise-card border border-red-200 bg-red-50 p-5 text-sm text-[#EF4444]">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-urbanist">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">My Workspace</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            {orgMeta?.name
              ? `${orgMeta.name} — your team, department, and workflow access.`
              : 'Your organization context for workflow automation.'}
          </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <article className="enterprise-card p-5">
            <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
              <Users size={18} className="text-[#292D32]" />
            </div>
            <p className="text-3xl font-bold text-[#292D32]">{members.length}</p>
            <p className="text-sm text-[#5C5C5C]">Active colleagues</p>
          </article>
          <article className="enterprise-card p-5">
            <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
              <Building2 size={18} className="text-[#292D32]" />
            </div>
            <p className="text-3xl font-bold text-[#292D32]">{teammatesInDept.length}</p>
            <p className="text-sm text-[#5C5C5C]">In {myDepartment}</p>
          </article>
          <article className="enterprise-card p-5">
            <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
              <Workflow size={18} className="text-[#292D32]" />
            </div>
            <p className="text-3xl font-bold text-[#292D32]">{departments.length}</p>
            <p className="text-sm text-[#5C5C5C]">Departments</p>
          </article>
        </div>
      </div>

      
      <section className="enterprise-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#292D32]">Team Directory</h2>
            <p className="text-sm text-[#5C5C5C]">
              Colleagues in your organization. Contact an admin to change roles or invitations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D95A1]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search colleagues"
                className="rounded-xl border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredMembers.map((member) => {
            const isSelf = member.userId === user?.id || member.email === user?.email;
            return (
              <div
                key={member.userId ?? member.email}
                className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
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
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${roleBadgeClass(member.role)}`}>
                    {formatRole(member.role)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#5C5C5C]">
                    <Building2 size={12} />
                    {member.department || 'Unassigned'}
                  </span>
                  {member.jobTitle && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#F6F5FA] px-3 py-1 text-xs font-medium text-[#5C5C5C]">
                      <BriefcaseBusiness size={12} />
                      {member.jobTitle}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[#5C5C5C]">
                    <Mail size={14} />
                    <span className="text-xs">{member.email}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {!filteredMembers.length && (
            <div className="px-5 py-6 text-sm text-[#5C5C5C]">No colleagues match your search.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MemberWorkspace;
