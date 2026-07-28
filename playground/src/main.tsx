import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "shadcn-theme-provider"

import "./index.css"
import App from "./App.tsx"

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const themes = {
  default: publicAsset("themes/default.css"),
  corporate: publicAsset("themes/corporate.css"),
  marshmallow: publicAsset("themes/marshmallow.css"),
  "neo-brutalism": publicAsset("themes/neo-brutalism.css"),
  paper: publicAsset("themes/paper.css"),
  shadcn: publicAsset("themes/shadcn.css"),
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      themes={themes}
      defaultMode="system"
      defaultPalette="default"
    >
      <App />
    </ThemeProvider>
  </StrictMode>
)
