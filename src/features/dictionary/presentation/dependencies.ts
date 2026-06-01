import { dictionaryRepository } from '../data/dictionaryRepository';
import { createDictionaryUseCases } from '../domain/useCases';

export const dictionaryUseCases = createDictionaryUseCases(dictionaryRepository);
