import type { HomeRepository } from '../domain/repositories';
import { homeApi } from './api/homeApi';

export const homeRepository: HomeRepository = homeApi;
