/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

// App version for the footer, from package.json at build time (never typed by hand).
const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string };

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // A30 (Q-B31): the test server sends no CORS headers, so `npm run dev:integration` proxies /api to it.
  // The target lives only in the git-ignored .env.<mode>.local file, never in the repository.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const proxyTarget = env.VITE_API_PROXY_TARGET;
  return {
    plugins: [react()],
    // Port 3000 is the allowed Google JavaScript origin (Q-B28); strictPort fails instead of moving to another port.
    server: {
      port: 3000,
      strictPort: true,
      ...(proxyTarget ? { proxy: { "/api": { target: proxyTarget, changeOrigin: true } } } : {}),
    },
    appType: "spa",
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
    },
  };
});
