// Node 22.18+ strips types; resolve the same aliases and extensionless imports as Next.js.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) specifier = pathToFileURL(path.join(root, specifier.slice(2))).href;
    if ((specifier.startsWith('.') || specifier.startsWith('file:')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (url.protocol === 'file:' && !path.extname(url.pathname) && existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return nextResolve(specifier, context);
  },
});
