import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Read backend port from env — default 4000 (matches .env PORT)
const BACKEND = `http://localhost:${process.env.PORT || 4000}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api":      { target: BACKEND, changeOrigin: true, credentials: true },
      "/auth":     { target: BACKEND, changeOrigin: true, credentials: true },
      "/moderate": { target: BACKEND, changeOrigin: true, credentials: true },
    },
  },
  build: {
    outDir: "dist",
  },
});
