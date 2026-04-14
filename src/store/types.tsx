// store/types.tsx

export interface User {
  id: string;
  email: string | null;
  name: string;
  status: 'guest' | 'registered' | 'premium';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_months?: number | null;
}