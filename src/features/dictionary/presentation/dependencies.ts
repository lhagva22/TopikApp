import { dictionaryRepository } from '../data/dictionaryRepository';
import { subscribeDictionarySyncProgress } from '../data/api/dictionaryApi';
import type { DictionarySyncProgress } from '../data/api/dictionaryApi';
import { createDictionaryUseCases } from '../domain/useCases';

export const dictionaryUseCases = createDictionaryUseCases(dictionaryRepository);
export { subscribeDictionarySyncProgress };
export type { DictionarySyncProgress };
