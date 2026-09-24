import { timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';

import { supabaseAdmin } from '../config/supabase';
import { sendFirebaseMessages } from '../services/firebaseMessagingService';
import type { AuthRequest } from '../types';

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
};
const isValidWebhookSecret = (provided: string | undefined) => {
  const expected = process.env.PUSH_WEBHOOK_SECRET?.trim();
  if (!expected || !provided) return false;

  const actualBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
};

export const registerPushToken = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  const platform = req.body?.platform;

  if (!userId) return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  if (!token || token.length > 4096 || !['android', 'ios'].includes(platform)) {
    return res.status(400).json({ success: false, error: 'Push token эсвэл platform буруу байна.' });
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('push_notification_tokens').upsert({
    user_id: userId,
    token,
    platform,
    is_active: true,
    last_seen_at: now,
    updated_at: now,
  }, { onConflict: 'token' });

  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true });
};

export const unregisterPushToken = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

  if (!userId) return res.status(401).json({ success: false, error: 'Хэрэглэгч олдсонгүй.' });
  if (!token) return res.status(400).json({ success: false, error: 'Push token шаардлагатай.' });

  const { error } = await supabaseAdmin
    .from('push_notification_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('token', token);

  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true });
};

export const handleContentCreatedWebhook = async (req: Request, res: Response) => {
  if (!isValidWebhookSecret(req.header('x-webhook-secret'))) {
    return res.status(401).json({ success: false, error: 'Invalid webhook secret.' });
  }

  const payload = req.body as WebhookPayload;
  const supportedTables = new Set(['learning_contents', 'mock_test_bank']);
  const record = payload.record;

  if (payload.type !== 'INSERT' || payload.schema !== 'public' || !payload.table || !supportedTables.has(payload.table) || !record) {
    return res.status(202).json({ success: true, skipped: true });
  }
  if (record.is_active === false) {
    return res.status(202).json({ success: true, skipped: true });
  }

  const sourceId = String(record.id || '');
  const eventKey = `${payload.table}:${sourceId}`;
  if (!sourceId) return res.status(400).json({ success: false, error: 'Webhook record id байхгүй байна.' });

  const { error: eventError } = await supabaseAdmin.from('push_notification_events').insert({
    event_key: eventKey,
    source_table: payload.table,
    source_id: sourceId,
  });

  if (eventError?.code === '23505') {
    return res.status(200).json({ success: true, duplicate: true });
  }
  if (eventError) return res.status(500).json({ success: false, error: eventError.message });

  const { data: premiumProfiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('status', 'premium')
    .gt('subscription_end_date', new Date().toISOString());

  if (profileError) return res.status(500).json({ success: false, error: profileError.message });
  const userIds = (premiumProfiles ?? []).map((profile) => profile.id);

  if (userIds.length === 0) {
    return res.json({ success: true, sent: 0, failed: 0 });
  }

  const { data: tokenRows, error: tokenError } = await supabaseAdmin
    .from('push_notification_tokens')
    .select('token')
    .in('user_id', userIds)
    .eq('is_active', true);

  if (tokenError) return res.status(500).json({ success: false, error: tokenError.message });

  const isLesson = payload.table === 'learning_contents';
  const title = isLesson ? 'Шинэ хичээл нэмэгдлээ' : 'Шинэ шалгалт нэмэгдлээ';
  const contentTitle = typeof record.title === 'string' ? record.title.trim() : '';
  const body = contentTitle
    ? `${contentTitle} ашиглахад бэлэн боллоо.`
    : isLesson ? 'Шинэ хичээлтэй танилцаарай.' : 'Шинэ шалгалтаа ажиллаарай.';
  const result = await sendFirebaseMessages((tokenRows ?? []).map(({ token }) => ({
    token,
    title,
    body,
    data: { type: isLesson ? 'lesson' : 'exam', id: sourceId },
  })));

  if (result.invalidTokens.length > 0) {
    await supabaseAdmin
      .from('push_notification_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('token', result.invalidTokens);
  }

  await supabaseAdmin
    .from('push_notification_events')
    .update({ recipient_count: result.sent })
    .eq('event_key', eventKey);

  return res.json({ success: true, sent: result.sent, failed: result.failed });
};
