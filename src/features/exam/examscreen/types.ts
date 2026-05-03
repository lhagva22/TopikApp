export interface Question {
  id: string;
  section: string;
  question_number: number;
  question_text: string;
  options: string[];
  audio_url?: string;
}

export interface ExamProgressBarProps {
  progress: number;
}
