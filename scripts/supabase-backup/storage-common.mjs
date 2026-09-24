import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

export function loadEnvFile(file, override = false) {
  if (!file || !existsSync(file)) return;
  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || (!override && process.env[match[1]])) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

export function projectRefFromUrl(url) {
  const host = new URL(url).hostname;
  const suffix = '.supabase.co';
  if (!host.endsWith(suffix)) throw new Error('SUPABASE_URL must be a project URL ending in .supabase.co');
  return host.slice(0, -suffix.length);
}

export function apiHeaders(serviceKey, extra = {}) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, ...extra };
}

export async function fetchJson(url, options, label) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`${label} failed (${response.status}): ${detail}`);
  }
  return response.status === 204 ? null : response.json();
}

export const encodeObjectPath = (name) => name.split('/').map(encodeURIComponent).join('/');

export function localObjectName(bucketId, objectName) {
  return `${createHash('sha256').update(bucketId).update('\0').update(objectName).digest('hex')}.blob`;
}

export async function sha256File(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export async function writeResponseToFile(response, destination) {
  if (!response.body) throw new Error('Storage download returned an empty response body');
  await mkdir(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}
