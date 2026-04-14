import { build } from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Find all .ts files in src/ recursively
function findFiles(dir, ext) {
  let results = [];
  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    if (statSync(full).isDirectory()) {
      results = results.concat(findFiles(full, ext));
    } else if (file.endsWith(ext) && !file.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

const entryPoints = findFiles('src', '.ts');

await build({
  entryPoints,
  outdir: 'dist',
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: false,
  bundle: false, // Don't bundle — keep file structure matching src/
  logLevel: 'info',
});

console.log('Build complete!');
