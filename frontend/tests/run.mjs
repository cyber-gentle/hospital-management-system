import { build } from 'esbuild';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'hims-journey-'));
const outfile = join(directory, 'journey.test.cjs');
await build({ entryPoints: ['tests/journey.test.ts'], outfile, bundle: true, platform: 'node', format: 'cjs' });
const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
