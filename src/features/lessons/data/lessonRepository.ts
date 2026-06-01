import type { LessonRepository } from '../domain/repositories';
import { lessonApi } from './api/lessonApi';

export const lessonRepository: LessonRepository = lessonApi;
