interface OrderedMessage {
  id: string
  createdAt: string | Date
}

function scopeKey(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(scopeKey).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${scopeKey(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

function compare(
  a: { time: number; id: string },
  b: { time: number; id: string }
) {
  return b.time - a.time || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
}

/** The cursor carries the immutable boundary, so deletion cannot shift a page. */
export function paginateMessages<T extends OrderedMessage>(
  messages: readonly T[],
  scope: unknown,
  cursor?: string,
  limit = 20
): { items: T[]; nextCursor: string | null; total: number } {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("Invalid page limit")
  const query = scopeKey(scope)
  let boundary: { time: number; id: string } | undefined
  if (cursor) {
    const token = JSON.parse(decodeURIComponent(cursor)) as {
      version?: number
      query?: string
      time?: number
      id?: string
    }
    if (
      token.version !== 1 ||
      token.query !== query ||
      typeof token.time !== "number" ||
      !Number.isFinite(token.time) ||
      typeof token.id !== "string"
    ) {
      throw new Error("Invalid cursor for this query")
    }
    boundary = { time: token.time, id: token.id }
  }
  const ordered = messages
    .map((message) => ({
      message,
      time: new Date(message.createdAt).getTime(),
      id: message.id,
    }))
    .sort(compare)
  const remaining = boundary
    ? ordered.filter((item) => compare(item, boundary!) > 0)
    : ordered
  const page = remaining.slice(0, limit)
  const last = page.at(-1)
  return {
    items: page.map(({ message }) => message),
    total: messages.length,
    nextCursor:
      last && remaining.length > page.length
        ? encodeURIComponent(
            JSON.stringify({ version: 1, query, time: last.time, id: last.id })
          )
        : null,
  }
}
