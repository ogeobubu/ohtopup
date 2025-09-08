import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(import.meta.url), "../index.html"),
      },
    },
    // Copy static files to build directory
    assetsDir: "assets",
    outDir: "dist",
  },
  publicDir: resolve(fileURLToPath(import.meta.url), "../public"),
});