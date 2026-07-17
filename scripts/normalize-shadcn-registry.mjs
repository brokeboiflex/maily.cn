import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const registryPath = path.join(root, "registry.json")

const shadcnSelectableIconDeps = new Set([
  "lucide-react",
  "@tabler/icons-react",
  "@hugeicons/react",
  "@hugeicons/core-free-icons",
  "@phosphor-icons/react",
  "@remixicon/react",
])

function parsePackageSpecifier(specifier) {
  if (specifier.startsWith("@")) {
    const separatorIndex = specifier.indexOf("@", 1)

    if (separatorIndex === -1) {
      return { name: specifier, version: undefined }
    }

    return {
      name: specifier.slice(0, separatorIndex),
      version: specifier.slice(separatorIndex + 1),
    }
  }

  const separatorIndex = specifier.indexOf("@")

  if (separatorIndex === -1) {
    return { name: specifier, version: undefined }
  }

  return {
    name: specifier.slice(0, separatorIndex),
    version: specifier.slice(separatorIndex + 1),
  }
}

function normalizeRegistryDependencies() {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"))

  for (const item of registry.items ?? []) {
    item.dependencies = (item.dependencies ?? []).filter((specifier) => {
      const { name } = parsePackageSpecifier(specifier)

      return !shadcnSelectableIconDeps.has(name)
    })
  }

  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
}

normalizeRegistryDependencies()

console.log("Normalized shadcn registry dependencies")
