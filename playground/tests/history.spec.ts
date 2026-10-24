import { expect, test, type Page } from "@playwright/test"

// prosemirror-history merges steps closer than 500 ms into one undo group.
const HISTORY_BOUNDARY_MS = 700

async function blockTypes(page: Page) {
  return page
    .locator(".ProseMirror")
    .first()
    .evaluate((element) =>
      element.editor
        .getJSON()
        .content?.map((node: { type?: string }) => node.type)
    )
}

async function seedEmptyParagraph(page: Page) {
  await page.goto("/")
  await page
    .locator(".ProseMirror")
    .first()
    .evaluate((element) => {
      element.editor.commands.setContent("<p>Before</p><p></p>")
      element.editor.commands.focus("end")
    })
  await page.waitForTimeout(HISTORY_BOUNDARY_MS)
}

// Regression for N02: Undo of an empty-block conversion threw a nested
// Placeholder RangeError on TipTap 3.30 and left the converted block behind.
for (const command of [
  "toggleBulletList",
  "toggleOrderedList",
  "toggleBlockquote",
] as const) {
  test(`undoes ${command} on an empty paragraph`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await seedEmptyParagraph(page)
    await page
      .locator(".ProseMirror")
      .first()
      .evaluate((element, name) => {
        element.editor.commands[name]()
      }, command)
    expect(await blockTypes(page)).not.toEqual(["paragraph", "paragraph"])
    await page.waitForTimeout(HISTORY_BOUNDARY_MS)

    await page.keyboard.press("ControlOrMeta+z")

    expect(await blockTypes(page)).toEqual(["paragraph", "paragraph"])
    expect(errors).toEqual([])
  })
}

test("undoes a slash-menu Bullet List on an empty paragraph", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await seedEmptyParagraph(page)
  await page.keyboard.type("/bullet")
  await expect(page.locator("#slash-command")).toBeVisible()
  await page.keyboard.press("Enter")
  await expect.poll(() => blockTypes(page)).toContain("bulletList")
  await page.waitForTimeout(HISTORY_BOUNDARY_MS)

  await page.keyboard.press("ControlOrMeta+z")

  expect(await blockTypes(page)).toEqual(["paragraph", "paragraph"])
  expect(errors).toEqual([])
})
