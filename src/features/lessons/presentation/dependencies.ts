import { lessonRepository } from '../data/lessonRepository';
import { createLessonUseCases } from '../domain/useCases';

export const lessonUseCases = createLessonUseCases(lessonRepository);
