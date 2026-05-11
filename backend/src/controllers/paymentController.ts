import { Response } from 'express';
import { randomUUID } from 'node:crypto';

import { supabaseAdmin } from '../config/supabase';
import { qpayService, type QPayDeeplink, type QPayInvoiceResponse, type QPayPaymentCheckResponse } from '../services/qpayService';
import type { AuthRequest } from '../types';

type PaymentPlan = {
  months: number;
  title: string;
  amount: number;
};

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number | string;
  months: number;
  payment_method: 'card' | 'mobile' | 'bank' | null;
  status: 'pending' | 'completed' | 'failed';
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  qpay_invoice_id?: string | null;
  sender_invoice_no?: string | null;
  invoice_code?: string | null;
  invoice_description?: string | null;
  callback_received_at?: string | null;
  raw_response?: Record<string, any> | null;
};

const PAYMENT_PLANS: Record<number, PaymentPlan> = {
  1: { months: 1, title: '1 сар', amount: 29900 },
  3: { months: 3, title: '3 сар', amount: 79900 },
  6: { months: 6, title: '6 сар', amount: 149900 },
};

const getPlanByMonths = (months: number) => PAYMENT_PLANS[months] ?? null;

const getInvoiceCode = () => {
  const invoiceCode = process.env.QPAY_INVOICE_CODE?.trim();

  if (!invoiceCode) {
    throw new Error('QPAY_INVOICE_CODE тохируулаагүй байна. backend/.env-ээ шалгана уу.');
  }

  return invoiceCode;
};

const getCallbackBaseUrl = () => {
  const callbackUrl = process.env.QPAY_CALLBACK_URL?.trim();

  if (!callbackUrl) {
    throw new Error('QPAY_CALLBACK_URL тохируулаагүй байна. backend/.env-ээ шалгана уу.');
  }

  return callbackUrl;
};

const buildCallbackUrl = (paymentId: string) => {
  const callbackBaseUrl = getCallbackBaseUrl();
  const separator = callbackBaseUrl.includes('?') ? '&' : '?';
  return `${callbackBaseUrl}${separator}payment_id=${encodeURIComponent(paymentId)}`;
};

const createSenderInvoiceNo = () => `TOPIK${randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()}`;

const normalizeDeeplinks = (value: unknown): QPayDeeplink[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is QPayDeeplink => Boolean(item && typeof item === 'object' && 'link' in item));
};

const parseRawResponse = (rawResponse: PaymentRow['raw_response']) => {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return {} as Record<string, any>;
  }

  return rawResponse;
};

const buildPaymentPayload = (payment: PaymentRow) => {
  const rawResponse = parseRawResponse(payment.raw_response);
  const invoice = rawResponse.invoice ?? {};
  const paymentCheck = rawResponse.check ?? {};
  const deeplinks = normalizeDeeplinks(invoice.urls ?? invoice.qPay_deeplink);

  return {
    id: payment.id,
    amount: Number(payment.amount),
    months: payment.months,
    status: payment.status,
    transactionId: payment.transaction_id,
    senderInvoiceNo: payment.sender_invoice_no ?? null,
    invoiceId: payment.qpay_invoice_id ?? null,
    invoiceCode: payment.invoice_code ?? null,
    invoiceDescription: payment.invoice_description ?? null,
    qrText: typeof invoice.qr_text === 'string' ? invoice.qr_text : null,
    qrImageBase64: typeof invoice.qr_image === 'string' ? invoice.qr_image : null,
    shortUrl:
      typeof invoice.qPay_shortUrl === 'string'
        ? invoice.qPay_shortUrl
        : typeof invoice.qpay_short_url === 'string'
          ? invoice.qpay_short_url
          : null,
    deeplinks,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
    callbackReceivedAt: payment.callback_received_at ?? null,
    qpay: {
      paidAmount: paymentCheck.paid_amount ?? null,
      count: paymentCheck.count ?? 0,
      rows: Array.isArray(paymentCheck.rows) ? paymentCheck.rows : [],
    },
  };
};

const getAuthenticatedProfile = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, subscription_start_date, subscription_end_date, subscription_months, status')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Хэрэглэгчийн мэдээлэл олдсонгүй.');
  }

  return data;
};

const activatePremiumSubscription = async (userId: string, months: number) => {
  const profile = await getAuthenticatedProfile(userId);
  const now = new Date();
  const currentEndDate =
    profile.subscription_end_date && new Date(profile.subscription_end_date).getTime() > now.getTime()
      ? new Date(profile.subscription_end_date)
      : null;

  const startDate = profile.subscription_start_date ? new Date(profile.subscription_start_date) : now;
  const baseDate = currentEndDate ?? now;
  const nextEndDate = new Date(baseDate);
  nextEndDate.setMonth(nextEndDate.getMonth() + months);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      status: 'premium',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: nextEndDate.toISOString(),
      subscription_months: (profile.subscription_months ?? 0) + months,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
};

const updatePaymentRow = async (paymentId: string, values: Partial<PaymentRow>) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Төлбөрийн мэдээлэл шинэчилж чадсангүй.');
  }

  return data as PaymentRow;
};

const getPaymentById = async (paymentId: string) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error || !data) {
    throw new Error('Төлбөрийн мэдээлэл олдсонгүй.');
  }

  return data as PaymentRow;
};

const getUserPaymentById = async (paymentId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Төлбөрийн мэдээлэл олдсонгүй.');
  }

  return data as PaymentRow;
};

const syncPaymentStatus = async (
  payment: PaymentRow,
  options: { qpayPaymentId?: string | null; callbackReceived?: boolean } = {},
) => {
  if (!payment.qpay_invoice_id) {
    throw new Error('QPay invoice мэдээлэл олдсонгүй.');
  }

  const paymentCheck = await qpayService.checkInvoicePayments(payment.qpay_invoice_id);
  const rows = Array.isArray(paymentCheck.rows) ? paymentCheck.rows : [];
  const paidRow =
    rows.find((row) => row.payment_status === 'PAID') ??
    rows.find((row) => row.payment_status === 'PARTIAL') ??
    rows[0] ??
    null;

  const mergedRawResponse = {
    ...parseRawResponse(payment.raw_response),
    check: paymentCheck,
  };

  let nextStatus: PaymentRow['status'] = payment.status;
  const paidAmount = Number(paymentCheck.paid_amount ?? 0);
  const requiredAmount = Number(payment.amount);
  const qpayPaymentId = options.qpayPaymentId ?? paidRow?.payment_id ?? payment.transaction_id ?? null;

  if (paidRow?.payment_status === 'PAID' && paidAmount >= requiredAmount) {
    nextStatus = 'completed';
  } else if (rows.some((row) => row.payment_status === 'FAILED')) {
    nextStatus = 'failed';
  } else {
    nextStatus = 'pending';
  }

  const updatedPayment = await updatePaymentRow(payment.id, {
    status: nextStatus,
    transaction_id: qpayPaymentId,
    paid_at: nextStatus === 'completed' ? new Date().toISOString() : payment.paid_at,
    callback_received_at: options.callbackReceived ? new Date().toISOString() : payment.callback_received_at,
    raw_response: mergedRawResponse,
  });

  if (nextStatus === 'completed' && payment.status !== 'completed') {
    await activatePremiumSubscription(payment.user_id, payment.months);
  }

  return updatedPayment;
};

export const createQPayPayment = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const months = Number(req.body?.months);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  }

  const plan = getPlanByMonths(months);
  if (!plan) {
    return res.status(400).json({ success: false, error: 'Сонгосон багц буруу байна.' });
  }

  try {
    const profile = await getAuthenticatedProfile(userId);
    const senderInvoiceNo = createSenderInvoiceNo();
    const invoiceDescription = `TOPIK ${plan.title} subscription`;
    const invoiceCode = getInvoiceCode();

    const { data: paymentRow, error: createError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        amount: plan.amount,
        months: plan.months,
        payment_method: 'mobile',
        status: 'pending',
        sender_invoice_no: senderInvoiceNo,
        invoice_code: invoiceCode,
        invoice_description: invoiceDescription,
      })
      .select('*')
      .single();

    if (createError || !paymentRow) {
      return res.status(400).json({ success: false, error: createError?.message ?? 'Төлбөр үүсгэж чадсангүй.' });
    }

    try {
      const invoice = await qpayService.createInvoice({
        invoiceCode,
        senderInvoiceNo,
        invoiceReceiverCode: userId,
        invoiceDescription,
        amount: plan.amount,
        callbackUrl: buildCallbackUrl(paymentRow.id),
        receiverData: {
          name: profile.name,
          email: req.user?.email ?? null,
        },
      });

      const updatedPayment = await updatePaymentRow(paymentRow.id, {
        qpay_invoice_id: invoice.invoice_id,
        raw_response: {
          invoice,
        },
      });

      return res.json({
        success: true,
        payment: buildPaymentPayload(updatedPayment),
      });
    } catch (invoiceError) {
      await updatePaymentRow(paymentRow.id, {
        status: 'failed',
        raw_response: {
          error: invoiceError instanceof Error ? invoiceError.message : 'QPay invoice үүсгэхэд алдаа гарлаа.',
        },
      });

      throw invoiceError;
    }
  } catch (error) {
    console.error('Create QPay payment error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'QPay invoice үүсгэхэд алдаа гарлаа.',
    });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      payments: (data ?? []).map((payment) => buildPaymentPayload(payment as PaymentRow)),
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ success: false, error: 'Төлбөрийн түүх авахад алдаа гарлаа.' });
  }
};

export const getPaymentDetail = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : req.params.paymentId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  }

  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'Payment ID is required.' });
  }

  try {
    const payment = await getUserPaymentById(paymentId, userId);

    return res.json({
      success: true,
      payment: buildPaymentPayload(payment),
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Төлбөрийн мэдээлэл олдсонгүй.',
    });
  }
};

export const checkQPayPayment = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : req.params.paymentId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  }

  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'Payment ID is required.' });
  }

  try {
    const payment = await getUserPaymentById(paymentId, userId);
    const updatedPayment = await syncPaymentStatus(payment);

    return res.json({
      success: true,
      payment: buildPaymentPayload(updatedPayment),
      message:
        updatedPayment.status === 'completed'
          ? `${updatedPayment.months} сарын багц амжилттай идэвхжлээ.`
          : 'Төлбөр хүлээгдэж байна.',
    });
  } catch (error) {
    console.error('Check QPay payment error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Төлбөр шалгахад алдаа гарлаа.',
    });
  }
};

export const simulateQPayPaymentSuccess = async (req: AuthRequest, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Development payment simulation is disabled in production.',
    });
  }

  const userId = req.userId;
  const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : req.params.paymentId;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  }

  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'Payment ID is required.' });
  }

  try {
    const payment = await getUserPaymentById(paymentId, userId);
    const nowIso = new Date().toISOString();

    const updatedPayment = await updatePaymentRow(payment.id, {
      status: 'completed',
      transaction_id: payment.transaction_id ?? `DEV-${Date.now()}`,
      paid_at: payment.paid_at ?? nowIso,
      callback_received_at: payment.callback_received_at ?? nowIso,
      raw_response: {
        ...parseRawResponse(payment.raw_response),
        debug: {
          simulated: true,
          simulatedAt: nowIso,
        },
      },
    });

    if (payment.status !== 'completed') {
      await activatePremiumSubscription(payment.user_id, payment.months);
    }

    return res.json({
      success: true,
      payment: buildPaymentPayload(updatedPayment),
      message: `${updatedPayment.months} сарын багц тестээр амжилттай идэвхжлээ.`,
    });
  } catch (error) {
    console.error('Simulate QPay payment error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Тест төлбөр амжилтгүй боллоо.',
    });
  }
};

export const handleQPayCallback = async (req: AuthRequest, res: Response) => {
  const localPaymentId =
    typeof req.query.payment_id === 'string'
      ? req.query.payment_id
      : typeof req.query.local_payment_id === 'string'
        ? req.query.local_payment_id
        : null;

  const qpayPaymentId =
    typeof req.query.qpay_payment_id === 'string' ? req.query.qpay_payment_id : null;

  try {
    if (localPaymentId) {
      const payment = await getPaymentById(localPaymentId);
      await syncPaymentStatus(payment, {
        qpayPaymentId,
        callbackReceived: true,
      });
    } else {
      console.warn('QPay callback received without local payment id.');
    }
  } catch (error) {
    console.error('QPay callback processing error:', error);
  }

  res.status(200).send('SUCCESS');
};
