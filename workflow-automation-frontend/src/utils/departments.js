import { isActiveMember } from '../constants/memberStatus';

const UNASSIGNED = 'Unassigned';

export const normalizeDepartmentList = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (typeof item === 'string') {
        return {
          id: null,
          name: item.trim(),
          memberCount: 0,
          adminCount: 0,
        };
      }

      return {
        id: item?.id ?? null,
        name: (item?.name ?? '').trim(),
        memberCount: Number(item?.memberCount ?? item?.members ?? 0),
        adminCount: Number(item?.adminCount ?? item?.admins ?? 0),
      };
    })
    .filter((department) => department.name && department.name !== UNASSIGNED);
};

export const buildDepartmentsFromMembers = (members = []) => {
  const grouped = members
    .filter(isActiveMember)
    .reduce((acc, member) => {
      const name = (member.department || UNASSIGNED).trim();
      if (!name || name === UNASSIGNED) {
        return acc;
      }

      if (!acc[name]) {
        acc[name] = {
          id: null,
          name,
          memberCount: 0,
          adminCount: 0,
        };
      }

      acc[name].memberCount += 1;
      if ((member.role || '').toUpperCase() === 'ADMIN') {
        acc[name].adminCount += 1;
      }

      return acc;
    }, {});

  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
};

export const mergeDepartmentsWithMembers = (apiDepartments = [], members = []) => {
  const memberDepartments = buildDepartmentsFromMembers(members);
  const byName = new Map();

  normalizeDepartmentList(apiDepartments).forEach((department) => {
    byName.set(department.name.toLowerCase(), { ...department });
  });

  memberDepartments.forEach((department) => {
    const key = department.name.toLowerCase();
    const existing = byName.get(key);

    if (existing) {
      byName.set(key, {
        ...existing,
        memberCount: Math.max(existing.memberCount ?? 0, department.memberCount ?? 0),
        adminCount: Math.max(existing.adminCount ?? 0, department.adminCount ?? 0),
      });
      return;
    }

    byName.set(key, { ...department });
  });

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const countDepartmentsInUse = (departments = []) =>
  departments.filter((department) => department.memberCount > 0).length;
