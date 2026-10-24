import { expect, test } from "@playwright/test"

test("applies a stored palette over the app stylesheet on load", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("shadcn-theme-palette", "corporate")
    localStorage.setItem("shadcn-theme-mode", "light")
  })
  await page.goto("/")
  // corporate.css's --primary; index.css defines the default palette's.
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim()
      )
    )
    .toBe("oklch(0.48 0.2 260.47)")
})
