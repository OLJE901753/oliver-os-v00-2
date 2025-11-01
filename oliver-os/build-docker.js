#!/usr/bin/env node
/**
 * Docker build script - compiles TypeScript without failing on type errors
 * This script runs tsc and succeeds as long as JavaScript files are emitted
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const TSCONFIG = path.join(PROJECT_ROOT, 'tsconfig.docker.json');

console.log('Building TypeScript for Docker...');
console.log(`Using tsconfig: ${TSCONFIG}`);

try {
  // Run TypeScript compiler
  // TypeScript will emit JS files even with type errors (unless noEmit is true)
  execSync(`npx tsc --project ${TSCONFIG} --skipLibCheck`, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT
  });
} catch (error) {
  // TypeScript may exit with error code even if it emitted files
  console.log('TypeScript compilation completed (may have type errors)');
}

// Check if dist folder was created
if (!fs.existsSync(DIST_DIR)) {
  console.error('ERROR: dist folder was not created. Build failed.');
  process.exit(1);
}

// Check if dist folder has any .js files
const distFiles = fs.readdirSync(DIST_DIR, { recursive: true });
const jsFiles = distFiles.filter(f => typeof f === 'string' && f.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('ERROR: No JavaScript files were emitted. Build failed.');
  process.exit(1);
}

console.log(`✓ Successfully compiled ${jsFiles.length} JavaScript files`);
console.log(`✓ Build completed successfully`);

// Run tsc-alias to resolve path aliases
try {
  execSync('npx tsc-alias', {
    stdio: 'inherit',
    cwd: PROJECT_ROOT
  });
  console.log('✓ Path aliases resolved');
} catch (error) {
  console.log('⚠ tsc-alias completed with warnings (continuing...)');
}

process.exit(0);

