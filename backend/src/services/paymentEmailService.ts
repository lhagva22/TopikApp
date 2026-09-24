const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

type PaymentReceiptInput = {
  to: string;
  customerName: string;
  amount: number;
  months: number;
  paymentId: string;
  paidAt: string;
};
type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatAmount = (amount: number) => `${new Intl.NumberFormat('mn-MN').format(amount)}₮`;

export const sendPaymentReceiptEmail = async (input: PaymentReceiptInput) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const fromName = process.env.RESEND_FROM_NAME?.trim() || 'TOPIK App';

  if (!apiKey || !fromEmail) {
    throw new Error('RESEND_API_KEY эсвэл RESEND_FROM_EMAIL тохируулаагүй байна.');
  }

  const safeName = escapeHtml(input.customerName || 'Хэрэглэгч');
  const amount = formatAmount(input.amount);
  const paidAt = new Date(input.paidAt).toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' });

  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `topik-payment-${input.paymentId}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [input.to],
      subject: 'Төлбөр амжилттай төлөгдлөө',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="color:#2563eb">Төлбөр амжилттай</h2>
          <p>Сайн байна уу, ${safeName}.</p>
          <p>Таны TOPIK App-ийн төлбөр амжилттай баталгаажиж, premium эрх идэвхжлээ.</p>
          <table style="border-collapse:collapse">
            <tr><td style="padding:4px 16px 4px 0">Багц:</td><td><strong>${input.months} сар</strong></td></tr>
            <tr><td style="padding:4px 16px 4px 0">Дүн:</td><td><strong>${amount}</strong></td></tr>
            <tr><td style="padding:4px 16px 4px 0">Огноо:</td><td>${escapeHtml(paidAt)}</td></tr>
          </table>
          <p>TOPIK App-ийг сонгосонд баярлалаа.</p>
        </div>
      `,
    }),
  });

  const result = (await response.json()) as ResendResponse;

  if (!response.ok || !result.id) {
    throw new Error(result.message || result.name || `Resend хүсэлт амжилтгүй: ${response.status}`);
  }

  return result.id;
};
