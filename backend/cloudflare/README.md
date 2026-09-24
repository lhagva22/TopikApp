# Cloudflare Worker deployment

This adapter runs the existing Express API through Cloudflare Workers' Node.js HTTP server integration.
The project uses a current compatibility date where Node.js compatibility is enabled by default.

## Local verification

Copy the same variable names used by `backend/.env` into `backend/.env.cloudflare` for local testing only.
That file is ignored by Git.

```powershell
cd C:\TopikApp\backend
npm run cloudflare:check
npm run cloudflare:dev
```

Then open `http://localhost:8787/health`. The local Node server (`npm run dev`) remains available separately on port 5000.

## First deployment

Authenticate Wrangler, then enter every production value interactively. Never put these values in `wrangler.jsonc`, source code, shell history, or Git.

```powershell
cd C:\TopikApp\backend
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put QPAY_BASE_URL
npx wrangler secret put QPAY_CLIENT_ID
npx wrangler secret put QPAY_CLIENT_SECRET
npx wrangler secret put QPAY_INVOICE_CODE
npx wrangler secret put QPAY_CALLBACK_URL
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put RESEND_FROM_NAME
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY
npx wrangler secret put PUSH_WEBHOOK_SECRET
npm run cloudflare:deploy
```

`SUPABASE_SERVICE_KEY` and QPay credentials are server-only secrets. The Worker must never return or log them.
After deployment, test `/health`, authentication, exam loading, progress, dictionary pagination, and payment callback behavior against the Worker URL before configuring the mobile production build.

The `/media` local filesystem route is intentionally disabled in Workers. Production media must use public Supabase Storage URLs or another external object store.
