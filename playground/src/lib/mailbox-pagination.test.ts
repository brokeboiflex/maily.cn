import { describe, expect, it } from "vitest"
import { paginateMessages } from "./mailbox-pagination"

const message = (id: string, day: number) => ({
  id,
  createdAt: `2026-10-${String(day).padStart(2, "0")}T00:00:00Z`,
})
const scope = { folder: "inbox", search: { text: "hello", labelId: "work" } }

describe("playground message keyset pagination", () => {
  it("retains its boundary after deletion and insertions before the page", () => {
    const initial = [
      message("a", 10),
      message("b", 9),
      message("c", 8),
      message("d", 7),
    ]
    const first = paginateMessages(initial, scope, undefined, 2)
    const changed = [message("new", 11), initial[0], initial[2], initial[3]]
    expect(
      paginateMessages(changed, scope, first.nextCursor!, 2).items.map(
        (item) => item.id
      )
    ).toEqual(["c", "d"])
  })

  it("uses a stable ID tie-break for equal timestamps", () => {
    const initial = [message("a", 10), message("c", 10), message("b", 10)]
    const first = paginateMessages(initial, scope, undefined, 2)
    expect(first.items.map((item) => item.id)).toEqual(["c", "b"])
    expect(
      paginateMessages(initial, scope, first.nextCursor!, 2).items.map(
        (item) => item.id
      )
    ).toEqual(["a"])
  })

  it("rejects cursors from another query, folder, or label", () => {
    const first = paginateMessages(
      [message("a", 10), message("b", 9)],
      scope,
      undefined,
      1
    )
    for (const other of [
      { ...scope, folder: "sent" },
      { ...scope, search: { text: "other" } },
      { ...scope, search: { ...scope.search, labelId: "other" } },
    ]) {
      expect(() => paginateMessages([], other, first.nextCursor!)).toThrow(
        "Invalid cursor for this query"
      )
    }
  })
})
