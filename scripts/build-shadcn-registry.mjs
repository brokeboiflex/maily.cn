import fs from 'node:fs';
import path from 'node:path';
import { iconMap, iconMapMeta } from './icon-map.mjs';

const iconPlaceholderImport =
  'import { IconPlaceholder } from "@/components/icon-placeholder"';

// Accumulated icon-conversion data, populated during the build and emitted as a report.
const report = {
  files: [],
  totals: { converted: 0, preserved: 0, unmapped: 0, filesWithIcons: 0 },
};

const root = process.cwd();

const registryRoot = path.join(root, 'registry/default');
const itemRoot = path.join(registryRoot, 'maily');
const registryPath = path.join(root, 'registry.json');

const coreSourceDir = path.join(root, 'packages/core/src');
const renderSourceDir = path.join(root, 'packages/render/src');
const sharedSourceDir = path.join(root, 'packages/shared/src');

const coreOutDir = path.join(itemRoot, 'components/maily');
const renderOutDir = path.join(itemRoot, 'lib/maily-render');
const sharedOutDir = path.join(renderOutDir, 'shared');

const corePackagePath = path.join(root, 'packages/core/package.json');
const renderPackagePath = path.join(root, 'packages/render/package.json');
const sharedPackagePath = path.join(root, 'packages/shared/package.json');

// Modules the installed editor should resolve from the consumer's OWN shadcn
// files instead of bundling a private copy. Keyed by path relative to
// packages/core/src (no extension); the value is the literal import the
// consumer resolves through their components.json aliases.
//
// For each entry the build (a) excludes the source file from the emitted
// registry and (b) rewrites every import of it — `@/...` or relative — to the
// literal alias. The source file stays in packages/core for standalone builds;
// only the registry output defers to the consumer. (Same idea as the lucide →
// IconPlaceholder transform: don't hardcode a choice the consumer already owns.)
const EXTERNALIZED_MODULES = {
  // cn() — every shadcn project already ships an identical one at @/lib/utils.
  'editor/utils/classname': '@/lib/utils',
  // shadcn UI primitives the consumer already owns. The registry defers to the
  // consumer's stock components (installed via `registryDependencies`) instead
  // of bundling Maily forks; the source files stay for standalone package builds.
  'editor/components/base-button': '@/components/ui/button',
  'editor/components/input': '@/components/ui/input',
  'editor/components/textarea': '@/components/ui/textarea',
  'editor/components/ui/toggle': '@/components/ui/toggle',
  'editor/components/ui/toggle-group': '@/components/ui/toggle-group',
  'editor/components/ui/tooltip': '@/components/ui/tooltip',
  'editor/components/ui/divider': '@/components/ui/separator',
  'editor/components/ui/native-select': '@/components/ui/native-select',
  'editor/components/ui/kbd': '@/components/ui/kbd',
  'editor/components/ui/dropdown-menu': '@/components/ui/dropdown-menu',
  'editor/components/popover': '@/components/ui/popover',
  'editor/components/ui/tabs': '@/components/ui/tabs',
  'editor/components/ui/input-group': '@/components/ui/input-group',
  'editor/components/ui/command': '@/components/ui/command',
  'editor/components/ui/badge': '@/components/ui/badge',
};

// shadcn registry items the consumer must have for the externalized imports
// above to resolve. `shadcn add` installs these from the default registry.
const REGISTRY_DEPENDENCIES = [
  'button',
  'input',
  'textarea',
  'toggle',
  'toggle-group',
  'tooltip',
  'separator',
  'native-select',
  'kbd',
  'dropdown-menu',
  'popover',
  'tabs',
  'input-group',
  'command',
  'badge',
];

// These packages are implementation details of source files replaced by the
// consumer's stock shadcn primitives and must not leak into registry installs.
const EXTERNALIZED_PACKAGE_DEPENDENCIES = [
  '@radix-ui/react-slot',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  'cmdk',
];

function externalizedModuleKey(relativePosixPath) {
  return relativePosixPath.replace(/\.(tsx?|jsx?)$/, '');
}

// Tests are dev-only — never ship them into the installable registry (they also
// import vitest, which consumers don't have).
function isTestFile(relativePosixPath) {
  return /\.(test|spec)(-d)?\.(tsx?|jsx?)$/.test(relativePosixPath);
}

const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.json',
  '.md',
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return [fullPath];
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeRelativeImport(fromFile, toPath) {
  let relativePath = toPosix(path.relative(path.dirname(fromFile), toPath));

  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildIconPlaceholder(iconName, props = '') {
  const mapped = iconMap[iconName];

  if (!mapped) {
    throw new Error(
      [
        `Missing icon map for Lucide icon "${iconName}".`,
        '',
        'Add it to iconMap before building the registry.',
        'Do not guess names. Verify the icon names in each target icon package.',
      ].join('\n')
    );
  }

  const requiredKeys = [
    'lucide',
    'tabler',
    'hugeicons',
    'phosphor',
    'remixicon',
  ];

  for (const key of requiredKeys) {
    if (!mapped[key]) {
      throw new Error(`Icon "${iconName}" is missing "${key}" mapping.`);
    }
  }

  const normalizedProps = props.trim();

  return [
    '<IconPlaceholder',
    `  lucide="${mapped.lucide}"`,
    `  tabler="${mapped.tabler}"`,
    `  hugeicons="${mapped.hugeicons}"`,
    `  phosphor="${mapped.phosphor}"`,
    `  remixicon="${mapped.remixicon}"`,
    normalizedProps ? `  ${normalizedProps}` : '',
    '/>',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Insert an import statement at the top of a file, AFTER any "use client"/"use strict"
 * directives so that the directive remains the very first line.
 */
function insertImportAfterDirectives(content, importBlock) {
  const directiveRegex = /^((?:["'`]use\s+(?:client|strict)["'`];?\s*\n?)+)/;
  const match = content.match(directiveRegex);
  if (match) {
    const pos = match[0].length;
    return content.slice(0, pos) + importBlock + '\n' + content.slice(pos);
  }
  return importBlock + '\n' + content;
}

/**
 * Transform lucide-react icon imports into <IconPlaceholder> JSX elements.
 *
 * THREE categories of usage are handled per-file:
 *   1. JSX self-closing   (<IconName .../>)  → converted to <IconPlaceholder> when mapped
 *   2. Value reference    (icon: IconName)   → preserved (component type, not convertible)
 *   3. Type-only          (type LucideIcon)  → preserved as type-only import
 *
 * Aliased imports (X as Y) fail-closed with a clear error (no silent mis-transform).
 */
function transformLucideIconsToPlaceholders(content, filePath) {
  const lucideImportRegex =
    /import\s*{\s*([^}]+)\s*}\s*from\s*["']lucide-react["'];?\r?\n?/g;

  const typeSpecifiers = []; // e.g. ["LucideIcon"]
  const valueSpecifiers = []; // e.g. ["BoldIcon", "ChevronRight"]
  let hasLucideImport = false;

  // Remove ALL lucide-react imports; we reconstruct a reduced one below.
  let transformed = content.replace(lucideImportRegex, (_match, imports) => {
    hasLucideImport = true;
    imports
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        // Type-only specifier: `type LucideIcon`
        const typeMatch = item.match(/^type\s+(\w+)$/);
        if (typeMatch) {
          typeSpecifiers.push(typeMatch[1]);
          return;
        }

        // Aliased imports are not supported — fail closed.
        if (/\s+as\s+/i.test(item)) {
          throw new Error(
            `Aliased lucide-react import is not supported by the registry icon transformer: ${item}`
          );
        }

        valueSpecifiers.push(item);
      });

    return '';
  });

  if (!hasLucideImport) {
    return transformed;
  }

  const fileConverted = [];
  const filePreserved = [];
  const fileUnmapped = [];

  // Record type-only specifiers as preserved.
  for (const name of typeSpecifiers) {
    filePreserved.push({ name, reason: 'type-only' });
  }

  const specifiersToKeep = []; // value specifiers that stay in the reduced import
  let didConvert = false;

  for (const iconName of valueSpecifiers) {
    // Detect JSX self-closing usage: <IconName ... />
    const jsxRegex = new RegExp(`<${escapeRegex(iconName)}\\b([^>]*)\\/>`, 'g');
    const jsxMatches = transformed.match(jsxRegex);

    if (jsxMatches && jsxMatches.length > 0) {
      // Has JSX usage. Is it mapped?
      if (iconMap[iconName]) {
        // CONVERTIBLE — replace every JSX occurrence with IconPlaceholder.
        transformed = transformed.replace(jsxRegex, (_match, props) =>
          buildIconPlaceholder(iconName, props)
        );
        fileConverted.push(iconName);
        didConvert = true;

        // After replacement, does the bare identifier still appear OUTSIDE
        // IconPlaceholder attribute values AND string literals? (mixed usage)
        // We strip generated <IconPlaceholder .../> blocks and quoted strings so
        // that attribute values like lucide="Text" and titles like 'Text' don't
        // cause false positives.
        const withoutPlaceholders = transformed
          .replace(/<IconPlaceholder\b[\s\S]*?\/>/g, '')
          .replace(/"[^"]*"/g, '""')
          .replace(/'[^']*'/g, "''");
        const bareRegex = new RegExp(`\\b${escapeRegex(iconName)}\\b`);
        if (bareRegex.test(withoutPlaceholders)) {
          specifiersToKeep.push(iconName);
          filePreserved.push({
            name: iconName,
            reason: 'value-referenced (mixed JSX + value usage)',
          });
        }
      } else {
        // JSX usage but NOT in iconMap → unmapped, keep as lucide.
        specifiersToKeep.push(iconName);
        fileUnmapped.push(iconName);
      }
    } else {
      // No JSX usage. Is the identifier still referenced (value/destructure)?
      const bareRegex = new RegExp(`\\b${escapeRegex(iconName)}\\b`);
      if (bareRegex.test(transformed)) {
        specifiersToKeep.push(iconName);
        filePreserved.push({ name: iconName, reason: 'value-referenced' });
      }
      // else: dead import — strip silently.
    }
  }

  // Reconstruct the lucide-react import if any specifiers remain.
  const importParts = [];
  if (typeSpecifiers.length > 0) {
    importParts.push(...typeSpecifiers.map((s) => `type ${s}`));
  }
  importParts.push(...specifiersToKeep);

  // Build the combined import block (IconPlaceholder first, then lucide).
  const importLines = [];
  if (didConvert) {
    importLines.push(iconPlaceholderImport);
  }
  if (importParts.length > 0) {
    importLines.push(
      `import { ${importParts.join(', ')} } from "lucide-react"`
    );
  }
  if (importLines.length > 0) {
    transformed = insertImportAfterDirectives(
      transformed,
      importLines.join('\n')
    );
  }

  // Record report data for this file.
  if (
    fileConverted.length > 0 ||
    filePreserved.length > 0 ||
    fileUnmapped.length > 0
  ) {
    report.files.push({
      file: path.relative(root, filePath),
      converted: fileConverted,
      preserved: filePreserved,
      unmapped: fileUnmapped,
    });
    report.totals.converted += fileConverted.length;
    report.totals.preserved += filePreserved.length;
    report.totals.unmapped += fileUnmapped.length;
    report.totals.filesWithIcons += 1;
  }

  return transformed;
}

/**
 * Resolve an import specifier (alias `@/…` or relative `./…`/`../…`) to its
 * module path relative to coreOutDir, with the extension stripped. Returns null
 * for bare module specifiers (npm packages). `filePath` is the output path.
 */
function resolveCoreModule(filePath, specifier) {
  let absolute;
  if (specifier.startsWith('@/')) {
    absolute = path.join(coreOutDir, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    absolute = path.resolve(path.dirname(filePath), specifier);
  } else {
    return null;
  }

  return externalizedModuleKey(toPosix(path.relative(coreOutDir, absolute)));
}

function rewriteCoreImports(filePath, content) {
  const ext = path.extname(filePath);

  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return content;
  }

  let transformed = content.replace(
    /(["'])((?:@\/|\.\.?\/)[^"']+)\1/g,
    (match, quote, specifier) => {
      const moduleKey = resolveCoreModule(filePath, specifier);

      // Externalized module → emit the consumer-resolved alias literally.
      if (moduleKey && EXTERNALIZED_MODULES[moduleKey]) {
        return `${quote}${EXTERNALIZED_MODULES[moduleKey]}${quote}`;
      }

      // Internal `@/` alias → relative path within the installed maily tree.
      if (specifier.startsWith('@/')) {
        const absoluteTarget = path.join(coreOutDir, specifier.slice(2));
        const relativeTarget = makeRelativeImport(filePath, absoluteTarget);

        return `${quote}${relativeTarget}${quote}`;
      }

      // Relative import that isn't externalized — already correct, leave as-is.
      return match;
    }
  );

  transformed = transformLucideIconsToPlaceholders(transformed, filePath);

  return transformed;
}

function rewriteRenderImports(filePath, content) {
  const ext = path.extname(filePath);

  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return content;
  }

  return content.replace(
    /(["'])@maily-to\/shared(?:\/([^"']+))?\1/g,
    (_match, quote, subPath = '') => {
      const absoluteTarget = path.join(sharedOutDir, subPath);
      const relativeTarget = makeRelativeImport(filePath, absoluteTarget);

      return `${quote}${relativeTarget}${quote}`;
    }
  );
}

function copySource(sourceDir, outDir, rewrite, shouldSkip) {
  const sourceFiles = walk(sourceDir);

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(sourceDir, sourceFile);

    if (shouldSkip && shouldSkip(toPosix(relativePath))) {
      continue;
    }

    const targetFile = path.join(outDir, relativePath);
    const ext = path.extname(sourceFile);

    ensureDir(path.dirname(targetFile));

    if (textExtensions.has(ext)) {
      const source = fs.readFileSync(sourceFile, 'utf8');
      fs.writeFileSync(targetFile, rewrite(targetFile, source));
    } else {
      fs.copyFileSync(sourceFile, targetFile);
    }
  }
}

function addDeps(map, deps = {}) {
  for (const [name, version] of Object.entries(deps)) {
    if (name.startsWith('@maily-to/')) continue;
    if (name === 'tsconfig') continue;
    if (name === 'typescript') continue;
    if (name.startsWith('@types/')) continue;

    map.set(name, version);
  }
}

function dependencyList(map) {
  return [...map.entries()].map(([name, version]) => `${name}@${version}`);
}

function registryFiles() {
  const files = [];

  for (const file of walk(coreOutDir)) {
    const relativeToRoot = toPosix(path.relative(root, file));
    const relativeToCore = toPosix(path.relative(coreOutDir, file));

    files.push({
      path: relativeToRoot,
      type: 'registry:component',
      target: `@components/maily/${relativeToCore}`,
    });
  }

  for (const file of walk(renderOutDir)) {
    const relativeToRoot = toPosix(path.relative(root, file));
    const relativeToRender = toPosix(path.relative(renderOutDir, file));

    files.push({
      path: relativeToRoot,
      type: 'registry:lib',
      target: `@lib/maily-render/${relativeToRender}`,
    });
  }

  return files;
}

function buildRegistryJson() {
  const corePackage = readJson(corePackagePath);
  const renderPackage = readJson(renderPackagePath);
  const sharedPackage = readJson(sharedPackagePath);

  const dependencies = new Map();
  const devDependencies = new Map();

  addDeps(dependencies, corePackage.dependencies);
  addDeps(dependencies, renderPackage.dependencies);
  addDeps(dependencies, sharedPackage.dependencies);

  for (const name of EXTERNALIZED_PACKAGE_DEPENDENCIES) {
    dependencies.delete(name);
  }

  // packages/render/src imports this at runtime even though the package lists it as devDependency.
  if (renderPackage.devDependencies?.['@antfu/utils']) {
    dependencies.set(
      '@antfu/utils',
      renderPackage.devDependencies['@antfu/utils']
    );
  }

  const cssBuildDeps = ['@tailwindcss/typography', 'tw-animate-css'];

  for (const name of cssBuildDeps) {
    const version = corePackage.devDependencies?.[name];
    if (version) {
      devDependencies.set(name, version);
    }
  }

  const iconLibraryDeps = [
    'lucide-react',
    '@tabler/icons-react',
    '@hugeicons/react',
    '@hugeicons/core-free-icons',
    '@phosphor-icons/react',
    '@remixicon/react',
  ];

  for (const name of iconLibraryDeps) {
    dependencies.set(name, 'latest');
  }

  const registry = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'maily-prod-ready',
    homepage: 'https://github.com/brokeboiflex/maily.cn',
    items: [
      {
        name: 'maily',
        type: 'registry:block',
        title: 'Maily',
        description:
          'A local, shadcn-installable Maily email editor with HTML email rendering.',
        registryDependencies: REGISTRY_DEPENDENCIES,
        dependencies: dependencyList(dependencies),
        devDependencies: dependencyList(devDependencies),
        files: registryFiles(),
        // Maily is a plain-Tailwind shadcn component: it ships no stylesheet and
        // paints its chrome and canvas entirely with the consumer's shadcn theme
        // tokens. The only build requirement is the typography plugin, which
        // provides the `prose` utilities used by the editor content area. The
        // `css` key makes `shadcn add` wire it into the consumer's stylesheet.
        css: {
          '@plugin "@tailwindcss/typography"': {},
        },
        docs: [
          'Editor usage:',
          '',
          "import { Editor } from '@/components/maily'",
          '',
          'Maily ships no CSS — its chrome and canvas use your shadcn theme',
          'tokens directly. Ensure your app defines the standard shadcn tokens',
          '(--background, --foreground, --primary, --muted, --border, …) and has',
          'the Tailwind typography plugin enabled (added automatically on install',
          'via this item\'s `css`): @plugin "@tailwindcss/typography";',
          '',
          'Renderer usage:',
          '',
          "import { render } from '@/lib/maily-render'",
          '',
          'const html = await render(editorJson)',
        ].join('\n'),
      },
    ],
  };

  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
}

/**
 * Print the icon-conversion report to stdout and save it to
 * .sisyphus/evidence/icon-conversion-report.md.
 */
function writeIconReport() {
  const lines = [];
  lines.push('# Icon Conversion Report');
  lines.push('');
  lines.push(
    'Generated by `scripts/build-shadcn-registry.mjs` using `scripts/icon-map.mjs`.'
  );
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Files with icon imports: **${report.totals.filesWithIcons}**`);
  lines.push(
    `- Icons converted to IconPlaceholder: **${report.totals.converted}**`
  );
  lines.push(
    `- Icons preserved as lucide-react: **${report.totals.preserved}**`
  );
  lines.push(
    `- Icons unmapped (JSX, no iconMap entry): **${report.totals.unmapped}**`
  );
  lines.push(`- Total icons in iconMap: **${Object.keys(iconMap).length}**`);
  lines.push('');

  // Converted
  lines.push('## Converted');
  lines.push('');
  if (report.files.some((f) => f.converted.length > 0)) {
    for (const entry of report.files) {
      if (entry.converted.length === 0) continue;
      lines.push(`### \`${entry.file}\``);
      for (const name of entry.converted) {
        const m = iconMap[name];
        lines.push(
          `- ${name} → tabler:${m.tabler} | phosphor:${m.phosphor} | hugeicons:${m.hugeicons} | remixicon:${m.remixicon}`
        );
      }
      lines.push('');
    }
  } else {
    lines.push('_none_');
    lines.push('');
  }

  // Preserved
  lines.push('## Preserved (lucide-react retained)');
  lines.push('');
  if (report.files.some((f) => f.preserved.length > 0)) {
    for (const entry of report.files) {
      if (entry.preserved.length === 0) continue;
      lines.push(`### \`${entry.file}\``);
      for (const p of entry.preserved) {
        lines.push(`- ${p.name} — ${p.reason}`);
      }
      lines.push('');
    }
  } else {
    lines.push('_none_');
    lines.push('');
  }

  // Unmapped
  lines.push('## Unmapped (JSX usage, no iconMap entry — stays lucide-react)');
  lines.push('');
  const allUnmapped = report.files.flatMap((f) =>
    f.unmapped.map((name) => ({ name, file: f.file }))
  );
  if (allUnmapped.length > 0) {
    lines.push(
      'These icons are used as JSX but have no verified 5-library mapping:'
    );
    lines.push('');
    for (const u of allUnmapped) {
      const reason =
        iconMapMeta.notes.omitted[u.name] || 'No mapping available.';
      lines.push(`- ${u.name} (\`${u.file}\`) — ${reason}`);
    }
    lines.push('');
  } else {
    lines.push('_none_');
    lines.push('');
  }

  // Approximations
  if (Object.keys(iconMapMeta.notes.approximations).length > 0) {
    lines.push('## Conceptual Approximations');
    lines.push('');
    lines.push(
      'These mappings use the closest available icon (verified to exist) rather than an exact visual match:'
    );
    lines.push('');
    for (const [name, note] of Object.entries(
      iconMapMeta.notes.approximations
    )) {
      lines.push(`- ${name} — ${note}`);
    }
    lines.push('');
  }

  const reportText = lines.join('\n');

  // Print to stdout.
  console.log('');
  console.log(reportText);

  // Save to evidence directory.
  const evidenceDir = path.join(root, '.sisyphus/evidence');
  ensureDir(evidenceDir);
  fs.writeFileSync(
    path.join(evidenceDir, 'icon-conversion-report.md'),
    reportText + '\n'
  );
}

fs.rmSync(registryRoot, { recursive: true, force: true });
ensureDir(itemRoot);

copySource(
  coreSourceDir,
  coreOutDir,
  rewriteCoreImports,
  (relativePosixPath) =>
    isTestFile(relativePosixPath) ||
    Object.prototype.hasOwnProperty.call(
      EXTERNALIZED_MODULES,
      externalizedModuleKey(relativePosixPath)
    )
);
copySource(
  sharedSourceDir,
  sharedOutDir,
  (_filePath, content) => content,
  isTestFile
);
copySource(renderSourceDir, renderOutDir, rewriteRenderImports, isTestFile);

buildRegistryJson();

// ── Icon-conversion report ────────────────────────────────────────────────
writeIconReport();

console.log('Generated registry/default/maily and registry.json');
