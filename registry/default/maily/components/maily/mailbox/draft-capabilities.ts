/**
 * Draft operations a host can allow independently while the mailbox stays
 * mounted. Each one also requires its data-source callback.
 */
export type MailyMailboxDraftCapabilities = {
  /** Persist a new composition with `createDraft`: Compose, Reply, Reply all, Forward. */
  create?: boolean;
  /** Persist changes to an existing draft with `updateDraft`. */
  edit?: boolean;
  /** Deliver a saved draft with `sendDraft`, or a new composition with `sendMessage`. */
  send?: boolean;
  /** Delete a persisted draft with `discardDraft`. */
  discard?: boolean;
};

export type MailyMailboxDraftCapability = keyof MailyMailboxDraftCapabilities;

export type MailboxDraftCapabilities = Record<
  MailyMailboxDraftCapability,
  boolean
> & {
  /** A new composition can be sent with `sendMessage`, without a saved draft. */
  sendMessage: boolean;
};

type DraftCallbacks = {
  createDraft?: unknown;
  updateDraft?: unknown;
  sendDraft?: unknown;
  sendMessage?: unknown;
  discardDraft?: unknown;
};

/** `false` withholds an operation; no value can enable a missing callback. */
export function resolveMailboxDraftCapabilities(
  dataSource: DraftCallbacks,
  requested: MailyMailboxDraftCapabilities = {}
): MailboxDraftCapabilities {
  const send = requested.send !== false;
  return {
    create:
      requested.create !== false &&
      typeof dataSource.createDraft === 'function',
    edit:
      requested.edit !== false && typeof dataSource.updateDraft === 'function',
    send: send && typeof dataSource.sendDraft === 'function',
    sendMessage: send && typeof dataSource.sendMessage === 'function',
    discard:
      requested.discard !== false &&
      typeof dataSource.discardDraft === 'function',
  };
}

/** Compose, Reply, Reply all and Forward need a way to keep or send the result. */
export function canStartComposition(capabilities: MailboxDraftCapabilities) {
  return capabilities.create || capabilities.sendMessage;
}

export type MailboxComposeState = {
  /** The composition already has a host draft ID. */
  persisted: boolean;
  /** Local content differs from the last acknowledged write, or uploads are pending. */
  dirty: boolean;
};

export type MailboxComposeOperations = {
  /** Fields accept input. Unsaved local work is never locked. */
  editable: boolean;
  /** Save draft. */
  save: boolean;
  /** Attachment uploads: the result can be saved or sent. */
  attach: boolean;
  /** Every later autosave edits the draft, including one the first save creates. */
  autosave: boolean;
  /** Saved drafts without edit can only be sent unchanged. */
  send: boolean;
  /** Unsaved compositions close locally; persisted drafts need `discardDraft`. */
  discard: boolean;
};

export function getMailboxComposeOperations(
  capabilities: MailboxDraftCapabilities,
  { persisted, dirty }: MailboxComposeState
): MailboxComposeOperations {
  const save = persisted ? capabilities.edit : capabilities.create;
  const sendNew =
    capabilities.sendMessage || (capabilities.create && capabilities.send);

  return {
    editable: save || dirty || (!persisted && sendNew),
    save,
    attach: save || (!persisted && sendNew),
    autosave: capabilities.edit && (persisted || capabilities.create),
    send: persisted
      ? capabilities.send && (capabilities.edit || !dirty)
      : sendNew,
    discard: persisted ? capabilities.discard : true,
  };
}
