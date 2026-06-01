export interface PaymentPlanItem {
  id: number;
  title: string;
  price: string;
  months: number;
  amount: number;
  features: string[];
}

export interface QPayDeeplink {
  name?: string;
  description?: string;
  logo?: string;
  link?: string;
}

export interface QPayPayment {
  id: string;
  amount: number;
  months: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string | null;
  senderInvoiceNo: string | null;
  invoiceId: string | null;
  invoiceCode: string | null;
  invoiceDescription: string | null;
  qrText: string | null;
  qrImageBase64: string | null;
  shortUrl: string | null;
  deeplinks: QPayDeeplink[];
  paidAt: string | null;
  createdAt: string;
  callbackReceivedAt: string | null;
  qpay: {
    paidAmount: number | string | null;
    count: number;
    rows: Array<Record<string, unknown>>;
  };
}

export interface PaymentResponse {
  success: boolean;
  payment?: QPayPayment;
  message?: string;
  error?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments?: QPayPayment[];
  error?: string;
}

export interface PaymentProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan?: (item: PaymentPlanItem) => void;
}
