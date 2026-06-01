export type TopikExamType = 'TOPIK_I' | 'TOPIK_II';

export interface TopikQuestion {
  id: string;
  section: string;
  question_number: number;
  question_text: string;
  question_image_url?: string;
  options: string[];
  option_image_urls?: Array<string | null> | null;
  audio_url?: string;
}
