$ErrorActionPreference = 'Stop'

$serverDir = $PSScriptRoot
$nodeExe = 'C:\Program Files\nodejs\node.exe'
$stdout = Join-Path $serverDir 'codex-live-backend.out.log'
$stderr = Join-Path $serverDir 'codex-live-backend.err.log'

$key = $env:DEEPSEEK_API_KEY
if (-not $key) {
  $key = [Environment]::GetEnvironmentVariable('DEEPSEEK_API_KEY', 'User')
}
if (-not $key) {
  $key = [Environment]::GetEnvironmentVariable('DEEPSEEK_API_KEY', 'Machine')
}
if ($key) {
  $env:DEEPSEEK_API_KEY = $key
}

Set-Location -LiteralPath $serverDir
& $nodeExe index.js 1>> $stdout 2>> $stderr
