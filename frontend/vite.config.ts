import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env=loadEnv(mode,process.cwd(),'');
  const core=env.CORE_API_URL || env.VITE_CORE_API_URL || 'http://localhost:8080';
  const interop=env.INTEROP_API_URL || env.VITE_INTEROP_API_URL || 'http://localhost:8000';
  return {
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      '^/api/v1/(laboratory|nhia|radiology)(/|$)': { target: interop, changeOrigin: true },
      // Directs API calls to the reverse proxy or Go core backend during local dev
      "/api": {
        target: core,
        changeOrigin: true,
      },
    },
  },
  };
});
