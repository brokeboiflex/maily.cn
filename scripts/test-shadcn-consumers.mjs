import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
// Keep in step with .github/workflows/registry-consumers.yml and the playground.
const PLAYWRIGHT_VERSION = '1.64.1';
const registryOutput = path.join(root, 'playground/public/r');
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'maily-shadcn-consumers-')
);
const commandEnv = {
  ...process.env,
  npm_config_ignore_workspace_root_check: 'true',
};

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

const baseRuntimeFixture = `import { useEffect, useState } from "react"
import { Editor, fontsourceFontProvider } from "@/components/maily"
import { ImageUploadExtension } from "@/components/maily/extensions"
import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxDraftCapabilities,
  type MailyMailboxMessageDetail,
} from "@/components/maily/mailbox"

declare global {
  interface Window {
    mailyTestEditor: import("@tiptap/core").Editor
    mailyUploadCalls: number
    mailyDiscardCalls: number
    mailyFinishUpload: () => void
    mailyDraftCalls: string[]
    mailySetDraftCapabilities: (capabilities: MailyMailboxDraftCapabilities) => void
  }
}

window.mailyUploadCalls = 0
window.mailyDiscardCalls = 0
window.mailyDraftCalls = []
const uploadedImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII="
const uploadExtension = ImageUploadExtension.configure({
  onImageUpload: async () => {
    window.mailyUploadCalls += 1
    return new Promise<string>((resolve) => {
      window.mailyFinishUpload = () => resolve(uploadedImage)
    })
  },
  onImageUploadDiscard: async () => {
    window.mailyDiscardCalls += 1
  },
})

const message: MailyMailboxMessageDetail = {
  id: "attachment-message",
  direction: "in",
  fromAddress: "sender@example.com",
  toAddresses: ["studio@maily.cn"],
  subject: "Attachment compatibility",
  status: "sent",
  createdAt: "2026-09-14T10:00:00Z",
  bodyText: "The attachment is available below.",
  hasAttachments: true,
  attachments: [{ id: "part-1", filename: "report.txt", contentType: "text/plain", size: 7 }],
}

let mailboxLabels = [{ id: "projects", name: "Projects" }]

const dataSource: MailyMailboxDataSource = {
  listLabels: async () => mailboxLabels,
  createLabel: async (name) => {
    const label = { id: name.toLowerCase(), name }
    mailboxLabels = [...mailboxLabels, label]
    return label
  },
  renameLabel: async (id, name) => {
    mailboxLabels = mailboxLabels.map((label) => label.id === id ? { id, name } : label)
    return { id, name }
  },
  runBulkMessageAction: async () => undefined,
  listMessages: async () => ({ items: [message], nextCursor: null }),
  getMessage: async () => message,
  downloadAttachment: async ({ messageId, attachment, attachmentIndex }) => {
    if (messageId !== message.id || attachment.id !== "part-1" || attachmentIndex !== 0) {
      throw new Error("Wrong attachment requested")
    }
    const url = URL.createObjectURL(new Blob(["report\\n"], { type: attachment.contentType }))
    const link = document.createElement("a")
    link.href = url
    link.download = attachment.filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  createDraft: async () => ({ id: "draft-1" }),
  updateDraft: async (id) => ({ id }),
  discardDraft: async () => undefined,
  sendDraft: async () => undefined,
}

const savedDraft: MailyMailboxMessageDetail = {
  id: "saved-draft",
  direction: "out",
  fromAddress: "studio@maily.cn",
  toAddresses: ["client@example.com"],
  subject: "Prepared draft",
  status: "draft",
  createdAt: "2026-10-22T10:00:00Z",
  bodyText: "Prepared body",
  _revision: "v1",
}

// A read-only adapter compiles without draft callbacks or casts.
const readOnlySource: MailyMailboxDataSource = {
  listMessages: async ({ folder }) => ({
    items: folder === "drafts" ? [savedDraft] : [message],
    nextCursor: null,
  }),
  getMessage: async (id) => (id === message.id ? message : { ...savedDraft, id }),
}

const capabilitySource: MailyMailboxDataSource = {
  ...readOnlySource,
  createDraft: async (draft) => {
    window.mailyDraftCalls.push("create:" + (draft.subject ?? ""))
    return { id: "created-draft", _revision: "c1" }
  },
  updateDraft: async (id, draft) => {
    window.mailyDraftCalls.push(
      "update:" + id + ":" + (draft.subject ?? "") + ":" + (draft.text ?? "")
    )
    return { id, _revision: "u1" }
  },
  sendDraft: async (id) => {
    window.mailyDraftCalls.push("send:" + id)
  },
  discardDraft: async (id) => {
    window.mailyDraftCalls.push("discard:" + id)
  },
}

function CapabilityMailbox() {
  const [draftCapabilities, setDraftCapabilities] =
    useState<MailyMailboxDraftCapabilities>({ send: false, discard: false })
  useEffect(() => {
    window.mailySetDraftCapabilities = setDraftCapabilities
  }, [])
  return (
    <MailboxView
      account={{ id: "capability-account", address: "studio@maily.cn" }}
      dataSource={capabilitySource}
      draftCapabilities={draftCapabilities}
      autosaveDelayMs={1000}
    />
  )
}

export default function App() {
  return (
    <main className="grid gap-8 p-6">
      <section data-testid="editor">
        <Editor
          config={{ immediatelyRender: true }}
          fontProvider={fontsourceFontProvider}
          extensions={[uploadExtension]}
          onCreate={(editor) => { window.mailyTestEditor = editor }}
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
        />
      </section>
      <section data-testid="readonly-mailbox">
        <MailboxView dataSource={readOnlySource} />
      </section>
      <section data-testid="capability-mailbox">
        <CapabilityMailbox />
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
  await writeBaseRuntimeFixture(radixProject);
  await runProjectCommand(radixProject, ['run', 'build']);
  await verifyConsumerLint(radixProject);
  await verifyConsumerRuntime(radixProject, 'radix');
  console.log('Radix full granular consumer passed');

  const baseProject = await createConsumer('base', 'base', registryTemplate);
  await addRegistryItems(baseProject, ['@maily/maily-editor']);
  await writeEditorFixture(baseProject);
  await runProjectCommand(baseProject, ['run', 'build']);
  await verifyConsumerLint(baseProject);
  console.log('Base editor consumer passed');

  await addRegistryItems(baseProject, [
    '@maily/maily-mailbox',
    '@maily/maily-render',
  ]);
  await writeBaseRuntimeFixture(baseProject);
  await verifyBaseFullConsumer(baseProject);
  await verifyConsumerLint(baseProject);
  await verifyConsumerRuntime(baseProject, 'base');
  console.log('Base full granular consumer passed');

  const bunProject = await createBunConsumer('bun', 'radix', registryTemplate);
  await addBunRegistryItems(bunProject, [
    '@maily/maily-editor',
    '@maily/maily-mailbox',
  ]);
  const installedMailbox = fs.readFileSync(
    path.join(bunProject, 'src/components/maily/mailbox/mailbox-view.tsx'),
    'utf8'
  );
  for (const expected of [
    '@/custom/ui/avatar',
    '@/custom/ui/field',
    '@/custom/ui/empty',
  ]) {
    if (!installedMailbox.includes(expected))
      throw new Error(`Consumer alias was not inherited: ${expected}`);
  }
  // Like stock shadcn items, Maily imports cn from the `cn` package rather
  // than through the consumer's utils alias.
  if (!/from ["']cn["']/.test(installedMailbox))
    throw new Error('Mailbox does not import cn from the cn package.');
  await writeBaseRuntimeFixture(bunProject);
  await runProjectCommand(bunProject, ['run', 'build']);
  await verifyConsumerLint(bunProject);
  console.log('Bun isolated full granular consumer passed');
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

async function createBunConsumer(name, base, registryTemplate) {
  await run('bunx', [
    '--bun',
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
  // Exercise consumer alias rewriting instead of only the default @/components/ui.
  components.aliases.ui = '@/custom/ui';
  components.registries = {
    ...(components.registries ?? {}),
    '@maily': registryTemplate,
  };
  fs.writeFileSync(componentsPath, `${JSON.stringify(components, null, 2)}\n`);

  return project;
}

async function addBunRegistryItems(project, items) {
  await run('bunx', [
    '--bun',
    'shadcn@latest',
    'add',
    ...items,
    '--overwrite',
    '-y',
    '--cwd',
    project,
  ]);
  await run('bun', ['install', '--linker', 'isolated'], { cwd: project });
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
    /^src\/components\/ui\/scroll-area\.tsx\(\d+,1\): error TS6133: 'React' is declared but its value is never read\.$/;

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

async function verifyConsumerRuntime(project, primitiveBase) {
  await run('pnpm', ['add', '-D', `@playwright/test@${PLAYWRIGHT_VERSION}`], {
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
import { readFile } from "node:fs/promises"

test("paste uploads survive public editor menu registration", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("${baseUrl}")
  const surface = page.getByTestId("editor").locator('[contenteditable="true"]')
  await surface.click()
  await surface.evaluate((element) => {
    const clipboardData = new DataTransfer()
    const png = atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=")
    clipboardData.items.add(new File([Uint8Array.from(png, (character) => character.charCodeAt(0))], "paste.png", { type: "image/png" }))
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }))
  })
  const placeholder = surface.locator('img[src^="blob:"]')
  await expect(placeholder).toBeVisible()
  await expect.poll(async () => {
    return placeholder.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)
  }).toBe(true)
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole("button", { name: "Insert block", exact: true })).toBeVisible()
  await page.evaluate(() => window.mailyFinishUpload())
  await expect.poll(async () => {
    return page.evaluate(() => JSON.stringify(window.mailyTestEditor.getJSON()))
  }).toContain("data:image/png;base64,")
  const result = await page.evaluate(() => ({
    json: JSON.stringify(window.mailyTestEditor.getJSON()),
    uploads: window.mailyUploadCalls,
    discards: window.mailyDiscardCalls,
  }))
  expect(result.json).not.toContain("blob:")
  expect(result.uploads).toBe(1)
  expect(result.discards).toBe(0)
  expect(errors).toEqual([])
})

test("mobile editor uses real blocks and preserves content across breakpoints", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("${baseUrl}")
  const surface = page.getByTestId("editor").locator('[contenteditable="true"]')
  await surface.click()
  await surface.press("ControlOrMeta+A")
  await surface.pressSequentially("Mobile editing")
  await expect(surface).toHaveText("Mobile editing")
  const toolbar = page.getByRole("toolbar", { name: "Editing tools" })
  const originalToolbar = await toolbar.elementHandle()
  const insertTrigger = page.getByRole("button", { name: "Insert block", exact: true })
  const originalInsert = await insertTrigger.elementHandle()
  await page.getByRole("button", { name: "Insert block", exact: true }).click()
  const picker = page.getByRole("region", { name: "Insert block", exact: true })
  await expect(picker.getByRole("button", { name: "Heading 2", exact: true })).toBeVisible()
  expect(await originalToolbar!.evaluate((element) => element.isConnected)).toBe(true)
  expect(await originalInsert!.evaluate((element) => element.isConnected)).toBe(true)
  await expect(toolbar).toHaveCount(1)
  await picker.getByRole("button", { name: "Heading 2", exact: true }).click()
  await expect(surface.locator("h2")).toHaveText("Mobile editing")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(surface.locator("h2")).toHaveCount(0)
  await expect(surface).toContainText("Mobile editing")
  await page.getByRole("button", { name: "Insert block", exact: true }).click()
  await picker.getByRole("button", { name: "Headers", exact: true }).click()
  await expect(picker.getByRole("button", { name: "Back", exact: true })).toBeVisible()
  await insertTrigger.click({ clickCount: 3, delay: 20 })
  await expect(picker.getByRole("button", { name: "Back", exact: true })).toBeVisible()
  expect(await originalToolbar!.evaluate((element) => element.isConnected)).toBe(true)
  await picker.getByRole("button", { name: "Back", exact: true }).click()
  await expect(picker.getByRole("button", { name: "Heading 1", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(picker).toBeHidden()
  expect(await originalToolbar!.evaluate((element) => element.isConnected)).toBe(true)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await insertTrigger.click()
  await page.getByRole("button", { name: "Close editing tools", exact: true }).click()
  await insertTrigger.click()
  await expect(picker).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(picker).toBeHidden()
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await surface.fill("/heading")
  await expect(page.locator('#slash-command')).toHaveCount(0)
  await page.getByRole("button", { name: "Format", exact: true }).click()
  const format = page.getByRole("region", { name: "Format", exact: true })
  await expect(format.getByRole("button", { name: "Font Family", exact: true })).toBeVisible()
  await expect.poll(async () => format.locator('button').evaluateAll((buttons) => buttons.map((button) => ({ name: button.getAttribute('aria-label'), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })).filter((size) => size.height > 0 && (size.width < 44 || size.height < 44)))).toEqual([])
  await page.keyboard.press("Escape")
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.getByTestId("editor").getByRole("radio", { name: "Align Left", exact: true }).or(page.getByTestId("editor").getByRole("button", { name: "Align Left", exact: true }))).toBeVisible()
  await expect(surface).toContainText("/heading")
  expect(errors).toEqual([])
})

test("inherits current host primitive behavior", async ({ page }) => {
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
  await expect(alignCenter).toHaveAttribute("${primitiveBase === 'radix' ? 'aria-checked' : 'aria-pressed'}", "true")

  await editor.locator('[aria-label="External URL"]').click()
  const linkInput = page.getByRole("combobox")
  await expect(linkInput).toBeVisible()
  await expect(linkInput).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(linkInput).toBeHidden()

  const mailbox = page.getByTestId("mailbox")
  await expect(mailbox.getByRole("button", { name: /Attachment compatibility/ })).toBeVisible()
  await expect(mailbox.locator("article")).toHaveCount(0)
  const createLabel = mailbox.getByRole("button", { name: "Create label", exact: true })
  await createLabel.click()
  const labelDialog = page.getByRole("dialog")
  await expect(labelDialog.getByRole("textbox", { name: "Label name" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(labelDialog).toBeHidden()
  await expect(createLabel).toBeFocused()
  await createLabel.click()
  await labelDialog.getByRole("textbox", { name: "Label name" }).fill("Receipts")
  await labelDialog.getByRole("button", { name: "Create label", exact: true }).click()
  await expect(mailbox.getByRole("button", { name: "Receipts", exact: true })).toBeVisible()
  await expect(createLabel).toBeFocused()

  const labelMenu = mailbox.getByRole("button", { name: "More: Projects", exact: true })
  await labelMenu.click()
  await page.getByRole("menuitem", { name: "Rename label" }).focus()
  await page.keyboard.press("Enter")
  await expect(labelDialog.getByRole("textbox", { name: "Label name" })).toHaveValue("Projects")
  await page.keyboard.press("Escape")
  await expect(labelDialog).toBeHidden()
  await expect(labelMenu).toBeFocused()

  const selectAll = mailbox.getByRole("checkbox", { name: "Select all on this page" })
  const selectRow = mailbox.getByRole("checkbox", { name: "Select conversation: Attachment compatibility" })
  await selectAll.check()
  await expect(selectRow).toBeChecked()
  await selectRow.uncheck()
  await expect(selectAll).not.toBeChecked()

  await mailbox.getByRole("button", { name: /Attachment compatibility/ }).click()
  await expect(selectAll).toBeHidden()
  await expect(mailbox.getByRole("button", { name: "Back to list" })).toBeFocused()
  await expect(mailbox.locator('[data-slot="avatar-fallback"]')).toHaveText("S")
  await expect(mailbox.locator('[data-slot="avatar"]')).not.toHaveAttribute("style", /background/)
  await expect(mailbox.getByRole("heading", { name: "Attachments (1)" })).toBeVisible()
  await expect(mailbox.getByText("text/plain · 7 B", { exact: true })).toBeVisible()
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    mailbox.getByRole("button", { name: "Download report.txt", exact: true }).click(),
  ])
  expect(download.suggestedFilename()).toBe("report.txt")
  expect(await readFile((await download.path())!, "utf8")).toBe("report\\n")
  await mailbox.getByRole("button", { name: "Back to list" }).click()
  await expect(mailbox.getByRole("button", { name: /Attachment compatibility/ })).toBeFocused()
  await expect(selectAll).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  await mailbox.getByRole("button", { name: "Main menu", exact: true }).click()
  const navigation = page.getByRole("dialog", { name: "Main menu", exact: true })
  await expect(navigation.getByRole("button", { name: "Inbox", exact: true })).toBeVisible()
  await navigation.getByRole("button", { name: "Inbox", exact: true }).click()
  await expect(navigation).toBeHidden()
  await mailbox.getByRole("button", { name: /Attachment compatibility/ }).click()
  await expect(selectAll).toBeHidden()
  expect(await mailbox.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await mailbox.getByRole("button", { name: "Back to list" }).click()
  await page.setViewportSize({ width: 1280, height: 900 })
  await mailbox.getByRole("button", { name: "Compose" }).click()
  await expect(mailbox.getByRole("textbox", { name: "Subject", exact: true })).toBeVisible()
  await expect(mailbox.getByRole("textbox", { name: "Body", exact: true })).toBeVisible()
  await expect(mailbox.locator('[data-slot="field-set"]')).toHaveCount(1)
  const richMode = mailbox.getByRole("${primitiveBase === 'radix' ? 'radio' : 'button'}", { name: "Visual editor" })
  await expect(richMode).toHaveCount(1)
  await richMode.click()
  await expect(richMode).toHaveAttribute("${primitiveBase === 'radix' ? 'aria-checked' : 'aria-pressed'}", "true")
  await expect(mailbox.locator('[contenteditable="true"]')).toHaveCount(1)
  await page.setViewportSize({ width: 320, height: 740 })
  await expect(mailbox.getByRole("button", { name: "Main menu", exact: true })).toBeVisible()
  expect(await mailbox.evaluate(el => {
    const edge = el.getBoundingClientRect().right
    return Array.from(el.querySelectorAll("button, input, textarea")).filter(control => {
      const rect = control.getBoundingClientRect()
      return rect.width > 0 && rect.right > edge + 1
    }).length
  })).toBe(0)

  await expect(page.locator("button button")).toHaveCount(0)
  expect(errors).toEqual([])
})

test("draft capabilities hide unavailable controls and keep open content", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.goto("${baseUrl}")

  const readOnly = page.getByTestId("readonly-mailbox")
  const row = readOnly.getByRole("button", { name: /Attachment compatibility/ })
  await expect(row).toBeVisible()
  await expect(readOnly.getByRole("button", { name: "Compose", exact: true })).toHaveCount(0)
  await row.click()
  await expect(readOnly.getByRole("button", { name: "Back to list" })).toBeFocused()
  for (const name of ["Reply", "Reply all", "Forward"])
    await expect(readOnly.getByRole("button", { name, exact: true })).toHaveCount(0)
  await readOnly.getByRole("button", { name: "Back to list" }).click()
  await readOnly.getByRole("button", { name: "Drafts", exact: true }).click()
  await readOnly.getByRole("button", { name: /Prepared draft/ }).click()
  await expect(readOnly.getByRole("heading", { name: "Draft", exact: true })).toBeVisible()
  // A draft the host cannot edit is shown as read-only text, not disabled fields.
  await expect(readOnly.getByRole("definition").filter({ hasText: "Prepared draft" })).toBeVisible()
  await expect(readOnly.getByRole("textbox", { name: "Subject", exact: true })).toHaveCount(0)
  for (const name of ["Discard", "Save draft", "Send"])
    await expect(readOnly.getByRole("button", { name, exact: true })).toHaveCount(0)
  await readOnly.getByRole("button", { name: "Back to list" }).click()
  await expect(readOnly.getByRole("button", { name: /Prepared draft/ })).toBeVisible()

  const mailbox = page.getByTestId("capability-mailbox")
  await mailbox.getByRole("button", { name: "Compose", exact: true }).click()
  await expect(mailbox.getByRole("button", { name: "Save draft", exact: true })).toBeVisible()
  await expect(mailbox.getByRole("button", { name: "Send", exact: true })).toHaveCount(0)
  const subject = mailbox.getByRole("textbox", { name: "Subject", exact: true })
  await subject.fill("Keep this text")
  await page.evaluate(() => window.mailySetDraftCapabilities({ create: false, send: false, discard: false }))
  await expect(mailbox.getByText("Changes cannot be saved. Your edits are still here.")).toBeVisible()
  await expect(mailbox.getByRole("button", { name: "Save draft", exact: true })).toHaveCount(0)
  await expect(mailbox.getByRole("button", { name: "Compose", exact: true })).toHaveCount(0)
  await expect(subject).toBeEditable()
  // Negative check: outlast the one-second autosave delay without a dispatch.
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => window.mailyDraftCalls)).toEqual([])
  await mailbox.getByRole("button", { name: "Back to list" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText("Discard unsaved changes?")).toBeVisible()
  await dialog.getByRole("button", { name: "Keep editing", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(subject).toHaveValue("Keep this text")

  await page.evaluate(() => window.mailySetDraftCapabilities({ send: false, discard: false }))
  await expect.poll(() => page.evaluate(() => window.mailyDraftCalls)).toEqual(["create:Keep this text"])
  await expect(mailbox.getByText("Saved automatically")).toBeVisible()
  await expect(mailbox.getByRole("button", { name: "Discard", exact: true })).toHaveCount(0)

  const richMode = mailbox.getByRole("${primitiveBase === 'radix' ? 'radio' : 'button'}", { name: "Visual editor" })
  await richMode.click()
  // Target the compose body field, not any other editor on the page.
  const surface = mailbox.getByRole("group", { name: "Body", exact: true }).getByRole("textbox")
  const editorToolbar = mailbox.getByLabel("Editor view mode", { exact: true })
  await expect(surface).toHaveAttribute("contenteditable", "true")
  await expect(editorToolbar).toHaveCount(1)
  await surface.click()
  await page.keyboard.type("Rich body")
  await expect.poll(() => page.evaluate(() => window.mailyDraftCalls.at(-1))).toBe("update:created-draft:Keep this text:Rich body")
  await expect(mailbox.getByText("Saved automatically")).toBeVisible()
  const settled = await page.evaluate(() => window.mailyDraftCalls.length)

  // Locking shows the saved draft as read-only text; unlocking must not write.
  await page.evaluate(() => window.mailySetDraftCapabilities({ edit: false, send: false, discard: false }))
  await expect(mailbox.getByRole("heading", { name: "Draft", exact: true })).toBeVisible()
  await expect(mailbox.getByRole("definition").filter({ hasText: "Keep this text" })).toBeVisible()
  await expect(mailbox.getByRole("region", { name: "Body", exact: true }).locator("iframe").contentFrame().getByText("Rich body")).toBeVisible()
  await expect(subject).toHaveCount(0)
  await expect(surface).toHaveCount(0)
  await expect(editorToolbar).toHaveCount(0)
  await page.evaluate(() => window.mailySetDraftCapabilities({ send: false, discard: false }))
  await expect(mailbox.getByRole("heading", { name: "Edit draft", exact: true })).toBeVisible()
  await expect(surface).toHaveAttribute("contenteditable", "true")
  await expect(surface).toContainText("Rich body")
  await expect(editorToolbar).toHaveCount(1)
  await expect(surface).not.toBeFocused()
  await expect(subject).toBeEditable()
  await page.waitForTimeout(1500)
  const calls = await page.evaluate(() => window.mailyDraftCalls)
  expect(calls).toHaveLength(settled)
  expect(calls.some((call) => call.startsWith("send:") || call.startsWith("discard:"))).toBe(false)

  await expect(page.locator("button button")).toHaveCount(0)
  expect(errors).toEqual([])
})
`
  );

  const preview = spawn(
    process.execPath,
    [
      path.join(project, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: project,
      env: commandEnv,
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

// Installed Maily source must pass the host's own stock ESLint config (the
// shadcn Vite template's, including the React Compiler rules) with no
// warnings. Host-owned ui primitives are upstream code and are not linted.
async function verifyConsumerLint(project) {
  const sources = ['src/components/maily', 'src/lib/maily-render'].filter(
    (source) => fs.existsSync(path.join(project, source))
  );
  const [command, ...prefix] = fs.existsSync(path.join(project, 'bun.lock'))
    ? ['bunx']
    : ['pnpm', 'exec'];
  await run(command, [...prefix, 'eslint', ...sources, '--max-warnings', '0'], {
    cwd: project,
  });
}

async function runProjectCommand(project, args, options = {}) {
  const command = fs.existsSync(path.join(project, 'bun.lock'))
    ? 'bun'
    : fs.existsSync(path.join(project, 'pnpm-lock.yaml'))
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
      env: commandEnv,
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
