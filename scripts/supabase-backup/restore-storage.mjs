import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  apiHeaders, encodeObjectPath, fetchJson, loadEnvFile, projectRefFromUrl, readJson, sha256File,
} from './storage-common.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=') || true];
}));
loadEnvFile(args['env-file'], true);
const backupDir = args.backup && path.resolve(String(args.backup));
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const execute = args.execute === true;
const overwrite = args.overwrite === true;
if (!backupDir || !supabaseUrl || !serviceKey) throw new Error('Set --backup, SUPABASE_URL, and SUPABASE_SERVICE_KEY');

const targetRef = projectRefFromUrl(supabaseUrl);
if (String(args['confirm-target'] || '') !== targetRef) throw new Error(`Pass --confirm-target=${targetRef} to confirm the destination project`);
const manifest = await readJson(path.join(backupDir, 'storage-manifest.json'));
if (manifest.projectRef === targetRef && !args['allow-source-project']) {
  throw new Error('Refusing to restore onto the source project. Use a new project, or explicitly pass --allow-source-project.');
}
console.log(`[Storage] ${execute ? 'RESTORE' : 'DRY RUN'} ${manifest.objects.length} object(s) to ${targetRef}`);
if (!execute) process.exit(0);

const existingBuckets = await fetchJson(`${supabaseUrl}/storage/v1/bucket`, { headers: apiHeaders(serviceKey) }, 'List target buckets');
const existingIds = new Set(existingBuckets.map((bucket) => bucket.id));
for (const bucket of manifest.buckets) {
  if (existingIds.has(bucket.id)) continue;
  await fetchJson(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST', headers: apiHeaders(serviceKey, { 'content-type': 'application/json' }),
    body: JSON.stringify({ id: bucket.id, name: bucket.name || bucket.id, public: bucket.public,
      file_size_limit: bucket.fileSizeLimit, allowed_mime_types: bucket.allowedMimeTypes }),
  }, `Create bucket ${bucket.id}`);
}

for (const object of manifest.objects) {
  const localPath = path.resolve(backupDir, object.localFile);
  if (!localPath.startsWith(`${backupDir}${path.sep}`)) throw new Error(`Unsafe manifest path: ${object.localFile}`);
  const size = (await stat(localPath)).size;
  if (size !== object.size || await sha256File(localPath) !== object.sha256) throw new Error(`Checksum mismatch: ${object.localFile}`);
  const body = Readable.toWeb(createReadStream(localPath));
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(object.bucketId)}/${encodeObjectPath(object.name)}`, {
    method: 'POST', headers: apiHeaders(serviceKey, {
      'content-type': object.contentType || 'application/octet-stream', 'content-length': String(size), 'x-upsert': String(overwrite),
    }), body, duplex: 'half',
  });
  if (!response.ok) throw new Error(`Upload ${object.bucketId}/${object.name} failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
}
console.log('[Storage] Restore complete');
