import { authRepository } from '../../auth/data/authRepository';
import { paymentRepository } from '../data/paymentRepository';
import { createPaymentUseCases } from '../domain/useCases';

export const paymentUseCases = createPaymentUseCases(paymentRepository, authRepository);
