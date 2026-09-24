param(
  [string]$OutputRoot = (Join-Path $PSScriptRoot '..\..\backups'),
  [string]$EnvFile = (Join-Path $PSScriptRoot '..\..\backend\.env')
)

$ErrorActionPreference = 'Stop'
$cliVersion = '2.117.0'

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Supabase environment file not found: $EnvFile"
}
$linkedProjectFile = Join-Path $PSScriptRoot '..\..\supabase\.temp\project-ref'
[string[]]$connectionArguments = if ($env:SUPABASE_DB_URL) {
  @('--db-url', $env:SUPABASE_DB_URL)
} elseif (Test-Path -LiteralPath $linkedProjectFile) {
  @('--linked')
} else {
  throw 'No database connection is available. Set SUPABASE_DB_URL or run supabase link first.'
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$backupDirectory = Join-Path ([System.IO.Path]::GetFullPath($OutputRoot)) "supabase-$timestamp"
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$incompleteMarker = Join-Path $backupDirectory 'INCOMPLETE'
'Backup has not completed.' | Set-Content -Encoding UTF8 -LiteralPath $incompleteMarker

function Invoke-SupabaseDump([string[]]$Arguments) {
  & npx.cmd --yes "supabase@$cliVersion" db dump @connectionArguments @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Supabase database dump failed with exit code $LASTEXITCODE" }
}

try {
  Write-Host "[Database] Backing up roles, schema, and data to $backupDirectory"
  Invoke-SupabaseDump -Arguments @('-f', (Join-Path $backupDirectory 'roles.sql'), '--role-only')
  Invoke-SupabaseDump -Arguments @('-f', (Join-Path $backupDirectory 'schema.sql'))
  Invoke-SupabaseDump -Arguments @(
    '-f', (Join-Path $backupDirectory 'data.sql'), '--use-copy', '--data-only',
    '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes'
  )

  Write-Host '[Storage] Downloading bucket objects and building checksums'
  & node (Join-Path $PSScriptRoot 'backup-storage.mjs') "--output=$backupDirectory" "--env-file=$EnvFile"
  if ($LASTEXITCODE -ne 0) { throw "Storage backup failed with exit code $LASTEXITCODE" }

  $files = Get-ChildItem -LiteralPath $backupDirectory -File |
    Where-Object { $_.Name -notin @('INCOMPLETE', 'backup-manifest.json') } |
    ForEach-Object {
    [ordered]@{ name = $_.Name; bytes = $_.Length; sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant() }
  }
  $storageManifest = Get-Content -Raw -LiteralPath (Join-Path $backupDirectory 'storage-manifest.json') | ConvertFrom-Json
  $manifest = [ordered]@{
    formatVersion = 1
    createdAt = (Get-Date).ToUniversalTime().ToString('o')
    sourceProjectRef = $storageManifest.projectRef
    databaseFormat = 'supabase-cli roles/schema/data SQL'
    storageObjects = @($storageManifest.objects).Count
    files = @($files)
  }
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $backupDirectory 'backup-manifest.json')
  Remove-Item -LiteralPath $incompleteMarker -Force
  Write-Host "Backup complete: $backupDirectory"
} catch {
  Write-Error "Backup is incomplete and must not be used for restore. $($_.Exception.Message)"
  throw
}
