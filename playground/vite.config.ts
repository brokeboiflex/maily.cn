import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { getThemeScript } from "shadcn-theme-provider/script"
import { defineConfig } from "vite"

import { createThemeOptions } from "./src/theme.ts"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The resolved base (including a CLI --base) matches import.meta.env.BASE_URL.
  let resolvedBase = "/"
  return {
    base: mode === "github-pages" ? "/maily.cn/" : "/",
    plugins: [
      react(),
      tailwindcss(),
      {
        // Applies the stored mode and palette before the first paint; a
        // client-only app has no server-rendered script to do it.
        name: "theme-init-script",
        configResolved: (config) => {
          resolvedBase = config.base
        },
        transformIndexHtml: () => [
          {
            tag: "script",
            children: getThemeScript(createThemeOptions(resolvedBase)),
            injectTo: "head-prepend",
          },
        ],
      },
    ],
    // Pinned so the local shadcn registry URL in components.json stays stable.
    server: {
      port: 5173,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
