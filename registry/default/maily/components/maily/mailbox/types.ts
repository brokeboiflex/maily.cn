import type { EditorProps } from '../editor';
import type {
  MailyMailboxComposeSeed,
  MailyMailboxComposeSeedContext,
  MailyMailboxComposeSeedKind,
} from './compose-seed';
import type { MailyMailboxContactSuggestion } from './contacts';
import type { MailyMailboxDraftCapabilities } from './draft-capabilities';
import type { MailyMailboxLabels } from './labels';
import type { MailyMailboxMessageActionContext } from './message-actions';
import type { MailyMailboxSearchQuery } from './search';

/** Adapter callbacks may return a value or a Promise of it. */
export type MaybePromise<T> = T | Promise<T>;

export type MailyMailboxFolder =
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'bounced'
  | 'spam'
  | 'trash'
  | 'allMail'
  | 'starred';

export type MailyMailboxLabel = { id: string; name: string };

export type MailyMailboxMessageStatus =
  'draft' | 'queued' | 'sent' | 'failed' | 'dsn';

export type MailyMailboxAccount = {
  id?: string;
  address?: string;
  displayName?: string | null;
};

export type MailyMailboxMessageRow = {
  _revision?: string;
  id: string;
  direction: 'in' | 'out';
  fromAddress: string;
  toAddresses: string[];
  subject: string | null;
  snippet?: string | null;
  status: MailyMailboxMessageStatus;
  hasAttachments?: boolean;
  isFavorite?: boolean;
  isUnread?: boolean;
  labels?: string[];
  threadId?: string;
  createdAt: string | Date;
};

export type MailyMailboxAttachment = {
  id?: string;
  filename: string;
  contentType?: string;
  size?: number;
};

export type MailyMailboxAttachmentDownloadInput = {
  messageId: string;
  attachment: MailyMailboxAttachment;
  /** Position in getMessage().attachments; filenames need not be unique. */
  attachmentIndex: number;
};

export type MailyMailboxEvent = {
  id: string;
  type: string;
  detail?: unknown;
  createdAt: string | Date;
};

export type MailyMailboxMessageDetail = MailyMailboxMessageRow & {
  ccAddresses?: string[] | null;
  bccAddresses?: string[] | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  headers?: Record<string, string> | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
  attachments?: MailyMailboxAttachment[];
  lastError?: string | null;
  events?: MailyMailboxEvent[];
};

export type MailyMailboxMessageList = {
  items: MailyMailboxMessageRow[];
  nextCursor?: string | null;
  /** Total rows matching the current folder and search, when the host knows it. */
  total?: number;
};

export type MailyMailboxCounts = Record<MailyMailboxFolder, number>;

export type MailyMailboxSendDraftOptions = {
  /**
   * Revision of the draft this send delivers: the last acknowledged write, or
   * the revision observed when the draft was opened. Hosts can reject the send
   * when the stored draft no longer matches it.
   */
  revision?: string;
};

export type MailyMailboxDraftInput = {
  /** Revision observed with the editable draft, forwarded by the host as If-Match. */
  revision?: string;
  /**
   * Sent to `createDraft` and `sendMessage`. It identifies this exact request:
   * a retry with the same content reuses it, so the host can deduplicate one
   * whose response was lost; changed content gets a new key, so the host must
   * never answer it with an earlier result.
   */
  idempotencyKey?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  text: string | null;
  html?: string | null;
  inReplyTo?: string | null;
  attachments?: MailyMailboxUploadedAttachment[];
};

export type MailyMailboxUploadedAttachment = {
  id: string;
  filename: string;
  contentType?: string;
  size?: number;
};

export type MailyMailboxThread = {
  threadId: string;
  messages: MailyMailboxMessageDetail[];
};

export type MailyMailboxComposeValues = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  text: string;
  html?: string | null;
  attachments?: MailyMailboxUploadedAttachment[];
};

export type MailyMailboxComposeBodyMode = 'plainText' | 'mailyEditor';

export type MailyMailboxMessageAction =
  | 'archive'
  | 'delete'
  | 'restore'
  | 'notSpam'
  | 'deleteForever'
  | 'favorite'
  | 'markUnread'
  | 'markRead'
  | 'blockSender'
  | 'reportSpam'
  | 'reportPhishing'
  | 'reportIllegal'
  | 'filterSimilar'
  | 'translate'
  | 'print'
  | 'download'
  | 'showOriginal'
  | 'feedback'
  | 'react';

export type MailyMailboxMessageActionInput = {
  messageId: string;
  action: MailyMailboxMessageAction;
  value?: string | boolean | null;
};

export type MailyMailboxMessageActionResult =
  | void
  | {
      id?: string;
      undo?: { token: string; expiresAt?: string | number | Date };
      /**
       * The message no longer belongs to the folder or label in view (for
       * example after Archive in Inbox), so the reader closes. Otherwise the
       * reader stays open and re-reads the message.
       */
      removedFromView?: boolean;
    }
  | MailyMailboxMessageDetail;

export type MailyMailboxMessageActionEvent = MailyMailboxMessageActionInput & {
  message: MailyMailboxMessageDetail;
};

export type MailyMailboxDataSource = {
  listMessages: (params: {
    folder: MailyMailboxFolder;
    q?: string;
    search?: MailyMailboxSearchQuery;
    cursor?: string;
    limit?: number;
    labelId?: string;
  }) => MaybePromise<MailyMailboxMessageList>;
  getMessage: (messageId: string) => MaybePromise<MailyMailboxMessageDetail>;
  getThread?: (threadId: string) => MaybePromise<MailyMailboxThread>;
  /** Return the archived RFC822 source as text; never reconstruct it from the DTO. */
  getMessageSource?: (messageId: string) => MaybePromise<string>;
  /** Fetch and save the file using host storage/authentication. */
  downloadAttachment?: (
    input: MailyMailboxAttachmentDownloadInput
  ) => MaybePromise<void>;
  getCounts?: () => MaybePromise<Partial<MailyMailboxCounts>>;
  listLabels?: () => MaybePromise<MailyMailboxLabel[]>;
  createLabel?: (name: string) => MaybePromise<MailyMailboxLabel>;
  renameLabel?: (
    labelId: string,
    name: string
  ) => MaybePromise<MailyMailboxLabel>;
  deleteLabel?: (labelId: string) => MaybePromise<void>;
  applyLabel?: (messageIds: string[], labelId: string) => MaybePromise<void>;
  removeLabel?: (messageIds: string[], labelId: string) => MaybePromise<void>;
  runBulkMessageAction?: (input: {
    messageIds: string[];
    action: MailyMailboxMessageAction;
    value?: string | boolean | null;
  }) => MaybePromise<MailyMailboxMessageActionResult>;
  undoMessageAction?: (token: string) => MaybePromise<void>;
  uploadAttachment?: (
    file: File
  ) => MaybePromise<MailyMailboxUploadedAttachment>;
  discardUploadedAttachment?: (
    attachment: MailyMailboxUploadedAttachment
  ) => MaybePromise<void>;
  listContactSuggestions?: (params: {
    q?: string;
    limit?: number;
  }) => MaybePromise<MailyMailboxContactSuggestion[]>;
  /** Draft callbacks are optional; omit them for a read-only mailbox. */
  createDraft?: (
    draft: MailyMailboxDraftInput
  ) => MaybePromise<
    { id: string; _revision?: string } | MailyMailboxMessageDetail
  >;
  updateDraft?: (
    messageId: string,
    draft: MailyMailboxDraftInput
  ) => MaybePromise<
    { id: string; _revision?: string } | MailyMailboxMessageDetail
  >;
  discardDraft?: (messageId: string) => MaybePromise<void | { id: string }>;
  /**
   * Sends a composition that has no saved draft, without creating one. Saved
   * drafts are sent with `sendDraft`.
   */
  sendMessage?: (draft: MailyMailboxDraftInput) => MaybePromise<void | {
    id?: string;
    messageId?: string;
    status?: string;
  }>;
  sendDraft?: (
    messageId: string,
    options: MailyMailboxSendDraftOptions
  ) => MaybePromise<void | {
    id?: string;
    messageId?: string;
    status?: string;
  }>;
  runMessageAction?: (
    input: MailyMailboxMessageActionInput
  ) => MaybePromise<MailyMailboxMessageActionResult>;
};

/** Imperative handle of `MailboxView`, through its `ref`. */
export type MailyMailboxHandle = {
  /** Reads counts, labels and the current list again, e.g. after host changes. */
  refresh: () => Promise<void>;
};

export type MailyMailboxViewProps = {
  /** The signed-in account. A changed `account.id` starts a new mailbox session. */
  account?: MailyMailboxAccount;
  dataSource: MailyMailboxDataSource;
  /**
   * Actions the host supports, gated by `runMessageAction` (reader) and
   * `runBulkMessageAction` (bulk). An array offers the same actions
   * everywhere; a function decides per folder, label, search and surface.
   * `defaultMailboxMessageActionsFor` provides Gmail-style folder rules.
   */
  messageActions?:
    | readonly MailyMailboxMessageAction[]
    | ((
        context: MailyMailboxMessageActionContext
      ) => readonly MailyMailboxMessageAction[]);
  /**
   * Withholds draft operations by setting them to `false`; omitted operations
   * follow their data-source callbacks. Change this prop, not `dataSource`,
   * when access changes: a new data source starts a new mailbox lifetime.
   */
  draftCapabilities?: MailyMailboxDraftCapabilities;
  labels?: MailyMailboxLabels;
  className?: string;
  initialFolder?: MailyMailboxFolder;
  /**
   * Folders shown in the navigation, in order. Defaults to every folder: Inbox,
   * Starred, Sent, Drafts, All Mail, Spam and Trash. Without Inbox, also set
   * `initialFolder` (or `folder`) to one of them.
   */
  folders?: readonly MailyMailboxFolder[];
  /** Controlled navigation values are authoritative; callbacks request changes. */
  folder?: MailyMailboxFolder;
  onFolderChange?: (folder: MailyMailboxFolder) => void;
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  searchFilters?: Omit<MailyMailboxSearchQuery, 'text'>;
  defaultSearchFilters?: Omit<MailyMailboxSearchQuery, 'text'>;
  onSearchFiltersChange?: (
    filters: Omit<MailyMailboxSearchQuery, 'text'>
  ) => void;
  /**
   * Where a search looks: the folder in view (default) or All Mail. Maily never
   * changes it.
   */
  searchScope?: 'folder' | 'allMail';
  selectedLabelId?: string | null;
  defaultSelectedLabelId?: string | null;
  onSelectedLabelIdChange?: (id: string | null) => void;
  selectedMessageId?: string | null;
  defaultSelectedMessageId?: string | null;
  onSelectedMessageIdChange?: (id: string | null) => void;
  selectedMessageIds?: string[];
  defaultSelectedMessageIds?: string[];
  onSelectedMessageIdsChange?: (ids: string[]) => void;

  markReadOnOpen?: boolean;
  /**
   * Reloads counts and the current list on this interval. Off (0) by default;
   * call `refresh()` on the ref when the host knows the data changed.
   */
  pollIntervalMs?: number;
  /**
   * Saves the open composition this long after the last edit, through
   * `createDraft`/`updateDraft`. Off (`false`) by default.
   */
  autosaveDelayMs?: number | false;
  /**
   * Initial values for Reply, Reply all and Forward. Defaults to
   * `defaultMailboxComposeSeed`.
   */
  createComposeSeed?: (
    kind: MailyMailboxComposeSeedKind,
    message: MailyMailboxMessageDetail,
    context: MailyMailboxComposeSeedContext
  ) => MailyMailboxComposeSeed;
  pageSize?: number;
  contactSuggestions?: MailyMailboxContactSuggestion[];
  contactSuggestionLimit?: number;
  defaultComposeBodyMode?: MailyMailboxComposeBodyMode;
  allowComposeBodyModeSwitch?: boolean;
  composeEditorProps?: Omit<
    EditorProps,
    'contentHtml' | 'contentJson' | 'onCreate' | 'onUpdate'
  >;
  onError?: (error: unknown, action: string) => void;
  onSent?: (result: unknown) => void;
  onDraftSaved?: (messageId: string) => void;
  onMessageAction?: (event: MailyMailboxMessageActionEvent) => void;
  formatDate?: (date: string | Date, mode: 'short' | 'long') => string;
};
