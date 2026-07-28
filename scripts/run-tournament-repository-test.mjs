import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const buildDirectory = resolve(projectRoot, '.repository-test-build');
const typeScriptCompiler = resolve(
  projectRoot,
  'node_modules',
  'typescript',
  'bin',
  'tsc'
);

// Use Node's filesystem API instead of platform-specific shell commands
// such as `rm`, so this test runs the same way on Windows, macOS, and Linux.
rmSync(buildDirectory, {
  recursive: true,
  force: true,
});

const compileResult = spawnSync(
  process.execPath,
  [
    typeScriptCompiler,
    '--ignoreConfig',
    '--ignoreDeprecations',
'6.0',
    'src/storage/tournamentRepositoryCore.ts',
    '--target',
    'ES2022',
    '--module',
    'ES2022',
    '--moduleResolution',
    'Node',
    '--outDir',
    '.repository-test-build',
    '--skipLibCheck',
  ],
  {
    cwd: projectRoot,
    stdio: 'inherit',
  }
);

if (compileResult.error) {
  console.error('Unable to start the TypeScript compiler.');
  console.error(compileResult.error.message);
  process.exit(1);
}

if (compileResult.status !== 0) {
  process.exit(compileResult.status ?? 1);
}

await import(
  pathToFileURL(resolve(projectRoot, 'scripts/test-tournament-repository.mjs')).href
);
