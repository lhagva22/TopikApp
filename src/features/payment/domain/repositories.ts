import type { PaymentHistoryResponse, PaymentResponse } from './types';

export interface PaymentRepository {
  createQPayPayment(months: number): Promise<PaymentResponse>;
  checkQPayPayment(paymentId: string): Promise<PaymentResponse>;
  getPaymentHistory(): Promise<PaymentHistoryResponse>;
  getPaymentDetail(paymentId: string): Promise<PaymentResponse>;
  simulateQPayPaymentSuccess(paymentId: string): Promise<PaymentResponse>;
}
