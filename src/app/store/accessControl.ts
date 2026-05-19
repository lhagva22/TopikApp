import type { User } from '../../features/auth/types';
import type { AccessBlockReason, AccessLevel, UserStatus } from './types';

const ACCESS_RANK: Record<UserStatus, number> = {
  guest: 0,
  registered: 1,
  premium: 2,
};

const REQUIRED_STATUS: Record<AccessLevel, UserStatus> = {
  guest: 'guest',
  registered: 'registered',
  paid: 'premium',
};

export const getUserStatus = (user: User | null): UserStatus => user?.status || 'guest';

export const hasAccess = (user: User | null, requiredStatus: AccessLevel): boolean => {
  if (requiredStatus === 'guest') {
    return true;
  }

  const currentStatus = getUserStatus(user);
  const requiredUserStatus = REQUIRED_STATUS[requiredStatus];

  return ACCESS_RANK[currentStatus] >= ACCESS_RANK[requiredUserStatus];
};

export const getAccessBlockReason = (
  user: User | null,
  requiredStatus: AccessLevel,
): AccessBlockReason | null => {
  if (hasAccess(user, requiredStatus)) {
    return null;
  }

  return getUserStatus(user) === 'guest' ? 'guest' : 'registered';
};

export const isGuestStatus = (user: User | null): boolean => getUserStatus(user) === 'guest';
export const isRegisteredStatus = (user: User | null): boolean => getUserStatus(user) === 'registered';
export const isPaidStatus = (user: User | null): boolean => getUserStatus(user) === 'premium';
