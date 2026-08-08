import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local API server defaults to 4000. Override with VITE_BACKEND_URL or BACKEND_PORT if needed.
const BACKEND =
  process.env.VITE_BACKEND_URL ||
  `http://localhost:${process.env.BACKEND_PORT || process.env.PORT || 4000}`;

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
