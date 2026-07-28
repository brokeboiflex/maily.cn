import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? "/maily.cn/" : "/",
  plugins: [react(), tailwindcss()],
  // Pinned so the local shadcn registry URL in components.json stays stable.
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
