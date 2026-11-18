import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // UI tests click through several steps; 5 s is too tight on slower machines
    testTimeout: 15000,
    pool: "vmThreads",
    maxWorkers: 1,
    server: { deps: { inline: ["@swc/helpers"] } },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
