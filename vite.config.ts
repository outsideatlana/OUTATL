import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  cacheDir: ".vite-cache",
  plugins: [react(), tailwindcss(), tsconfigPaths({ projects: ["./tsconfig.json"] })],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "localhost",
    port: 5173,
  },
});
