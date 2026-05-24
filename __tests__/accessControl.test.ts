import { describe, expect, it } from '@jest/globals';

import { getAccessBlockReason, hasAccess } from '../src/app/store/accessControl';
import type { User } from '../src/features/auth/types';

const createUser = (overrides: Partial<User>): User => ({
  id: 'user-1',
  email: 'student@example.com',
  name: 'Student',
  status: 'registered',
  current_level: 0,
  ...overrides,
});

describe('access control', () => {
  it('allows registered content but blocks paid exams for registered users', () => {
    const user = createUser({ status: 'registered' });

    expect(hasAccess(user, 'registered')).toBe(true);
    expect(hasAccess(user, 'paid')).toBe(false);
    expect(getAccessBlockReason(user, 'paid')).toBe('registered');
  });

  it('allows paid access only while a premium subscription is active', () => {
    const activePremium = createUser({
      status: 'premium',
      subscription_end_date: new Date(Date.now() + 86400000).toISOString(),
    });
    const expiredPremium = createUser({
      status: 'premium',
      subscription_end_date: new Date(Date.now() - 86400000).toISOString(),
    });

    expect(hasAccess(activePremium, 'paid')).toBe(true);
    expect(hasAccess(expiredPremium, 'paid')).toBe(false);
  });
});
