import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three/webgpu is only loaded when the WebGPU backend is picked.
    chunkSizeWarningLimit: 1200,
  },
});
