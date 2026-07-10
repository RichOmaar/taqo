import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Next ignores stray lockfiles above the repo.
  outputFileTracingRoot: join(currentDir, '../..'),
  transpilePackages: ['@nexa/ui', '@nexa/types'],
};

export default nextConfig;
