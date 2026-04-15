// store/types.tsx

export interface User {
  id: string;
  email: string | null;
  name: string;
  level?: number; // Ирээдүйд хэрэглэгчийн түвшин мэдээллийг хадгалах боломжтой болгох
  levelName?: string; // Ирээдүйд хэрэглэгчийн түвшин нэрийг хадгалах боломжтой болгох
  status: 'guest' | 'registered' | 'premium';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_months?: number | null;
}