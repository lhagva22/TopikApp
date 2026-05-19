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

const hasActiveSubscription = (user: User | null): boolean => {
  if (!user?.subscription_end_date) {
    return false;
  }

  const endTime = new Date(user.subscription_end_date).getTime();

  return !Number.isNaN(endTime) && endTime > Date.now();
};

export const hasAccess = (user: User | null, requiredStatus: AccessLevel): boolean => {
  if (requiredStatus === 'guest') {
    return true;
  }

  const currentStatus = getUserStatus(user);
  const requiredUserStatus = REQUIRED_STATUS[requiredStatus];

  if (requiredStatus === 'paid') {
    return currentStatus === 'premium' && hasActiveSubscription(user);
  }

  return (ACCESS_RANK[currentStatus] ?? 0) >= ACCESS_RANK[requiredUserStatus];
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
export const isPaidStatus = (user: User | null): boolean => hasAccess(user, 'paid');
