import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(frontendDir, "..", "backend");

try {
  loadEnvConfig(backendDir);
} catch {
  // Ignore in production environments like Vercel where process.env is injected directly
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
