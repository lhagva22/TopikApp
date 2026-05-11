import { ENDPOINTS, get, post } from '../../../core/api/apiClient';
import type { PaymentHistoryResponse, PaymentResponse } from '../types';

export const paymentApi = {
  createQPayPayment: (months: number) =>
    post<PaymentResponse>(ENDPOINTS.PAYMENT.QPAY_CREATE, { months }),

  checkQPayPayment: (paymentId: string) =>
    post<PaymentResponse>(ENDPOINTS.PAYMENT.CHECK(paymentId)),

  simulateQPayPaymentSuccess: (paymentId: string) =>
    post<PaymentResponse>(ENDPOINTS.PAYMENT.DEV_COMPLETE(paymentId)),

  getPaymentDetail: (paymentId: string) =>
    get<PaymentResponse>(ENDPOINTS.PAYMENT.DETAIL(paymentId)),

  getPaymentHistory: () =>
    get<PaymentHistoryResponse>(ENDPOINTS.PAYMENT.HISTORY),
};
