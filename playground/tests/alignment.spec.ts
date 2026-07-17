import { expect, test, type Page } from "@playwright/test"

async function useEnglish(page: Page) {
  const language = page.getByRole("button", { name: "Język: Polski" })
  if (await language.count()) await language.click()
}

async function openSlashCommand(page: Page) {
  const editor = page.locator(".ProseMirror").first()
  await editor.click()
  await expect(editor).toBeFocused()
  await page.keyboard.type("/")
  const command = page.locator("#slash-command")
  await expect(command).toBeVisible()
  return command
}

test("inherits host theme hover tokens and keeps the whole slash item interactive", async ({
  page,
}) => {
  await page.goto("/")
  await useEnglish(page)

  const themeTrigger = page.getByRole("button", { name: /^Theme:/ })
  await themeTrigger.click()
  await page.getByRole("menuitemradio", { name: "Neo-Brutalism" }).click()
  await expect(themeTrigger).toBeFocused()

  const command = await openSlashCommand(page)
  const item = command.locator("button").first()
  await item.hover()

  const styles = await item.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      background: style.backgroundColor,
      cursor: style.cursor,
      accent: getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim(),
    }
  })

  expect(styles.cursor).toBe("pointer")
  expect(styles.background).toBe(styles.accent)
})

test("stays within a narrow viewport without horizontal document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto("/")
  const command = await openSlashCommand(page)

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  const commandBox = await command.boundingBox()

  expect(widths.scroll).toBe(widths.client)
  expect(commandBox).not.toBeNull()
  expect(commandBox!.x).toBeGreaterThanOrEqual(0)
  expect(commandBox!.x + commandBox!.width).toBeLessThanOrEqual(widths.client)
})

test("preserves real Tabs state through Tooltip composition", async ({
  page,
}) => {
  await page.goto("/")
  await useEnglish(page)
  const command = await openSlashCommand(page)
  await command.locator("button", { hasText: "Custom HTML" }).click()

  const htmlNode = page.locator('[data-type="htmlCodeBlock"]')
  await htmlNode.click()
  await page.keyboard.type("<p>Hello</p>")

  const tabs = page.getByRole("tab")
  await expect(tabs).toHaveCount(2)
  await expect(tabs.nth(0)).toHaveAttribute("data-state", "active")
  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveAttribute("data-state", "active")
})

test("uses ToggleGroup roving focus and never nests interactive buttons", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await page.goto("/")
  const editor = page.locator(".ProseMirror").first()
  await editor.click()
  await page.keyboard.type("keyboard check")
  await page.keyboard.press("Home")
  await page.keyboard.down("Shift")
  await page.keyboard.press("End")
  await page.keyboard.up("Shift")

  const group = page
    .locator('.tippy-box[data-state="visible"] [data-slot="toggle-group"]')
    .last()
  await expect(group).toBeVisible()
  const items = group.locator('[data-slot="toggle-group-item"]')
  await expect(items).toHaveCount(5)

  await items.first().focus()
  await page.keyboard.press("ArrowRight")
  await expect(items.nth(1)).toBeFocused()
  await items.first().click()
  await expect(items.first()).toHaveAttribute("data-state", "on")
  await expect(editor.locator("strong")).toHaveText("keyboard check")
  await expect(page.locator("button button")).toHaveCount(0)
  expect(errors).toEqual([])
})

test("uses the shadcn link popover in the top toolbar instead of a browser prompt", async ({
  page,
}) => {
  const dialogs: string[] = []
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.type())
    await dialog.dismiss()
  })

  await page.goto("/")
  await useEnglish(page)
  const editor = page.locator(".ProseMirror").first()
  await editor.click()
  await page.keyboard.type("linked text")
  await page.keyboard.press("Home")
  await page.keyboard.down("Shift")
  await page.keyboard.press("End")
  await page.keyboard.up("Shift")

  await page.getByRole("button", { name: "External URL" }).first().click()
  const visibleLinkInput = page.locator(
    "input[role='combobox'][placeholder='https://maily.to/']:visible"
  )
  await expect(visibleLinkInput).toBeVisible()
  await visibleLinkInput.fill("https://example.com")
  await visibleLinkInput.press("Enter")

  await expect(editor.locator('a[href="https://example.com"]')).toHaveText(
    "linked text"
  )
  expect(dialogs).toEqual([])
})

test("uses a Popover and ToggleGroup for vertical column alignment", async ({
  page,
}) => {
  await page.goto("/")
  await useEnglish(page)
  const command = await openSlashCommand(page)
  await command.locator("button", { hasText: "Columns" }).click()

  const trigger = page.getByRole("button", { name: "Vertical Alignment" })
  await expect(trigger).toBeVisible()
  await trigger.click()

  const popover = page.locator('[data-slot="popover-content"]:visible').last()
  const center = popover.getByRole("radio", { name: "Align Center" })
  await center.click()
  await expect(center).toHaveAttribute("data-state", "on")
  await expect(page.locator("button button")).toHaveCount(0)
})

test("renders Link Card labels with the host Badge tokens", async ({
  page,
}) => {
  await page.goto("/")
  await useEnglish(page)
  const command = await openSlashCommand(page)
  await command.locator("button", { hasText: "Link Card" }).click()

  await page.getByLabel("Badge Text").fill("Status")
  const badge = page.locator('[data-slot="badge"]', { hasText: "Status" })
  await expect(badge).toBeVisible()

  const colors = await badge.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    secondary: getComputedStyle(document.documentElement)
      .getPropertyValue("--secondary")
      .trim(),
  }))
  expect(colors.background).toBe(colors.secondary)
})
