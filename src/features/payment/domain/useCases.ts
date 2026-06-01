import type { AuthRepository } from '../../auth/domain/repositories';
import type { PaymentRepository } from './repositories';

export const createPaymentUseCases = (
  paymentRepository: PaymentRepository,
  authRepository: AuthRepository,
) => ({
  getProfile: () => authRepository.getProfile(),
  createQPayPayment: (months: number) => paymentRepository.createQPayPayment(months),
  checkQPayPayment: (paymentId: string) => paymentRepository.checkQPayPayment(paymentId),
  getPaymentHistory: () => paymentRepository.getPaymentHistory(),
  getPaymentDetail: (paymentId: string) => paymentRepository.getPaymentDetail(paymentId),
  simulateQPayPaymentSuccess: (paymentId: string) =>
    paymentRepository.simulateQPayPaymentSuccess(paymentId),
});
