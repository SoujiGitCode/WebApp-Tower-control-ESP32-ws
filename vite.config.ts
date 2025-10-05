import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": "/src/components",
      "@views": "/src/views",
      "@context": "/src/context",
      "@assets": "/src/assets",
      "@api": "/src/api",
    },
  },
});
