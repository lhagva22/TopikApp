import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadEnvFile, localObjectName, projectRefFromUrl, sha256File } from './storage-common.mjs';

test('derives the project ref only from a Supabase project URL', () => {
  assert.equal(projectRefFromUrl('https://abc123.supabase.co'), 'abc123');
  assert.throws(() => projectRefFromUrl('https://example.com'));
});

test('uses collision-resistant local names without exposing object paths', () => {
  const first = localObjectName('bucket', '../private/video.mp4');
  const second = localObjectName('bucket', 'private/video.mp4');
  assert.match(first, /^[a-f0-9]{64}\.blob$/);
  assert.notEqual(first, second);
});

test('loads an env file and hashes a file without changing its contents', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'topik-backup-test-'));
  try {
    const envFile = path.join(directory, '.env');
    const dataFile = path.join(directory, 'data.bin');
    await writeFile(envFile, 'BACKUP_TEST_VALUE="safe value"\n');
    await writeFile(dataFile, 'hello');
    delete process.env.BACKUP_TEST_VALUE;
    loadEnvFile(envFile);
    assert.equal(process.env.BACKUP_TEST_VALUE, 'safe value');
    assert.equal(await sha256File(dataFile), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  } finally {
    delete process.env.BACKUP_TEST_VALUE;
    await rm(directory, { recursive: true, force: true });
  }
});
