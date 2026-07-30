import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const registryOutput = path.join(root, 'playground/public/r');
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'maily-shadcn-consumers-')
);

const editorFixture = `import { Editor } from "@/components/maily"

export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Editor
        config={{ immediatelyRender: true }}
        contentJson={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Registry consumer test" }],
            },
          ],
        }}
      />
    </main>
  )
}
`;

const baseRuntimeFixture = `import { Editor } from "@/components/maily"
import {
  MailboxView,
  type MailyMailboxDataSource,
} from "@/components/maily/mailbox"

const dataSource: MailyMailboxDataSource = {
  listMessages: async () => ({ items: [], nextCursor: null }),
  getMessage: async () => {
    throw new Error("No message selected")
  },
  createDraft: async () => ({ id: "draft-1" }),
  updateDraft: async (id) => ({ id }),
  discardDraft: async () => undefined,
  sendDraft: async () => undefined,
}

export default function App() {
  return (
    <main className="grid gap-8 p-6">
      <section data-testid="editor">
        <Editor
          config={{ immediatelyRender: true }}
          contentJson={{
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Base UI runtime test" }],
              },
            ],
          }}
        />
      </section>
      <section data-testid="mailbox">
        <MailboxView
          account={{ address: "studio@maily.cn", displayName: "Maily Studio" }}
          dataSource={dataSource}
          pollIntervalMs={0}
        />
      </section>
    </main>
  )
}
`;

let server;

try {
  server = await startRegistryServer();
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the registry test server port.');
  }

  const registryTemplate = `http://127.0.0.1:${address.port}/{name}.json`;

  const radixProject = await createConsumer('radix', 'radix', registryTemplate);
  await addRegistryItems(radixProject, [
    '@maily/maily-editor',
    '@maily/maily-mailbox',
    '@maily/maily-render',
  ]);
  await writeEditorFixture(radixProject);
  await runProjectCommand(radixProject, ['run', 'build']);
  console.log('Radix full granular consumer passed');

  const baseProject = await createConsumer('base', 'base', registryTemplate);
  await addRegistryItems(baseProject, ['@maily/maily-editor']);
  await writeEditorFixture(baseProject);
  await runProjectCommand(baseProject, ['run', 'build']);
  console.log('Base editor consumer passed');

  await addRegistryItems(baseProject, [
    '@maily/maily-mailbox',
    '@maily/maily-render',
  ]);
  await writeBaseRuntimeFixture(baseProject);
  await verifyBaseFullConsumer(baseProject);
  await verifyBaseRuntime(baseProject);
  console.log('Base full granular consumer passed');
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

async function createConsumer(name, base, registryTemplate) {
  await run('pnpm', [
    'dlx',
    'shadcn@latest',
    'init',
    '-t',
    'vite',
    '-n',
    name,
    '--base',
    base,
    '--no-monorepo',
    '-p',
    'nova',
    '-y',
    '--cwd',
    tempRoot,
  ]);

  const project = path.join(tempRoot, name);
  const componentsPath = path.join(project, 'components.json');
  const components = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));
  components.registries = {
    ...(components.registries ?? {}),
    '@maily': registryTemplate,
  };
  fs.writeFileSync(componentsPath, `${JSON.stringify(components, null, 2)}\n`);

  return project;
}

async function addRegistryItems(project, items) {
  await run('pnpm', [
    'dlx',
    'shadcn@latest',
    'add',
    ...items,
    '--overwrite',
    '-y',
    '--cwd',
    project,
  ]);
}

async function writeEditorFixture(project) {
  fs.writeFileSync(path.join(project, 'src/App.tsx'), editorFixture);
}

async function writeBaseRuntimeFixture(project) {
  fs.writeFileSync(path.join(project, 'src/App.tsx'), baseRuntimeFixture);
}

async function verifyBaseFullConsumer(project) {
  const strictResult = await runProjectCommand(project, ['run', 'build'], {
    allowFailure: true,
  });

  if (strictResult.code === 0) return;

  const output = `${strictResult.stdout}\n${strictResult.stderr}`;
  const diagnosticLines = output
    .split(/\r?\n/)
    .filter((line) => /error TS\d+:/.test(line));
  const knownUpstreamError =
    /^src\/components\/ui\/scroll-area\.tsx\(1,1\): error TS6133: 'React' is declared but its value is never read\.$/;

  if (
    diagnosticLines.length !== 1 ||
    !knownUpstreamError.test(diagnosticLines[0])
  ) {
    throw new Error(
      `Base full consumer has unexpected strict diagnostics:\n${output}`
    );
  }

  console.warn(
    'Current shadcn Base scroll-area has its known unused React import; running the full Maily type/build gate with only unused-local checks relaxed.'
  );

  await runProjectCommand(project, [
    'exec',
    'tsc',
    '-p',
    'tsconfig.app.json',
    '--noEmit',
    '--noUnusedLocals',
    'false',
    '--noUnusedParameters',
    'false',
  ]);
  await runProjectCommand(project, ['exec', 'vite', 'build']);
}

async function verifyBaseRuntime(project) {
  await run('pnpm', ['add', '-D', '@playwright/test@1.55.0'], {
    cwd: project,
  });
  await runProjectCommand(project, [
    'exec',
    'playwright',
    'install',
    'chromium',
  ]);

  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const testsDir = path.join(project, 'tests');
  const testPath = path.join(testsDir, 'maily-runtime.spec.ts');
  fs.mkdirSync(testsDir, { recursive: true });
  fs.writeFileSync(
    testPath,
    `import { expect, test } from "@playwright/test"

test("inherits current Base UI primitive behavior", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await page.goto("${baseUrl}")

  const editor = page.getByTestId("editor")
  const alignLeft = editor.locator('[aria-label="Align Left"]')
  const alignCenter = editor.locator('[aria-label="Align Center"]')
  await expect(alignLeft).toHaveCount(1)
  await expect(alignCenter).toHaveCount(1)

  await alignLeft.focus()
  await page.keyboard.press("ArrowRight")
  await expect(alignCenter).toBeFocused()
  await alignCenter.click()
  await expect(alignCenter).toHaveAttribute("aria-pressed", "true")

  await editor.locator('[aria-label="External URL"]').click()
  const linkInput = page.getByRole("combobox")
  await expect(linkInput).toBeVisible()
  await expect(linkInput).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(linkInput).toBeHidden()

  const mailbox = page.getByTestId("mailbox")
  await mailbox.getByRole("button", { name: "New message" }).click()
  const richMode = mailbox.getByRole("button", { name: "Maily editor" })
  await expect(richMode).toHaveCount(1)
  await richMode.click()
  await expect(richMode).toHaveAttribute("aria-pressed", "true")
  await expect(mailbox.locator('[contenteditable="true"]')).toHaveCount(1)

  await expect(page.locator("button button")).toHaveCount(0)
  expect(errors).toEqual([])
})
`
  );

  const preview = spawn(
    'pnpm',
    [
      'exec',
      'vite',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: project,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  preview.stdout.on('data', (chunk) => process.stdout.write(chunk));
  preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForHttp(baseUrl, preview);
    await runProjectCommand(project, [
      'exec',
      'playwright',
      'test',
      testPath,
      '--reporter=line',
      '--workers=1',
    ]);
  } finally {
    preview.kill('SIGTERM');
    await new Promise((resolve) => {
      if (preview.exitCode !== null) {
        resolve();
        return;
      }
      preview.once('close', resolve);
    });
  }
}

async function runProjectCommand(project, args, options = {}) {
  const command = fs.existsSync(path.join(project, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : 'npm';

  return run(command, args, { cwd: project, ...options });
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const portServer = net.createServer();
    portServer.once('error', reject);
    portServer.listen(0, '127.0.0.1', () => {
      const address = portServer.address();
      if (!address || typeof address === 'string') {
        portServer.close();
        reject(new Error('Could not reserve a Base runtime test port.'));
        return;
      }
      const { port } = address;
      portServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForHttp(url, child) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Base runtime preview exited early with code ${child.exitCode}.`
      );
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for Base runtime preview at ${url}.`);
}

function startRegistryServer() {
  return new Promise((resolve, reject) => {
    const nextServer = http.createServer((request, response) => {
      const requestPath = decodeURIComponent(
        new URL(request.url ?? '/', 'http://127.0.0.1').pathname
      );
      const fileName = path.basename(requestPath);
      const filePath = path.join(registryOutput, fileName);

      if (!fileName.endsWith('.json') || !fs.existsSync(filePath)) {
        response.writeHead(404).end('Not found');
        return;
      }

      response.setHeader('Content-Type', 'application/json');
      fs.createReadStream(filePath).pipe(response);
    });

    nextServer.once('error', reject);
    nextServer.listen(0, '127.0.0.1', () => resolve(nextServer));
  });
}

function run(command, args, options = {}) {
  const { allowFailure = false, cwd = root } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.once('error', reject);
    child.once('close', (code) => {
      const result = { code: code ?? 1, stdout, stderr };

      if (result.code !== 0 && !allowFailure) {
        reject(
          new Error(
            `${command} ${args.join(' ')} failed with exit code ${result.code}`
          )
        );
        return;
      }

      resolve(result);
    });
  });
}
