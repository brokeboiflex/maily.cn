import type { MailyMailboxFolder, MailyMailboxMessageAction } from './types';

/** Where message actions are offered, passed to a `messageActions` function. */
export type MailyMailboxMessageActionContext = {
  /**
   * `reader`: the open message. `bulk`: the selected list rows. `list`: the
   * per-row star (favorite) control.
   */
  surface: 'reader' | 'bulk' | 'list';
  /** The folder in view. */
  folder: MailyMailboxFolder;
  /** The label in view, if any. */
  labelId: string | null;
  /** Whether a search spans the folder in view or all mail. */
  searchScope: 'folder' | 'allMail';
  /** Whether a search text or filter is active. */
  searching: boolean;
  /** The messages the actions apply to; empty for `list`. */
  messageIds: readonly string[];
};

const LEAVE_SPAM_AND_TRASH = new Set<MailyMailboxMessageAction>([
  'delete',
  'reportSpam',
]);

/**
 * Gmail-style folder rules, for hosts that want them: Archive in Inbox, Not
 * spam in Spam, Delete forever in Trash and Spam, Move to Inbox in Trash, All
 * Mail and Starred, and no Delete or Report spam inside Trash or Spam. A search
 * across all mail behaves like All Mail. Maily applies no rules of its own:
 * pass `messageActions={(context) => defaultMailboxMessageActionsFor(context, actions)}`.
 */
export function defaultMailboxMessageActionsFor(
  context: MailyMailboxMessageActionContext,
  actions: readonly MailyMailboxMessageAction[]
): MailyMailboxMessageAction[] {
  const allMail = context.searching && context.searchScope === 'allMail';
  const folder = allMail ? 'allMail' : context.folder;
  const inSpamOrTrash = folder === 'spam' || folder === 'trash';
  return actions.filter((action) => {
    if (action === 'archive') return folder === 'inbox';
    if (action === 'notSpam') return folder === 'spam';
    if (action === 'deleteForever') return inSpamOrTrash;
    if (action === 'restore')
      return folder === 'trash' || folder === 'allMail' || folder === 'starred';
    if (LEAVE_SPAM_AND_TRASH.has(action)) return !inSpamOrTrash;
    return true;
  });
}
