import React from 'react';
import {
  Building2,
  BriefcaseBusiness,
  Mail,
  Search,
  Shield,
  UserCircle2,
  Users,
} from 'lucide-react';
import organizationService from '../services/organizationService';

const titleCase = (value = '') =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const formatRole = (role = '') => {
  if (!role) return 'Member';
  if (role.toUpperCase() === 'ADMIN') return 'Admin';
  if (role.toUpperCase() === 'USER') return 'Member';
  return titleCase(role.replace(/_/g, ' '));
};

const Organisation = () => {
  const [organization, setOrganization] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;

    const loadOrganization = async () => {
      setIsLoading(true);
      setError('');

      try {
        const payload = await organizationService.getCurrent();
        if (isMounted) {
          setOrganization(payload);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || 'Unable to load your organization workspace.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrganization();

    return () => {
      isMounted = false;
    };
  }, []);

  const members = React.useMemo(() => organization?.members || [], [organization]);
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [member.name, member.email, member.department, member.jobTitle, member.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const departments = React.useMemo(() => {
    const grouped = members.reduce((accumulator, member) => {
      const key = member.department || 'Unassigned';
      if (!accumulator[key]) {
        accumulator[key] = { name: key, members: 0, admins: 0 };
      }

      accumulator[key].members += 1;
      if ((member.role || '').toUpperCase() === 'ADMIN') {
        accumulator[key].admins += 1;
      }

      return accumulator;
    }, {});

    return Object.values(grouped).sort((left, right) => right.members - left.members);
  }, [members]);

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
            {organization?.name
              ? `${organization.name} workspace, members, and enterprise access governance.`
              : 'Manage enterprise teams, permissions, and department-level workflow governance.'}
          </p>
        </div>
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
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[11px] font-semibold',
                    member.status === 'Active' ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#E2E8F0] text-[#292D32]',
                  ].join(' ')}
                >
                  {member.status}
                </span>
              </div>
            </div>
          ))}
          {!filteredMembers.length && (
            <div className="px-5 py-6 text-sm text-[#5C5C5C]">
              No members match your search yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Organisation;
