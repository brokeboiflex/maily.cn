// Loads every runtime entry of the package in the current directory through
// both `import` and `require`. Type checks (attw, publint) cannot see interop
// mistakes such as a CommonJS bundle reading `.default` from a dual package.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const packageDir = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')
);
const require = createRequire(path.join(packageDir, 'package.json'));

function runtimeTarget(condition) {
  if (typeof condition === 'string') return condition;
  return condition?.default;
}

const failures = [];
let loaded = 0;
for (const [subpath, conditions] of Object.entries(manifest.exports ?? {})) {
  if (subpath === './package.json' || typeof conditions !== 'object') continue;
  for (const kind of ['import', 'require']) {
    const target = runtimeTarget(conditions[kind]);
    if (!target) continue;
    const file = path.join(packageDir, target);
    try {
      const entry =
        kind === 'import'
          ? await import(pathToFileURL(file).href)
          : require(file);
      if (!Object.keys(entry).length) throw new Error('exports nothing');
      loaded += 1;
    } catch (error) {
      failures.push(`${manifest.name}${subpath.slice(1)} (${kind}): ${error}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${manifest.name}: ${loaded} runtime entries load`);
