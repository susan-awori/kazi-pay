import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/notification": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/escrow/mpesa-callback": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
