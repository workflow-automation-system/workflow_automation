export const MEMBER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
};

export const MEMBER_TYPE = {
  MEMBER: 'MEMBER',
  INVITATION: 'INVITATION',
};

export const isActiveMember = (member) => member?.status === MEMBER_STATUS.ACCEPTED;

export const isPendingInvitation = (member) => member?.status === MEMBER_STATUS.PENDING;

export const memberKey = (member) => {
  if (member?.type === MEMBER_TYPE.INVITATION) {
    return `inv-${member.id}`;
  }
  return `user-${member.userId ?? member.id}`;
};

export const memberIdentityId = (member) => {
  if (member?.type === MEMBER_TYPE.INVITATION) {
    return member.id;
  }
  return member.userId ?? member.id;
};
