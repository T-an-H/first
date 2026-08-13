import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(serverDir, '..');

const envFiles = [
  resolve(projectDir, '.env.local'),
  resolve(projectDir, '.env'),
  resolve(serverDir, '.env.local'),
  resolve(serverDir, '.env'),
];

for (const envFile of envFiles) {
  try {
    process.loadEnvFile(envFile);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Failed to load env file: ${envFile}`, error);
    }
  }
}

function readWindowsEnv(name) {
  if (process.platform !== 'win32') {
    return '';
  }

  const script = [
    `$value = [Environment]::GetEnvironmentVariable('${name}', 'User')`,
    `if (-not $value) { $value = [Environment]::GetEnvironmentVariable('${name}', 'Machine') }`,
    `if ($value) { Write-Output $value }`,
  ].join('; ');

  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.status !== 0) {
    return '';
  }

  return result.stdout.trim();
}

// Some local Windows launches do not inherit user-level env vars consistently.
if (!process.env.DEEPSEEK_API_KEY?.trim()) {
  const deepSeekApiKey = readWindowsEnv('DEEPSEEK_API_KEY');
  if (deepSeekApiKey) {
    process.env.DEEPSEEK_API_KEY = deepSeekApiKey;
  }
}
