import type { PaymentRepository } from '../domain/repositories';
import { paymentApi } from './api/paymentApi';

export const paymentRepository: PaymentRepository = paymentApi;
