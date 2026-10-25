import { expect, test } from "@playwright/test"

import { isExpectedConsoleError } from "./console-errors"

test("new message stays new until explicitly saved and keeps compose hierarchy", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.addInitScript(() =>
    localStorage.setItem("shadcn-theme-mode", "dark")
  )
  await page.goto("/")
  const mailbox = page.locator(".maily-mailbox")
  const starred = mailbox.getByRole("button", { name: "Starred", exact: true })
  await starred.click()
  await expect(starred).toHaveAttribute("aria-current", "page")
  const drafts = mailbox.getByRole("button", { name: "Drafts", exact: true })
  const draftCount = await drafts.textContent()
  await mailbox
    .getByRole("button", { name: "New message", exact: true })
    .click()
  await expect(mailbox.locator('[aria-current="page"]')).toHaveCount(0)
  const to = mailbox.getByRole("textbox", { name: "To", exact: true })
  await expect(to).toBeFocused()
  const inputGroup = to.locator(
    'xpath=ancestor::*[@data-slot="input-group"][1]'
  )
  for (const action of [() => to.hover(), () => to.focus()]) {
    await action()
    expect(
      await inputGroup.evaluate((node) => getComputedStyle(node).boxShadow)
    ).not.toContain("3px")
  }
  const subject = mailbox.getByRole("textbox", { name: "Subject", exact: true })
  const subjectRow = await subject
    .locator('xpath=ancestor::*[@data-slot="field"][1]')
    .boundingBox()
  const toolbar = await mailbox
    .locator(".mly-editor > div")
    .first()
    .boundingBox()
  expect(
    toolbar!.y - subjectRow!.y - subjectRow!.height
  ).toBeGreaterThanOrEqual(16)
  await subject.fill("Keep new message identity")
  await mailbox
    .locator('[contenteditable="true"]')
    .fill("This message is only saved when requested.")
  // The old demo saved after 1000ms. Edits must now remain local beyond that timer.
  await page.waitForTimeout(1500)
  await expect(drafts).toHaveText(draftCount!)
  await expect(
    mailbox.getByRole("heading", { name: "New message", exact: true })
  ).toBeVisible()
  await expect(
    mailbox.getByText("Saved automatically", { exact: true })
  ).toHaveCount(0)
  const save = mailbox.getByRole("button", { name: "Save draft", exact: true })
  const attach = mailbox.getByRole("button", {
    name: "Attach files",
    exact: true,
  })
  const saveBox = await save.boundingBox()
  const attachBox = await attach.boundingBox()
  expect(saveBox!.x - attachBox!.x - attachBox!.width).toBeGreaterThan(200)
  await save.hover()
  await expect(
    page.getByRole("tooltip", { name: "Save draft", exact: true })
  ).toHaveCount(0)
  await mailbox.screenshot({
    path: testInfo.outputPath("new-message-dark.png"),
  })
  await save.click()
  await expect(mailbox.getByText("Draft saved.", { exact: true })).toBeVisible()
  await expect(
    mailbox.getByRole("heading", { name: "New message", exact: true })
  ).toBeVisible()
  await expect(mailbox.locator('[aria-current="page"]')).toHaveCount(0)
  await mailbox
    .getByRole("button", { name: "Back to list", exact: true })
    .click()
  await expect(starred).toHaveAttribute("aria-current", "page")
  await drafts.click()
  await mailbox
    .getByRole("button", { name: /Keep new message identity/ })
    .click()
  await expect(
    mailbox.getByRole("heading", { name: "Edit draft", exact: true })
  ).toBeVisible()
})

test("message hover covers the checkbox, star and message together", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/")
  const mailbox = page.locator(".maily-mailbox")
  const message = mailbox.getByRole("button", {
    name: /Re: Mailbox component handoff/,
  })
  const row = message.locator("xpath=..")
  for (const mode of ["light", "dark"]) {
    await page.evaluate((mode) => {
      document.documentElement.classList.toggle("dark", mode === "dark")
    }, mode)
    await page.mouse.move(0, 0)
    const resting = await row.evaluate(
      (node) => getComputedStyle(node).backgroundColor
    )
    for (const target of [
      message,
      row.getByRole("checkbox"),
      row.getByRole("button", { name: "Add star", exact: true }),
    ]) {
      await target.hover()
      await expect
        .poll(() =>
          row.evaluate((node) => getComputedStyle(node).backgroundColor)
        )
        .not.toBe(resting)
      expect(
        await message.evaluate((node) => getComputedStyle(node).backgroundColor)
      ).toBe("rgba(0, 0, 0, 0)")
    }
    await mailbox.screenshot({
      path: testInfo.outputPath(`row-hover-${mode}.png`),
    })
  }
})

test("compose keeps the editor gutter inside and buttons fitted to their contents", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/")
  const mailbox = page.locator(".maily-mailbox")
  await mailbox
    .getByRole("button", { name: "New message", exact: true })
    .click()
  const editor = mailbox.locator('[contenteditable="true"]')
  await editor.fill("The editor keeps its original gutter and menu placement.")
  await editor.locator("p").hover()
  const addNode = mailbox.getByRole("button", {
    name: "Add new node",
    exact: true,
  })
  const nodeActions = mailbox.getByRole("button", {
    name: "Node actions",
    exact: true,
  })
  await expect(addNode).toBeVisible()
  const canvas = await mailbox.locator(".mly-editor").boundingBox()
  const paragraph = await editor.locator("p").boundingBox()
  for (const control of [addNode, nodeActions]) {
    const box = await control.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(canvas!.x)
    expect(box!.x + box!.width).toBeLessThanOrEqual(paragraph!.x)
  }
  const toolbar = await mailbox
    .locator(".mly-editor > div")
    .first()
    .boundingBox()
  const body = await editor.boundingBox()
  expect(toolbar!.y + toolbar!.height).toBeLessThanOrEqual(body!.y)
  await mailbox.screenshot({ path: testInfo.outputPath("compose-gutter.png") })
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    // Blur the body so the existing compact editor dock is closed.
    await mailbox.getByRole("textbox", { name: "Subject", exact: true }).click()
    const send = mailbox.getByRole("button", { name: "Send", exact: true })
    const attach = mailbox.getByRole("button", {
      name: "Attach files",
      exact: true,
    })
    const save = mailbox.getByRole("button", {
      name: "Save draft",
      exact: true,
    })
    const discard = mailbox.getByRole("button", {
      name: "Discard",
      exact: true,
    })
    const boxes = await Promise.all(
      [send, attach, save, discard].map((node) => node.boundingBox())
    )
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.x).toBeGreaterThanOrEqual(
        boxes[i - 1]!.x + boxes[i - 1]!.width
      )
      expect(boxes[i]!.y).toBe(boxes[0]!.y)
    }
    const label = save.locator("span")
    if (width >= 768) {
      const text = await label.boundingBox()
      expect(text!.x).toBeGreaterThanOrEqual(boxes[2]!.x)
      expect(text!.x + text!.width).toBeLessThanOrEqual(
        boxes[2]!.x + boxes[2]!.width
      )
    }
  }
})

test("sidebar collapse preserves visual compose across container widths", async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error" && !isExpectedConsoleError(message.text()))
      errors.push(message.text())
  })
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/")
  const mailbox = page.locator(".maily-mailbox")
  await mailbox
    .getByRole("button", { name: "New message", exact: true })
    .click()
  await expect(mailbox.locator("textarea")).toHaveCount(0)
  const subject = mailbox.getByRole("textbox", { name: "Subject", exact: true })
  const editor = mailbox.locator('[contenteditable="true"]')
  await subject.fill("Sidebar regression draft")
  await editor.fill("Keep this rich message while resizing.")
  const originalEditor = await editor.elementHandle()
  await mailbox
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click()
  const expand = mailbox.getByRole("button", {
    name: "Expand sidebar",
    exact: true,
  })
  await expect(expand).toHaveAttribute("aria-expanded", "false")
  await expect(
    mailbox.getByRole("button", { name: "Inbox", exact: true })
  ).toBeVisible()
  expect(
    await editor.evaluate((node, original) => node === original, originalEditor)
  ).toBe(true)
  await expect(subject).toHaveValue("Sidebar regression draft")
  await mailbox.screenshot({ path: testInfo.outputPath("compose-desktop.png") })

  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(
      mailbox.getByRole("button", { name: "Main menu", exact: true })
    ).toBeVisible()
    expect(
      await mailbox.evaluate(
        (element) => element.scrollWidth <= element.clientWidth
      )
    ).toBe(true)
    await expect(editor).toContainText("Keep this rich message while resizing.")
    await expect(
      mailbox.getByRole("button", { name: "Send", exact: true })
    ).toBeVisible()
  }
  await mailbox.screenshot({ path: testInfo.outputPath("compose-mobile.png") })
  await mailbox.getByRole("button", { name: "Main menu", exact: true }).click()
  const menu = page.getByRole("dialog", { name: "Main menu", exact: true })
  await expect(
    menu.getByRole("button", { name: "Inbox", exact: true })
  ).toBeVisible()
  await menu.getByRole("button", { name: "Close menu", exact: true }).click()
  await page.setViewportSize({ width: 1440, height: 1100 })
  await expect(expand).toBeVisible()
  await expand.click()
  await mailbox.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(mailbox.getByText("Draft saved.", { exact: true })).toBeVisible()
  await mailbox
    .getByRole("button", { name: "Back to list", exact: true })
    .click()
  await mailbox.getByRole("button", { name: "Drafts", exact: true }).click()
  await mailbox
    .getByRole("button", { name: /Sidebar regression draft/ })
    .click()
  await expect(subject).toHaveValue("Sidebar regression draft")
  await expect(editor).toContainText("Keep this rich message while resizing.")
  expect(errors).toEqual([])
})
