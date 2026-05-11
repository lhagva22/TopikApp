type QPayTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
};

type QPayDeeplink = {
  name?: string;
  description?: string;
  logo?: string;
  link?: string;
};

type QPayInvoiceResponse = {
  invoice_id: string;
  qr_text?: string;
  qr_image?: string;
  qPay_shortUrl?: string;
  qpay_short_url?: string;
  urls?: QPayDeeplink[];
  qPay_deeplink?: QPayDeeplink[];
};

type QPayPaymentCheckRow = {
  payment_id?: string;
  payment_status?: string;
  payment_amount?: string | number;
  payment_currency?: string;
  payment_wallet?: string;
  payment_type?: string;
  transaction_type?: string;
};

type QPayPaymentCheckResponse = {
  count?: number;
  paid_amount?: string | number;
  rows?: QPayPaymentCheckRow[];
};

type CreateInvoiceInput = {
  invoiceCode: string;
  senderInvoiceNo: string;
  invoiceReceiverCode: string;
  invoiceDescription: string;
  amount: number;
  callbackUrl: string;
  receiverData?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

const DEFAULT_QPAY_BASE_URL = 'https://merchant-sandbox.qpay.mn/v2';

let accessTokenCache: {
  accessToken: string;
  refreshToken?: string;
  accessExpiresAt: number;
  refreshExpiresAt?: number;
} | null = null;

const getQPayConfig = () => {
  const baseUrl = process.env.QPAY_BASE_URL?.trim() || DEFAULT_QPAY_BASE_URL;
  const clientId = process.env.QPAY_CLIENT_ID?.trim();
  const clientSecret = process.env.QPAY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      'QPAY_CLIENT_ID болон QPAY_CLIENT_SECRET тохируулаагүй байна. backend/.env-ээ шалгана уу.',
    );
  }

  return {
    baseUrl,
    clientId,
    clientSecret,
  };
};

const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

const normalizeExpiry = (expiresInSeconds?: number) => {
  if (!expiresInSeconds) {
    return Date.now() + 5 * 60 * 1000;
  }

  return Date.now() + expiresInSeconds * 1000;
};

const isAccessTokenValid = () =>
  Boolean(accessTokenCache && accessTokenCache.accessExpiresAt - Date.now() > 60 * 1000);

const isRefreshTokenValid = () =>
  Boolean(accessTokenCache?.refreshToken && (accessTokenCache.refreshExpiresAt ?? 0) - Date.now() > 60 * 1000);

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const qpayRequest = async <T>(
  path: string,
  options: RequestInit,
  authorizationHeader: string,
): Promise<T> => {
  const { baseUrl } = getQPayConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: authorizationHeader,
      ...(options.headers ?? {}),
    },
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      `QPay хүсэлт амжилтгүй: ${response.status}`;

    throw new Error(message);
  }

  return data as T;
};

const fetchNewToken = async () => {
  const { clientId, clientSecret } = getQPayConfig();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenResponse = await qpayRequest<QPayTokenResponse>(
    '/auth/token',
    {
      method: 'POST',
      body: '',
    },
    `Basic ${basicAuth}`,
  );

  accessTokenCache = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    accessExpiresAt: normalizeExpiry(tokenResponse.expires_in),
    refreshExpiresAt: normalizeExpiry(tokenResponse.refresh_expires_in),
  };

  return accessTokenCache.accessToken;
};

const refreshAccessToken = async () => {
  if (!accessTokenCache?.refreshToken) {
    return fetchNewToken();
  }

  const tokenResponse = await qpayRequest<QPayTokenResponse>(
    '/auth/refresh',
    {
      method: 'POST',
      body: '',
    },
    `Bearer ${accessTokenCache.refreshToken}`,
  );

  accessTokenCache = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? accessTokenCache.refreshToken,
    accessExpiresAt: normalizeExpiry(tokenResponse.expires_in),
    refreshExpiresAt: normalizeExpiry(tokenResponse.refresh_expires_in),
  };

  return accessTokenCache.accessToken;
};

export const getQPayAccessToken = async () => {
  if (isAccessTokenValid()) {
    return accessTokenCache!.accessToken;
  }

  if (isRefreshTokenValid()) {
    return refreshAccessToken();
  }

  return fetchNewToken();
};

export const createQPayInvoice = async (input: CreateInvoiceInput) => {
  const accessToken = await getQPayAccessToken();

  const receiverData = input.receiverData ?? {};

  return qpayRequest<QPayInvoiceResponse>(
    '/invoice',
    {
      method: 'POST',
      body: JSON.stringify({
        invoice_code: input.invoiceCode,
        sender_invoice_no: input.senderInvoiceNo,
        invoice_receiver_code: input.invoiceReceiverCode,
        invoice_description: input.invoiceDescription,
        amount: input.amount,
        callback_url: input.callbackUrl,
        allow_partial: false,
        allow_exceed: false,
        sender_staff_code: 'mobile_app',
        invoice_receiver_data: {
          name: receiverData.name ?? undefined,
          email: receiverData.email ?? undefined,
          phone: receiverData.phone ?? undefined,
        },
      }),
    },
    `Bearer ${accessToken}`,
  );
};

export const checkQPayInvoicePayments = async (invoiceId: string) => {
  const accessToken = await getQPayAccessToken();

  return qpayRequest<QPayPaymentCheckResponse>(
    '/payment/check',
    {
      method: 'POST',
      body: JSON.stringify({
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100,
        },
      }),
    },
    `Bearer ${accessToken}`,
  );
};

export const qpayService = {
  getAccessToken: getQPayAccessToken,
  createInvoice: createQPayInvoice,
  checkInvoicePayments: checkQPayInvoicePayments,
  getCurrentTokenTimestamp: getUnixTimestamp,
};

export type { QPayDeeplink, QPayInvoiceResponse, QPayPaymentCheckResponse, QPayPaymentCheckRow };
