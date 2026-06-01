import type { DictionaryRepository } from '../domain/repositories';
import { dictionaryApi } from './api/dictionaryApi';

export const dictionaryRepository: DictionaryRepository = dictionaryApi;
