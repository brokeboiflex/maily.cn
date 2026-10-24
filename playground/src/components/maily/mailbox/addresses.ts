const SEPARATORS = new Set([',', ';', '\n']);
const PHRASE_SPECIALS = /[()<>[\]:;@\\,."]/;

export type MailboxAddressToken = { start: number; end: number };

/**
 * For each index, where a quoted string or comment that continues from there
 * ends, or -1 when it never does. Inside both, a backslash escapes the next
 * character; comments nest.
 */
function closingIndexes(value: string) {
  const quote = new Int32Array(value.length + 2).fill(-1);
  const comment = new Int32Array(value.length + 2).fill(-1);
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const char = value[index];
    if (char === '\\') {
      quote[index] = quote[index + 2];
      comment[index] = comment[index + 2];
      continue;
    }
    quote[index] = char === '"' ? index : quote[index + 1];
    if (char === ')') comment[index] = index;
    else if (char !== '(') comment[index] = comment[index + 1];
    else {
      const inner = comment[index + 1];
      comment[index] = inner < 0 ? -1 : comment[inner + 1];
    }
  }
  return { quote, comment };
}

/**
 * Boundaries of every entry in an address list, including empty ones. A quote,
 * comment or angle bracket that is never closed is typed text rather than
 * syntax, so it is read literally instead of swallowing later recipients.
 */
export function addressListTokens(value: string): MailboxAddressToken[] {
  const closing = closingIndexes(value);
  const angles: number[] = [];
  const separators: Array<{ index: number; depth: number }> = [];
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"' || char === '(') {
      const end = (char === '"' ? closing.quote : closing.comment)[index + 1];
      if (end >= 0) index = end;
    } else if (char === '<') angles.push(index);
    else if (char === '>') angles.pop();
    else if (SEPARATORS.has(char))
      separators.push({ index, depth: angles.length });
  }
  // Brackets left open stay at the bottom of the stack and never pair, so a
  // separator splits when only those brackets were open before it.
  const tokens: MailboxAddressToken[] = [];
  let start = 0;
  let unclosed = 0;
  for (const { index, depth } of separators) {
    while (unclosed < angles.length && angles[unclosed] < index) unclosed += 1;
    if (depth !== unclosed) continue;
    tokens.push({ start, end: index });
    start = index + 1;
  }
  tokens.push({ start, end: value.length });
  return tokens;
}

/** Non-empty recipients of an address list, trimmed. */
export function splitAddressList(value: string): string[] {
  return addressListTokens(value)
    .map(({ start, end }) => value.slice(start, end).trim())
    .filter((entry) => entry.length > 0);
}

/** `Name <address>`, quoting a display name that contains RFC 5322 specials. */
export function formatMailboxAddress(
  address: string,
  displayName?: string | null
): string {
  const name = displayName?.trim();
  if (!name) return address;
  const phrase = PHRASE_SPECIALS.test(name)
    ? `"${name.replace(/["\\]/g, '\\$&')}"`
    : name;
  return `${phrase} <${address}>`;
}

/**
 * The addr-spec of one recipient: its last angle-bracket address outside
 * quoted text and comments, if any.
 */
export function mailboxAddressOf(entry: string): string {
  const closing = closingIndexes(entry);
  let open = -1;
  let address: string | null = null;
  for (let index = 0; index < entry.length; index += 1) {
    const char = entry[index];
    if (char === '"' || char === '(') {
      // An unclosed quote or comment is typed text.
      const end = (char === '"' ? closing.quote : closing.comment)[index + 1];
      if (end >= 0) index = end;
    } else if (char === '<') open = index;
    else if (char === '>' && open >= 0) {
      address = entry.slice(open + 1, index);
      open = -1;
    }
  }
  return (address ?? entry).trim();
}
