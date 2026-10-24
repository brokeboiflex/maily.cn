import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "shadcn-theme-provider"

import "./index.css"
import App from "./App.tsx"
import { createThemeOptions } from "./theme"

// The init script in index.html (vite.config.ts) applies these before paint.
const themeOptions = createThemeOptions(import.meta.env.BASE_URL)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider {...themeOptions}>
      <App />
    </ThemeProvider>
  </StrictMode>
)
