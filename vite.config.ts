import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
    platform: "browser",
  },
  plugins: [svelte()],
});
