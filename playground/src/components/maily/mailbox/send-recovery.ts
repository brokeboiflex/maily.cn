function receiptKey(key: string, draftId: string) {
  return `${receiptPrefix(key)}${encodeURIComponent(draftId)}`
}

function receiptPrefix(key: string) {
  return `maily:pending-send-receipts:${encodeURIComponent(key)}:`
}

export function readPendingSendReceipts(key: string): string[] {
  const receipts = new Set<string>()
  const primary = window.sessionStorage.getItem(key)
  if (primary) receipts.add(primary)
  const prefix = receiptPrefix(key)
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storedKey = window.sessionStorage.key(index)
    if (!storedKey?.startsWith(prefix)) continue
    const draftId = window.sessionStorage.getItem(storedKey)
    if (draftId) receipts.add(draftId)
  }
  return [...receipts]
}

export function retainPendingSendReceipt(key: string, draftId: string) {
  const entry = receiptKey(key, draftId)
  window.sessionStorage.setItem(entry, draftId)
  if (window.sessionStorage.getItem(entry) !== draftId)
    throw new Error("errors.idempotency.storage-unavailable")
  // The scalar key remains readable by historic clients. Never overwrite an
  // unrelated acknowledged intent; the journal retains additional receipts.
  if (!window.sessionStorage.getItem(key)) {
    window.sessionStorage.setItem(key, draftId)
    if (window.sessionStorage.getItem(key) !== draftId)
      throw new Error("errors.idempotency.storage-unavailable")
  }
}

export function clearPendingSendReceipt(key: string, draftId: string) {
  window.sessionStorage.removeItem(receiptKey(key, draftId))
  if (window.sessionStorage.getItem(key) === draftId)
    window.sessionStorage.removeItem(key)
  const [remaining] = readPendingSendReceipts(key)
  if (remaining && !window.sessionStorage.getItem(key))
    window.sessionStorage.setItem(key, remaining)
}
