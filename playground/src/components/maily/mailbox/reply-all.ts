export type MailyMailboxReplyAllInput = {
  fromAddress: string;
  toAddresses?: readonly string[] | null;
  ccAddresses?: readonly string[] | null;
};

export type MailyMailboxReplyAllRecipients = {
  to: string[];
  cc: string[];
};

/**
 * Builds Reply all recipients: sender and original To recipients stay in To;
 * original Cc recipients stay in Cc.
 * Account addresses and duplicates are compared case-insensitively. Bcc is never
 * read or returned, so it cannot be disclosed by this helper.
 */
export function getMailboxReplyAllRecipients(
  message: MailyMailboxReplyAllInput,
  ownAddresses: readonly (string | null | undefined)[] = []
): MailyMailboxReplyAllRecipients {
  const own = new Set(
    ownAddresses
      .filter((address): address is string => typeof address === 'string')
      .map(normalizeAddress)
      .filter((address) => address.length > 0)
  );
  const sender = message.fromAddress.trim();
  const to: string[] = [];
  const cc: string[] = [];
  const seen = new Set(own);
  appendUnique(to, sender ? [sender] : [], seen);
  appendUnique(to, message.toAddresses ?? [], seen);
  appendUnique(cc, message.ccAddresses ?? [], seen);

  return { to, cc };
}

function normalizeAddress(address: string): string {
  const trimmed = address.trim();
  const mailbox = trimmed.match(/<\s*([^<>]+?)\s*>/);
  return (mailbox?.[1] ?? trimmed).trim().toLocaleLowerCase('en-US');
}

function appendUnique(
  output: string[],
  addresses: readonly string[],
  seen: Set<string>
): void {
  for (const address of addresses) {
    const trimmed = address.trim();
    const key = normalizeAddress(trimmed);
    if (!trimmed || !key || seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }
}
