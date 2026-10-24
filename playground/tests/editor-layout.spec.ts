import { expect, test } from "@playwright/test"

test("fits the HTML block preview to its content and to width changes", async ({
  page,
}) => {
  await page.goto("/")
  const editor = page.locator(".ProseMirror").first()
  await editor.evaluate((element) => {
    element.editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "htmlCodeBlock",
          attrs: { activeTab: "preview" },
          content: [
            {
              type: "text",
              text: "<p>Short and sweet preview text that wraps on narrow layouts.</p>",
            },
          ],
        },
      ],
    })
  })
  const frame = editor.locator("iframe")
  await expect(frame).toBeVisible()
  // The document is never shorter than the viewport; the frame must follow
  // the content instead of the 150px default.
  await expect
    .poll(async () => (await frame.boundingBox())?.height ?? 0)
    .toBeLessThan(60)
  const wide = (await frame.boundingBox())!.height

  await editor.evaluate((element) => {
    ;(element as HTMLElement).style.width = "160px"
  })
  await expect
    .poll(async () => (await frame.boundingBox())?.height ?? 0)
    .toBeGreaterThan(wide)
})

test("keeps the slash menu inside the viewport near the right edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 800 })
  await page.goto("/")
  const editor = page.locator(".ProseMirror").first()
  await editor.evaluate((element) => {
    element.editor.commands.setContent("<p>Above</p>")
    element.editor.commands.focus("end")
  })
  await expect(editor).toBeFocused()
  await page.keyboard.press("Enter")
  await editor.evaluate((element) => {
    element.editor.commands.setTextAlign("right")
  })
  await page.keyboard.type("/")
  const menu = page.locator("#slash-command")
  await expect(menu).toBeVisible()
  const box = (await menu.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(900)
})

test("themes the HTML block preview like the editor canvas", async ({
  page,
}) => {
  await page.goto("/")
  const editor = page.locator(".ProseMirror").first()
  await editor.evaluate((element) => {
    element.editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "htmlCodeBlock",
          attrs: { activeTab: "preview" },
          content: [{ type: "text", text: "<p>Themed preview</p>" }],
        },
      ],
    })
  })
  const frame = editor.locator("iframe")
  await expect(frame).toBeVisible()
  // The iframe uses the email's default system font and loads no web font.
  // Polled: a srcdoc iframe is visible while it still holds about:blank.
  await expect
    .poll(() =>
      frame.evaluate((element: HTMLIFrameElement) => {
        const document = element.contentDocument!
        return {
          webFonts: document.fonts.size,
          family: getComputedStyle(document.body).fontFamily,
        }
      })
    )
    .toEqual({ webFonts: 0, family: "Arial, sans-serif" })
  const colors = () =>
    frame.evaluate((element: HTMLIFrameElement) => ({
      host: getComputedStyle(element).color,
      preview: getComputedStyle(element.contentDocument!.body).color,
      background: getComputedStyle(element.contentDocument!.body)
        .backgroundColor,
    }))
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await expect
    .poll(async () => {
      const { host, preview } = await colors()
      return preview === host
    })
    .toBe(true)
  expect((await colors()).background).toBe("rgba(0, 0, 0, 0)")
  await page.evaluate(() => document.documentElement.classList.remove("dark"))
  await expect
    .poll(async () => {
      const { host, preview } = await colors()
      return preview === host
    })
    .toBe(true)

  // A theme scoped to an ancestor of the editor, not the root element.
  const light = (await colors()).host
  await editor.evaluate((element) =>
    element.parentElement!.classList.add("dark")
  )
  await expect
    .poll(async () => {
      const { host, preview } = await colors()
      return host !== light && preview === host
    })
    .toBe(true)
})
