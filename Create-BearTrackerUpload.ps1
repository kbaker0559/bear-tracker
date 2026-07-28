$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$parentFolder = Split-Path -Parent $projectRoot
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
$tempFolder = Join-Path $env:TEMP "bear-tracker-upload-$timestamp"
$zipPath = Join-Path $parentFolder "bear-tracker-upload-$timestamp.zip"

if (Test-Path $tempFolder) {
  Remove-Item $tempFolder -Recurse -Force
}
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $tempFolder | Out-Null

$excludedDirectories = @('.git', 'node_modules', 'dist')
$excludedFiles = @('.env.local', '*.zip')

$robocopyArgs = @(
  $projectRoot,
  $tempFolder,
  '/E',
  '/R:1',
  '/W:1',
  '/NFL',
  '/NDL',
  '/NJH',
  '/NJS',
  '/NP',
  '/XD'
) + $excludedDirectories + @('/XF') + $excludedFiles

& robocopy @robocopyArgs | Out-Null
$robocopyCode = $LASTEXITCODE
if ($robocopyCode -ge 8) {
  throw "Could not copy the project files. Robocopy exit code: $robocopyCode"
}

# Defense in depth: remove any secret environment file regardless of where it was placed.
$secretFiles = Get-ChildItem -Path $tempFolder -Recurse -Force -File |
  Where-Object { $_.Name -eq '.env.local' -or $_.Name -like '.env.*.local' }
$removedSecretCount = @($secretFiles).Count
$secretFiles | Remove-Item -Force

Compress-Archive -Path (Join-Path $tempFolder '*') -DestinationPath $zipPath -CompressionLevel Optimal
Remove-Item $tempFolder -Recurse -Force

Write-Host ''
Write-Host 'Bear Tracker upload package created successfully.' -ForegroundColor Green
Write-Host "File: $zipPath"
Write-Host ''
Write-Host 'Excluded:'
Write-Host '  - .git'
Write-Host '  - node_modules'
Write-Host '  - dist'
Write-Host "  - .env.local files ($removedSecretCount found after copy)"
Write-Host '  - existing ZIP files'
Write-Host ''
Write-Host 'You can now upload the ZIP shown above.' -ForegroundColor Cyan
