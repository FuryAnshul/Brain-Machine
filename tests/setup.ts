import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = process.cwd();

export const jiti = require('jiti')(rootDir, {
  alias: {
    '@': path.resolve(rootDir, 'src'),
  },
  interopDefault: true,
});

