import { expect, test } from "@playwright/test"

import { isExpectedConsoleError } from "./console-errors"

test("advanced search stays open while editing and filters through the adapter", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    const text = message.text()
    if (message.type() === "error" && !isExpectedConsoleError(text)) {
      errors.push(text)
    }
  })
  await page.goto("/")
  const language = page.getByText("English", { exact: true })
  if ((await language.getAttribute("data-state")) !== "on") {
    await language.click()
  }

  await page
    .getByRole("button", { name: "Advanced search", exact: true })
    .click()
  const form = page.locator('[data-slot="popover-content"] form')
  for (const name of ["From", "To", "Subject"]) {
    await expect(form.getByRole("textbox", { name, exact: true })).toBeVisible()
  }
  await expect(form.locator('button[id$="-search-after"]')).toBeVisible()
  await expect(form.locator('button[id$="-search-before"]')).toBeVisible()
  await form.locator('button[id$="-search-after"]').click()
  const calendar = page.locator('[data-slot="calendar"]')
  await expect(calendar).toBeVisible()
  const day = calendar
    .locator("button[data-day]")
    .filter({ hasText: /^15$/ })
    .first()
  await day.click()
  await expect(calendar).toBeHidden()
  await expect(form.locator('button[id$="-search-after"]')).not.toContainText(
    "Choose date"
  )
  await form.locator('button[id$="-search-after"]').click()
  await page.getByRole("button", { name: "Clear date", exact: true }).click()
  await expect(form.locator('button[id$="-search-after"]')).toHaveText(
    "Choose date"
  )
  const attachments = form.getByRole("checkbox", { name: "Has attachments" })
  await expect(attachments).toBeVisible()
  await expect(form.getByRole("checkbox", { name: "Unread" })).toBeVisible()

  // Pointer input inside the form must not move focus back to the search bar.
  const from = form.getByRole("textbox", { name: "From", exact: true })
  await from.click()
  await expect(from).toBeFocused()
  await from.fill("billing@platform.example")
  await form.getByText("Has attachments", { exact: true }).click()
  await expect(attachments).toBeChecked()
  await expect(from).toHaveValue("billing@platform.example")

  await form.getByRole("button", { name: "Search", exact: true }).click()
  await expect(form).toBeHidden()
  await expect(
    page.getByRole("button", { name: /SMTP queue cleared/ })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /The July Launch Kit is live/ })
  ).toHaveCount(0)

  await page.getByRole("button", { name: "Clear search", exact: true }).click()
  await expect(
    page.getByRole("button", { name: /The July Launch Kit is live/ })
  ).toBeVisible()
  expect(errors).toEqual([])
})
