import { build } from 'esbuild';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'hims-journey-'));
const outfile = join(directory, 'journey.test.cjs');
await build({ entryPoints: ['tests/journey.test.ts'], outfile, bundle: true, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_DEMO_MODE': '"true"' } });
const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
const productionFile = join(directory, 'production.test.cjs');
await build({ entryPoints: ['tests/production.test.ts'], outfile: productionFile, bundle: true, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_DEMO_MODE': '"false"' } });
const production = spawnSync(process.execPath, ['--test', productionFile], { stdio: 'inherit' });
if (production.status !== 0) process.exitCode = production.status ?? 1;
