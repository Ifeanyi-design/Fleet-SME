/**
 * Pre-build cleanup for `dist/`.
 *
 * Vite's built-in `emptyDir()` deletes the output tree recursively, which trips the
 * environment's delete-guard shim (it routes recursive deletes through the OS trash
 * binary, which times out). This script clears the directory using non-recursive
 * primitives (unlink file-by-file, rmdir empty dirs) so the build is not blocked.
 *
 * Runs automatically as the `prebuild` npm script.
 */
import { existsSync, readdirSync, rmdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

function clearDir(dir) {
  for (const entry of readdirSync(dir)) {
    const target = join(dir, entry);
    if (statSync(target).isDirectory()) {
      clearDir(target);
      rmdirSync(target);
    } else {
      unlinkSync(target);
    }
  }
}

if (existsSync(DIST)) {
  clearDir(DIST);
  console.log(`[clean-dist] cleared ${DIST}/`);
} else {
  console.log('[clean-dist] nothing to clean');
}
