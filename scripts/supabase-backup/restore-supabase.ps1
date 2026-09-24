param(
  [Parameter(Mandatory = $true)][string]$BackupDirectory,
  [Parameter(Mandatory = $true)][string]$ConfirmTargetProjectRef,
  [Parameter(Mandatory = $true)][string]$TargetEnvFile,
  [switch]$Execute,
  [switch]$OverwriteStorage
)

$ErrorActionPreference = 'Stop'
$backupPath = [System.IO.Path]::GetFullPath($BackupDirectory)
$manifestPath = Join-Path $backupPath 'backup-manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "Backup manifest not found: $manifestPath" }
if (Test-Path -LiteralPath (Join-Path $backupPath 'INCOMPLETE')) { throw 'This backup is marked INCOMPLETE and cannot be restored.' }
if (-not $env:SUPABASE_DB_URL) { throw 'Set SUPABASE_DB_URL to the TARGET project Session pooler connection string.' }
if (-not (Test-Path -LiteralPath $TargetEnvFile)) { throw "Target environment file not found: $TargetEnvFile" }

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
if ($env:SUPABASE_DB_URL -notmatch [regex]::Escape($ConfirmTargetProjectRef)) {
  throw 'The target database URL does not contain ConfirmTargetProjectRef. Check that both point to the same target project.'
}
if ($manifest.sourceProjectRef -eq $ConfirmTargetProjectRef) {
  throw 'For safety this script restores only to a different/new Supabase project, not over the source project.'
}

foreach ($file in $manifest.files) {
  $fullPath = Join-Path $backupPath $file.name
  if (-not (Test-Path -LiteralPath $fullPath)) { throw "Backup file missing: $($file.name)" }
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $fullPath).Hash.ToLowerInvariant()
  if ($actual -ne $file.sha256) { throw "Backup checksum mismatch: $($file.name)" }
}

if (-not $Execute) {
  Write-Host "DRY RUN passed for target $ConfirmTargetProjectRef. Add -Execute only after reviewing the backup and target project."
  & node (Join-Path $PSScriptRoot 'restore-storage.mjs') "--backup=$backupPath" "--env-file=$TargetEnvFile" "--confirm-target=$ConfirmTargetProjectRef"
  exit $LASTEXITCODE
}

Write-Host "Restoring database into target project $ConfirmTargetProjectRef"
& psql --single-transaction --variable ON_ERROR_STOP=1 `
  --file (Join-Path $backupPath 'roles.sql') `
  --file (Join-Path $backupPath 'schema.sql') `
  --command 'SET session_replication_role = replica' `
  --file (Join-Path $backupPath 'data.sql') `
  --dbname $env:SUPABASE_DB_URL
if ($LASTEXITCODE -ne 0) { throw "Database restore failed with exit code $LASTEXITCODE. Storage was not restored." }

$storageArgs = @(
  (Join-Path $PSScriptRoot 'restore-storage.mjs'), "--backup=$backupPath", "--env-file=$TargetEnvFile",
  "--confirm-target=$ConfirmTargetProjectRef", '--execute'
)
if ($OverwriteStorage) { $storageArgs += '--overwrite' }
& node @storageArgs
if ($LASTEXITCODE -ne 0) { throw "Storage restore failed with exit code $LASTEXITCODE" }
Write-Host 'Restore complete. Reconfigure Auth providers/SMTP, URLs, JWT/signing keys, webhooks, Realtime publications, and test before cutover.'
