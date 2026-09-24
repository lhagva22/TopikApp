import { createSign } from 'node:crypto';

type PushMessage = {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

type GoogleTokenResponse = {
  access_token?: string;
  error_description?: string;
};

const base64Url = (value: string) => Buffer.from(value).toString('base64url');

const getFirebaseConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase server credentials тохируулаагүй байна.');
  }

  return { projectId, clientEmail, privateKey };
};

const getAccessToken = async () => {
  const { clientEmail, privateKey } = getFirebaseConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(unsignedToken).end().sign(privateKey, 'base64url');
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const result = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || `Firebase OAuth хүсэлт амжилтгүй: ${response.status}`);
  }

  return result.access_token;
};

export const sendFirebaseMessages = async (messages: PushMessage[]) => {
  if (messages.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] as string[] };
  }

  const { projectId } = getFirebaseConfig();
  const accessToken = await getAccessToken();
  const invalidTokens: string[] = [];
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < messages.length; index += 20) {
    const batch = messages.slice(index, index + 20);
    const results = await Promise.all(batch.map(async (item) => {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: item.token,
              notification: { title: item.title, body: item.body },
              data: item.data,
              android: {
                priority: 'high',
                notification: { sound: 'default' },
              },
            },
          }),
        },
      );

      if (response.ok) {
        sent += 1;
        return;
      }

      failed += 1;
      const errorBody = await response.text();
      if (response.status === 404 || /UNREGISTERED|registration-token-not-registered/i.test(errorBody)) {
        invalidTokens.push(item.token);
      }
      console.error('FCM send failed:', { status: response.status, body: errorBody.slice(0, 500) });
    }));

    await Promise.all(results);
  }

  return { sent, failed, invalidTokens };
};
