const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_ENV_FILE = path.join(ROOT, 'backend', '.env');
const DEFAULT_MANIFEST = path.join(ROOT, 'backend', 'sql', 'mock_tests', 'topik_96_asset_manifest.json');
const DEFAULT_BUCKET = 'mock test files';
const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function parseArgs(argv) {
  const options = {
    dryRun: false,
    examTypes: null,
    envFile: DEFAULT_ENV_FILE,
    manifest: DEFAULT_MANIFEST,
    bucket: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--exam') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--exam requires a value like TOPIK_I or TOPIK_II');
      }
      options.examTypes = next
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === '--env-file') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--env-file requires a file path');
      }
      options.envFile = path.resolve(ROOT, next);
      index += 1;
      continue;
    }

    if (arg === '--manifest') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--manifest requires a file path');
      }
      options.manifest = path.resolve(ROOT, next);
      index += 1;
      continue;
    }

    if (arg === '--bucket') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--bucket requires a bucket name');
      }
      options.bucket = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseDotEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Env file not found: ${envFilePath}`);
  }

  const parsed = parseDotEnv(fs.readFileSync(envFilePath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function encodeStoragePath(relativePath) {
  return relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function detectContentType(filePathOrUrl) {
  const lower = String(filePathOrUrl).toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}\n${stderr}`));
    });
  });
}

function getAudioSourcePath(exam) {
  const specificEnvKey = `${exam.exam_type}_${exam.test_number}_AUDIO_PATH`;
  const genericEnvKey = `${exam.exam_type}_AUDIO_PATH`;
  const specificPath = process.env[specificEnvKey];
  if (specificPath) {
    return path.resolve(specificPath);
  }

  const genericPath = process.env[genericEnvKey];
  if (genericPath) {
    return path.resolve(genericPath);
  }

  return path.join(os.homedir(), 'Downloads', exam.audio_file_name);
}

async function transcodeAudioIfNeeded(sourcePath, maxUploadBytes) {
  const stat = await fsp.stat(sourcePath);
  if (stat.size <= maxUploadBytes) {
    return {
      path: sourcePath,
      temporary: false,
      note: null,
    };
  }

  const tempPath = path.join(
    os.tmpdir(),
    `topik-audio-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`,
  );

  await runProcess('ffmpeg', [
    '-y',
    '-i',
    sourcePath,
    '-vn',
    '-ac',
    '1',
    '-b:a',
    '64k',
    tempPath,
  ]);

  const transcodedStat = await fsp.stat(tempPath);
  if (transcodedStat.size > maxUploadBytes) {
    throw new Error(
      `Transcoded audio is still too large (${transcodedStat.size} bytes). ` +
        `Current limit is ${maxUploadBytes} bytes.`,
    );
  }

  return {
    path: tempPath,
    temporary: true,
    note:
      `Audio was transcoded to mono 64kbps because the original file ` +
      `(${stat.size} bytes) exceeded the current upload limit (${maxUploadBytes} bytes).`,
  };
}

async function readLocalAsset(filePath) {
  const buffer = await fsp.readFile(filePath);
  return {
    buffer,
    contentType: detectContentType(filePath),
    sourceLabel: filePath,
  };
}

async function downloadRemoteAsset(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || detectContentType(sourceUrl);
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    sourceLabel: sourceUrl,
  };
}

async function uploadToSupabase({ supabaseUrl, serviceKey, bucket, targetPath, contentType, buffer, dryRun }) {
  const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeStoragePath(targetPath)}`;

  if (dryRun) {
    return { dryRun: true, uploadUrl };
  }

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'x-upsert': 'true',
      'content-type': contentType,
      'cache-control': '3600',
    },
    body: buffer,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Upload failed for ${targetPath}: ${response.status} ${response.statusText} - ${bodyText}`);
  }

  return response.json().catch(() => ({}));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  loadEnvFile(options.envFile);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const bucket = options.bucket || process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  const maxUploadBytes = Number(process.env.SUPABASE_STORAGE_MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES);

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is missing. Check backend/.env');
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is missing. Check backend/.env');
  }
  if (!fs.existsSync(options.manifest)) {
    throw new Error(`Manifest file not found: ${options.manifest}`);
  }

  const manifest = JSON.parse(await fsp.readFile(options.manifest, 'utf8'));
  const exams = options.examTypes
    ? manifest.exams.filter((exam) => options.examTypes.includes(exam.exam_type))
    : manifest.exams;

  if (exams.length === 0) {
    throw new Error('No exams matched the given filter.');
  }

  let uploadedCount = 0;

  for (const exam of exams) {
    console.log(`\n[${exam.exam_type}] ${exam.assets.length} asset(s)`);

    for (const asset of exam.assets) {
      let assetPayload;
      let temporaryAssetPath = null;

      if (asset.kind === 'audio') {
        const sourcePath = getAudioSourcePath(exam);
        if (!fs.existsSync(sourcePath)) {
          throw new Error(
            `Local audio file not found for ${exam.exam_type}: ${sourcePath}\n` +
              `Set ${exam.exam_type}_AUDIO_PATH in your environment if the file is somewhere else.`,
          );
        }
        const preparedAudio = await transcodeAudioIfNeeded(sourcePath, maxUploadBytes);
        temporaryAssetPath = preparedAudio.temporary ? preparedAudio.path : null;
        assetPayload = await readLocalAsset(preparedAudio.path);
        if (preparedAudio.note) {
          console.log(`[INFO] ${preparedAudio.note}`);
        }
      } else if (asset.source_url) {
        assetPayload = await downloadRemoteAsset(asset.source_url);
      } else {
        throw new Error(`Asset ${asset.target_path} does not have a supported source.`);
      }

      try {
        const result = await uploadToSupabase({
          supabaseUrl,
          serviceKey,
          bucket,
          targetPath: asset.target_path,
          contentType: assetPayload.contentType,
          buffer: assetPayload.buffer,
          dryRun: options.dryRun,
        });

        uploadedCount += 1;
        const mode = options.dryRun ? 'DRY-RUN' : 'UPLOADED';
        console.log(`[${mode}] ${asset.target_path} <= ${assetPayload.sourceLabel}`);
        if (options.dryRun && result.uploadUrl) {
          console.log(`         ${result.uploadUrl}`);
        }
      } finally {
        if (temporaryAssetPath) {
          await fsp.unlink(temporaryAssetPath).catch(() => {});
        }
      }
    }
  }

  console.log(`\nDone. Processed ${uploadedCount} asset(s).`);
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
