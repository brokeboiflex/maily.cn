import { Monitor, Moon, Sun } from "lucide-react"
import { type ThemeMode, useTheme } from "shadcn-theme-provider"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const MODES: ThemeMode[] = ["light", "dark", "system"]

const modeIcons: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const modeLabels: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
}

function formatThemeName(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-")
}

export function ThemeToggle() {
  const { mode, setMode, palette, setPalette, themes } = useTheme()

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => {
          if (value) setMode(value as ThemeMode)
        }}
        variant="outline"
        spacing={0}
        aria-label="Color mode"
      >
        {MODES.map((value) => {
          const Icon = modeIcons[value]
          return (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={modeLabels[value]}
            >
              <Icon />
              {modeLabels[value]}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <Select value={palette} onValueChange={setPalette}>
        <SelectTrigger className="w-44" aria-label="Color theme">
          <SelectValue>{formatThemeName(palette)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme} value={theme}>
              {formatThemeName(theme)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
