import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const scanRoots = [
  'packages/core/src',
  'registry/default/maily/components/maily',
].map((item) => path.join(root, item));

const primitiveImplementationFiles = new Set(
  [
    'packages/core/src/editor/components/base-button.tsx',
    'packages/core/src/editor/components/input.tsx',
    'packages/core/src/editor/components/textarea.tsx',
    'packages/core/src/editor/components/ui/input-group.tsx',
    'packages/core/src/editor/components/ui/select-primitive.tsx',
    'packages/core/src/editor/components/ui/toggle.tsx',
    'packages/core/src/editor/components/ui/toggle-group.tsx',
    'packages/core/src/editor/components/ui/attachment.tsx',
  ].map(toPosix)
);

const rawInteractivePattern =
  /<(?<tag>button|input|textarea|select)\b|role=["']button["']/g;
const handmadeInputChromePattern =
  /className=(?:"[^"]*(?:border-input[^"]*rounded|rounded[^"]*border-input)[^"]*"|'[^']*(?:border-input[^']*rounded|rounded[^']*border-input)[^']*'|\{`[^`]*(?:border-input[^`]*rounded|rounded[^`]*border-input)[^`]*`\})/g;
const manualStatePattern = /\bdata-state=(?:"[^"]+"|'[^']+'|\{[^}]+\})/g;
const radixOnlyMenuActionPattern = /<DropdownMenuItem\b[^>]*\bonSelect=/g;
const uiImportPattern = /from\s+['"]@\/components\/ui\/([^'"]+)['"]/g;

const dependencyNameByImport = new Map([
  ['button', 'button'],
  ['input', 'input'],
  ['textarea', 'textarea'],
  ['toggle', 'toggle'],
  ['toggle-group', 'toggle-group'],
  ['tooltip', 'tooltip'],
  ['separator', 'separator'],
  ['select', 'select'],
  ['kbd', 'kbd'],
  ['dropdown-menu', 'dropdown-menu'],
  ['popover', 'popover'],
  ['tabs', 'tabs'],
  ['input-group', 'input-group'],
  ['command', 'command'],
  ['badge', 'badge'],
  ['scroll-area', 'scroll-area'],
  ['attachment', 'attachment'],
  ['checkbox', 'checkbox'],
  ['dialog', 'dialog'],
  ['sheet', 'sheet'],
  ['avatar', 'avatar'],
  ['field', 'field'],
  ['label', 'label'],
  ['empty', 'empty'],
  ['calendar', 'calendar'],
]);

const findings = [];

for (const scanRoot of scanRoots) {
  if (!fs.existsSync(scanRoot)) continue;
  for (const file of walk(scanRoot)) {
    if (!/\.(tsx|ts)$/.test(file)) continue;
    auditFile(file);
  }
}

auditRegistryDependencies();

if (findings.length > 0) {
  console.error('\nshadcn primitive audit failed:\n');
  for (const finding of findings) {
    console.error(
      `- ${finding.file}:${finding.line} ${finding.rule}: ${finding.message}`
    );
  }
  console.error(
    '\nUse the host-owned shadcn primitive, or add a narrow `shadcn-audit-ignore-next-line <reason>` comment for intentional native document/file-input behavior.\n'
  );
  process.exit(1);
}

console.log('shadcn primitive audit passed');

function auditFile(file) {
  const relative = toPosix(path.relative(root, file));
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const isPrimitiveImplementation = primitiveImplementationFiles.has(relative);

  if (relative.endsWith('/mailbox/mailbox-view.tsx')) {
    scanPattern(
      /<(?:label|fieldset)\b|\bfunction\s+senderHue\b|\bbackgroundColor:\s*`hsl/g,
      content,
      lines,
      relative,
      'mailbox-display-primitive',
      () =>
        'Mailbox forms and avatars must compose host Field/Label/Avatar primitives and theme tokens.'
    );
  }

  if (!isPrimitiveImplementation) {
    scanPattern(
      radixOnlyMenuActionPattern,
      content,
      lines,
      relative,
      'radix-only-menu-action',
      () =>
        'Use onClick for DropdownMenuItem actions; Base UI does not invoke Radix onSelect. Both primitives route keyboard activation through click.'
    );
    scanPattern(
      rawInteractivePattern,
      content,
      lines,
      relative,
      'raw-native-control',
      (match) =>
        match[0].startsWith('role=')
          ? 'Use Button/buttonVariants instead of raw role="button".'
          : `Use the shadcn ${primitiveForTag(match.groups?.tag)} primitive instead of raw <${match.groups?.tag}>.`
    );

    scanPattern(
      handmadeInputChromePattern,
      content,
      lines,
      relative,
      'handmade-input-chrome',
      () =>
        'Input-looking chrome with border-input/rounded classes should compose Input, Textarea, or InputGroup.'
    );

    scanPattern(
      manualStatePattern,
      content,
      lines,
      relative,
      'manual-state-attribute',
      () =>
        'Use stateful shadcn primitives such as Toggle, ToggleGroup, Tabs, Popover, or DropdownMenu instead of manually assigning data-state.'
    );
  }
}

function auditRegistryDependencies() {
  const registryPath = path.join(root, 'registry.json');
  if (!fs.existsSync(registryPath)) return;

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const items = Array.isArray(registry.items) ? registry.items : [];

  for (const item of items) {
    const registryDependencies = new Set(item.registryDependencies ?? []);
    const imports = new Set();

    for (const file of item.files ?? []) {
      if (!/\.(tsx|ts)$/.test(file.path)) continue;

      const absolutePath = path.join(root, file.path);
      if (!fs.existsSync(absolutePath)) continue;

      const content = fs.readFileSync(absolutePath, 'utf8');
      for (const match of content.matchAll(uiImportPattern)) {
        const dependency = dependencyNameByImport.get(match[1]);
        if (dependency) imports.add(dependency);
      }
    }

    for (const dependency of imports) {
      if (!registryDependencies.has(dependency)) {
        findings.push({
          file: 'registry.json',
          line: 1,
          rule: 'missing-registry-dependency',
          message: `Registry item "${item.name}" imports @/components/ui/${dependency}, but registryDependencies does not include "${dependency}".`,
        });
      }
    }
  }

  // Dependencies follow emitted imports, checked per item above. An unused
  // externalization mapping must not force an unused primitive into every
  // consumer install.
}

function scanPattern(pattern, content, lines, relative, rule, messageForMatch) {
  pattern.lastIndex = 0;
  for (const match of content.matchAll(pattern)) {
    const line = lineForIndex(content, match.index ?? 0);
    if (hasIgnoreComment(lines, line)) continue;
    findings.push({
      file: relative,
      line,
      rule,
      message: messageForMatch(match),
    });
  }
}

function hasIgnoreComment(lines, lineNumber) {
  const previous = lines[lineNumber - 2] ?? '';
  return previous.includes('shadcn-audit-ignore-next-line');
}

function primitiveForTag(tag) {
  switch (tag) {
    case 'button':
      return 'Button';
    case 'input':
      return 'Input or InputGroupInput';
    case 'textarea':
      return 'Textarea or InputGroupTextarea';
    case 'select':
      return 'Select';
    default:
      return 'shadcn';
  }
}

function lineForIndex(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}
