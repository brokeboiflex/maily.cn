export type MailyMailboxThreadedMessage = {
  id: string;
  threadId?: string | null;
  fromAddress: string;
  toAddresses: readonly string[];
  ccAddresses?: readonly string[] | null;
  subject: string | null;
  createdAt: string | Date;
  isUnread?: boolean;
};

export type MailyMailboxConversation<T extends MailyMailboxThreadedMessage> = {
  /** Null means this message had no host-provided thread ID and is a singleton. */
  threadId: string | null;
  messages: T[];
  latestAt: Date;
  subject: string | null;
  participants: string[];
  unreadCount: number;
};

/** Groups only by host-supplied threadId; missing IDs always remain singletons. */
export function groupMailboxMessagesByThread<
  T extends MailyMailboxThreadedMessage,
>(messages: readonly T[]): MailyMailboxConversation<T>[] {
  const groups = new Map<string, { threadId: string | null; messages: T[] }>();
  for (const [index, message] of messages.entries()) {
    const threadId = message.threadId?.trim() || null;
    // Separate namespaces keep host IDs distinct from unthreaded message IDs.
    const key = threadId
      ? `thread:${threadId}`
      : `message:${index}:${message.id}`;
    const group = groups.get(key) ?? { threadId, messages: [] };
    group.messages.push(message);
    groups.set(key, group);
  }

  return [...groups.values()].map(({ threadId, messages: groupMessages }) =>
    getMailboxConversationMetadata(threadId, groupMessages)
  );
}

export function getMailboxConversationMetadata<
  T extends MailyMailboxThreadedMessage,
>(
  threadId: string | null,
  messages: readonly T[]
): MailyMailboxConversation<T> {
  const ordered = [...messages].sort(
    (a, b) => toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime()
  );
  const latest = ordered[ordered.length - 1];
  const seen = new Set<string>();
  const participants: string[] = [];
  for (const message of ordered) {
    for (const address of [
      message.fromAddress,
      ...message.toAddresses,
      ...(message.ccAddresses ?? []),
    ]) {
      const trimmed = address.trim();
      const key = trimmed.toLocaleLowerCase('en-US');
      if (!trimmed || seen.has(key)) continue;
      seen.add(key);
      participants.push(trimmed);
    }
  }
  return {
    threadId,
    messages: ordered,
    latestAt: latest ? toDate(latest.createdAt) : new Date(0),
    subject: latest?.subject ?? null,
    participants,
    unreadCount: ordered.filter((message) => message.isUnread).length,
  };
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}
