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

const prProductionFile = join(directory, 'pr-production.test.cjs');
await build({ entryPoints: ['tests/pr-production.test.ts'], outfile: prProductionFile, bundle: true, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_DEMO_MODE': '"false"' } });
const prProduction = spawnSync(process.execPath, ['--test', prProductionFile], { stdio: 'inherit' });
if (prProduction.status !== 0) process.exitCode = prProduction.status ?? 1;

const prDemoFile = join(directory, 'pr-demo.test.cjs');
await build({ entryPoints: ['tests/pr-demo.test.ts'], outfile: prDemoFile, bundle: true, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_DEMO_MODE': '"true"' } });
const prDemo = spawnSync(process.execPath, ['--test', prDemoFile], { stdio: 'inherit' });
if (prDemo.status !== 0) process.exitCode = prDemo.status ?? 1;
