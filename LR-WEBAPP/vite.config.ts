import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Support dev proxying to the local API server if a port is configured
const apiPort = process.env.API_PORT || "5000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
