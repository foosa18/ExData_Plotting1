import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the same build works on a web host, inside a sub-path, and inside the Capacitor shell.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: false },
});
