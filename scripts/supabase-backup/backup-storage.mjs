import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  apiHeaders, encodeObjectPath, fetchJson, loadEnvFile, localObjectName,
  projectRefFromUrl, sha256File, writeResponseToFile,
} from './storage-common.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=') || true];
}));
loadEnvFile(args['env-file']);

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const output = args.output && path.resolve(String(args.output));
if (!supabaseUrl || !serviceKey || !output) {
  throw new Error('Usage: node backup-storage.mjs --output=DIR [--env-file=FILE], with SUPABASE_URL and SUPABASE_SERVICE_KEY set');
}

const objectsDir = path.join(output, 'objects');
await mkdir(objectsDir, { recursive: true });
const buckets = await fetchJson(`${supabaseUrl}/storage/v1/bucket`, {
  headers: apiHeaders(serviceKey),
}, 'List buckets');

async function listObjects(bucketId, prefix = '') {
  const collected = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = await fetchJson(`${supabaseUrl}/storage/v1/object/list/${encodeURIComponent(bucketId)}`, {
      method: 'POST', headers: apiHeaders(serviceKey, { 'content-type': 'application/json' }),
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    }, `List ${bucketId}/${prefix}`);
    for (const row of rows) {
      const name = prefix ? `${prefix}/${row.name}` : row.name;
      if (row.id) collected.push({ ...row, name });
      else collected.push(...await listObjects(bucketId, name));
    }
    if (rows.length < 1000) break;
  }
  return collected;
}

const manifestObjects = [];
for (const bucket of buckets) {
  const objects = await listObjects(bucket.id);
  console.log(`[Storage] ${bucket.id}: ${objects.length} object(s)`);
  for (const object of objects) {
    const localFile = `objects/${localObjectName(bucket.id, object.name)}`;
    const finalPath = path.join(output, localFile);
    const temporaryPath = `${finalPath}.partial`;
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket.id)}/${encodeObjectPath(object.name)}`,
      { headers: apiHeaders(serviceKey) },
    );
    if (!response.ok) throw new Error(`Download ${bucket.id}/${object.name} failed (${response.status})`);
    await writeResponseToFile(response, temporaryPath);
    await rename(temporaryPath, finalPath);
    const fileStats = await import('node:fs/promises').then(({ stat }) => stat(finalPath));
    manifestObjects.push({
      bucketId: bucket.id, name: object.name, localFile: localFile.replaceAll('\\', '/'),
      size: fileStats.size, sha256: await sha256File(finalPath),
      contentType: object.metadata?.mimetype || 'application/octet-stream', metadata: object.metadata || null,
    });
  }
}

const manifest = {
  formatVersion: 1, createdAt: new Date().toISOString(), projectRef: projectRefFromUrl(supabaseUrl),
  buckets: buckets.map(({ id, name, public: isPublic, file_size_limit, allowed_mime_types }) => ({
    id, name, public: isPublic, fileSizeLimit: file_size_limit, allowedMimeTypes: allowed_mime_types,
  })),
  objects: manifestObjects,
};
await writeFile(path.join(output, 'storage-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await rm(path.join(output, 'objects', '.partial'), { force: true }).catch(() => undefined);
console.log(`[Storage] Backup complete: ${manifestObjects.length} object(s)`);
