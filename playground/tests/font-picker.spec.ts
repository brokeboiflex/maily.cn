import { expect, test } from "@playwright/test"

test("virtualizes Fontsource and persists a granular font mark", async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/")
  await page.getByRole("radio", { name: "Polski" }).click()

  const editor = page.locator(".ProseMirror").first()
  await editor.click()
  await page.keyboard.type("Editorial sample")
  await page.keyboard.press("Home")
  await page.keyboard.down("Shift")
  await page.keyboard.press("End")
  await page.keyboard.up("Shift")

  await page.getByRole("button", { name: "Krój pisma" }).click()
  const popover = page.locator('[data-slot="popover-content"]:visible').last()
  await expect(popover).toBeVisible()

  const search = popover.getByPlaceholder("Szukaj fontów Fontsource...")
  await expect(search).toBeVisible()
  await expect(popover.getByText("Fontsource catalog")).toHaveCount(0)
  await expect(popover.getByText(/\d+ fonts/)).toHaveCount(0)

  await expect
    .poll(() => popover.locator("[cmdk-item]").count())
    .toBeGreaterThan(2)
  const initiallyMountedOptions = await popover.locator("[cmdk-item]").count()
  expect(initiallyMountedOptions).toBeGreaterThan(2)
  expect(initiallyMountedOptions).toBeLessThan(30)
  await expect(popover.getByText("VF", { exact: true })).toHaveCount(0)

  await search.fill("Fraunces")
  const fraunces = popover.locator("[cmdk-item]", { hasText: "Fraunces" })
  await expect(fraunces).toBeVisible()
  await page.waitForFunction(() =>
    [...document.fonts].some(
      (face) =>
        face.family === "maily-preview-fraunces" && face.status === "loaded"
    )
  )
  await search.press("ArrowDown")
  await expect(fraunces).toHaveAttribute("data-selected", "true")
  await search.press("Enter")

  await expect(
    editor
      .locator('span[style*="Fraunces"]')
      .filter({ hasText: "Editorial sample" })
      .first()
  ).toContainText("Editorial sample")

  await page.getByText("Editor JSON").click()
  const json = page.locator("details pre")
  await expect(json).toContainText('"fontId": "fraunces"')
  await expect(json).toContainText('"fontFallback": "Georgia"')
  await expect(json).toContainText(/"fontVersion": "\d+\.\d+\.\d+"/)
  expect(consoleErrors).toEqual([])
})
