// store/types.tsx

export interface User {
  id: string;
  email: string | null;
  name: string;
  status: 'guest' | 'registered' | 'premium';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_months?: number | null;
  current_level?: number;
}

export interface Exam {
  level?: number;           // 1-6
  levelName?: string;       // "TOPIK I - 1-р түвшин"

  id?: string;              // Шалгалтын ID
  title?: string;           // Шалгалтын нэр
  type?: 'TOPIK I' | 'TOPIK II';  // Шалгалтын төрөл
  date?: string;            // Шалгалт өгсөн огноо

  totalScore?: number;      // Нийт оноо
  maxScore?: number;        // Боломжит оноо (100)
  percentage?: number;      // Хувь (0-100)

  sections?: {
    name: string;           // "Сонсгол", "Уншлага"
    score: number;          // Хэсгийн оноо
    maxScore: number;       // Хэсгийн боломжит оноо
    correctAnswers: number; // Зөв хариултын тоо
    totalQuestions: number; // Нийт асуултын тоо
  }[];

  duration?: number;        // Шалгалтын үргэлжлэх хугацаа (секунд)
  timeSpent?: number;       // Зарцуулсан хугацаа (секунд)

  answers?: Record<number, number>;  // Асуултын ID → Хариултын индекс
  correctAnswers?: number[];         // Зөв хариулсан асуултын ID-үүд

  rank?: number;            // Байр (бусад хэрэглэгчидтэй харьцуулахад)
  percentile?: number;      // Хэдэн хувиас дээгүүр байна
}

