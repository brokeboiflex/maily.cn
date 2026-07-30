'use client';

import { IconPlaceholder } from "@/components/icon-placeholder"
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Editor, type EditorProps } from '../editor';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from '../editor/components/ui/toggle-group-compat';
import { cn } from '@/lib/utils';

import {
  filterMailboxContactSuggestions,
  type MailyMailboxContactSuggestion,
} from './contacts';

export {
  filterMailboxContactSuggestions,
  type MailyMailboxContactSuggestion,
} from './contacts';

export type MailyMailboxFolder = 'inbox' | 'sent' | 'drafts' | 'bounced';

export type MailyMailboxMessageStatus =
  | 'draft'
  | 'queued'
  | 'sent'
  | 'failed'
  | 'dsn';

export type MailyMailboxAccount = {
  id?: string;
  address?: string;
  displayName?: string | null;
};

export type MailyMailboxMessageRow = {
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
  createdAt: string | Date;
};

export type MailyMailboxAttachment = {
  filename: string;
  contentType?: string;
  size?: number;
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
};

export type MailyMailboxCounts = Record<MailyMailboxFolder, number>;

export type MailyMailboxDraftInput = {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  text: string | null;
  html?: string | null;
  inReplyTo?: string | null;
};

export type MailyMailboxComposeValues = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  text: string;
  html?: string | null;
};

export type MailyMailboxComposeBodyMode = 'plainText' | 'mailyEditor';

type MaybePromise<T> = T | Promise<T>;

export type MailyMailboxMessageAction =
  | 'archive'
  | 'delete'
  | 'favorite'
  | 'markUnread'
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
  | { id?: string }
  | MailyMailboxMessageDetail;

export type MailyMailboxMessageActionEvent = MailyMailboxMessageActionInput & {
  message: MailyMailboxMessageDetail;
};

export type MailyMailboxDataSource = {
  listMessages: (params: {
    folder: MailyMailboxFolder;
    q?: string;
    cursor?: string;
    limit?: number;
  }) => MaybePromise<MailyMailboxMessageList>;
  getMessage: (messageId: string) => MaybePromise<MailyMailboxMessageDetail>;
  getCounts?: () => MaybePromise<Partial<MailyMailboxCounts>>;
  listContactSuggestions?: (params: {
    q?: string;
    limit?: number;
  }) => MaybePromise<MailyMailboxContactSuggestion[]>;
  createDraft: (
    draft: MailyMailboxDraftInput
  ) => MaybePromise<{ id: string } | MailyMailboxMessageDetail>;
  updateDraft: (
    messageId: string,
    draft: MailyMailboxDraftInput
  ) => MaybePromise<{ id: string } | MailyMailboxMessageDetail>;
  discardDraft: (messageId: string) => MaybePromise<void | { id: string }>;
  sendDraft: (messageId: string) => MaybePromise<void | {
    id?: string;
    messageId?: string;
    status?: string;
  }>;
  runMessageAction?: (
    input: MailyMailboxMessageActionInput
  ) => MaybePromise<MailyMailboxMessageActionResult>;
};

export const defaultMailboxLabels = {
  'compose.new': 'New message',
  'compose.editDraft': 'Edit draft',
  'compose.discard': 'Discard',
  'compose.saveDraft': 'Save draft',
  'compose.send': 'Send',
  'compose.saved': 'Draft saved.',
  'compose.sent': 'Message sent.',
  'compose.discarded': 'Draft discarded.',
  'compose.wrote': 'On {date}, {sender} wrote:',
  'compose.forwardedHeader': 'Forwarded message',
  'compose.mode.plainText': 'Plain text',
  'compose.mode.mailyEditor': 'Maily editor',
  'folders.inbox': 'Inbox',
  'folders.sent': 'Sent',
  'folders.drafts': 'Drafts',
  'folders.bounced': 'Bounced',
  'actions.reply': 'Reply',
  'actions.forward': 'Forward',
  'actions.more': 'More',
  'actions.favorite': 'Add star',
  'actions.unfavorite': 'Remove star',
  'actions.react': 'Add reaction',
  'actions.archive': 'Archive',
  'actions.reportSpam': 'Report spam',
  'actions.delete': 'Delete',
  'actions.markUnread': 'Mark as unread',
  'actions.blockSender': 'Block sender',
  'actions.reportPhishing': 'Report phishing',
  'actions.reportIllegal': 'Report illegal content',
  'actions.filterSimilar': 'Filter messages like this',
  'actions.translate': 'Translate',
  'actions.print': 'Print',
  'actions.download': 'Download message',
  'actions.showOriginal': 'Show original',
  'actions.feedback': 'Share feedback',
  'actions.openExternal': 'Open in new window',
  searchPlaceholder: 'Search mail',
  refresh: 'Refresh',
  loading: 'Loading',
  'empty.noSelection': 'Select a message',
  'empty.noSelectionDesc': 'Choose a message or start a new draft.',
  'empty.inbox': 'No messages in the inbox.',
  'empty.sent': 'No sent messages yet.',
  'empty.drafts': 'No drafts yet.',
  'empty.bounced': 'No bounced messages.',
  'message.unknownSender': 'Unknown sender',
  'message.noSubject': '(no subject)',
  'message.noBody': 'No message body.',
  'message.toPrefix': 'to',
  'message.cc': 'cc',
  'message.bcc': 'bcc',
  'message.to': 'To',
  'contacts.recipientPlaceholder': 'name@example.com, other@example.com',
  'contacts.noSuggestions': 'No contacts found.',
  'message.subject': 'Subject',
  'message.body': 'Body',
  'message.bounced': 'Bounced',
  'message.queued': 'Queued',
  'message.attachments': 'Attachments ({count})',
  'errors.refresh': 'Could not refresh the mailbox.',
  'errors.detail': 'Could not load the message.',
  'errors.saveDraft': 'Could not save the draft.',
  'errors.send': 'Could not send the message.',
  'errors.discard': 'Could not discard the draft.',
  'errors.messageAction': 'Could not update the message.',
} as const;

export type MailyMailboxLabelKey = keyof typeof defaultMailboxLabels;
export type MailyMailboxLabels = Record<MailyMailboxLabelKey, string>;

export type MailyMailboxViewProps = {
  account?: MailyMailboxAccount;
  dataSource: MailyMailboxDataSource;
  labels?: MailyMailboxLabels;
  className?: string;
  initialFolder?: MailyMailboxFolder;
  pollIntervalMs?: number;
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

const FOLDERS: MailyMailboxFolder[] = ['inbox', 'sent', 'drafts', 'bounced'];

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_CONTACT_SUGGESTION_LIMIT = 8;

function emptyCounts(): MailyMailboxCounts {
  return {
    inbox: 0,
    sent: 0,
    drafts: 0,
    bounced: 0,
  };
}

function emptyComposeValues(): MailyMailboxComposeValues {
  return {
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    text: '',
    html: null,
  };
}

function detailToComposeValues(
  detail: MailyMailboxMessageDetail
): MailyMailboxComposeValues {
  return {
    to: (detail.toAddresses ?? []).join(', '),
    cc: (detail.ccAddresses ?? []).join(', '),
    bcc: (detail.bccAddresses ?? []).join(', '),
    subject: detail.subject ?? '',
    text: detail.bodyText ?? '',
    html: detail.bodyHtml ?? null,
  };
}

function parseAddresses(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function composeValuesToMailboxDraft(
  values: MailyMailboxComposeValues,
  inReplyTo?: string | null
): MailyMailboxDraftInput {
  return {
    to: parseAddresses(values.to),
    cc: parseAddresses(values.cc),
    bcc: parseAddresses(values.bcc),
    subject: values.subject.trim() || null,
    text: values.text.length > 0 ? values.text : null,
    html: values.html?.trim() ? values.html : null,
    inReplyTo: inReplyTo ?? null,
  };
}

function formatRecipients(addrs: string[] | null | undefined): string {
  return (addrs ?? []).join(', ');
}

function defaultFormatDate(
  date: string | Date,
  mode: 'short' | 'long'
): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '';

  if (mode === 'short') {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function subjectWithPrefix(prefix: 'Re:' | 'Fwd:', subject: string | null) {
  const clean = subject?.trim() || '';
  if (!clean) return prefix;
  return clean.toLowerCase().startsWith(prefix.toLowerCase())
    ? clean
    : `${prefix} ${clean}`;
}

function quotedBody(text: string | null | undefined) {
  return (text ?? '')
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function createReplyComposeValues(
  detail: MailyMailboxMessageDetail,
  intro: string
): MailyMailboxComposeValues {
  return {
    to: detail.fromAddress,
    cc: '',
    bcc: '',
    subject: subjectWithPrefix('Re:', detail.subject),
    text: `\n\n${intro}\n${quotedBody(detail.bodyText)}`,
    html: null,
  };
}

function createForwardComposeValues(
  detail: MailyMailboxMessageDetail,
  header: string
): MailyMailboxComposeValues {
  const recipients = formatRecipients(detail.toAddresses);
  return {
    to: '',
    cc: '',
    bcc: '',
    subject: subjectWithPrefix('Fwd:', detail.subject),
    text: `\n\n---------- ${header} ----------\nFrom: ${detail.fromAddress}\nTo: ${recipients}\nSubject: ${detail.subject ?? ''}\n\n${detail.bodyText ?? ''}`,
    html: null,
  };
}

function senderInitial(addr: string): string {
  return (addr.trim()[0] ?? '?').toUpperCase();
}

function senderHue(addr: string): number {
  let h = 0;
  for (let i = 0; i < addr.length; i += 1) {
    h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function interpolate(label: string, vars?: Record<string, string | number>) {
  if (!vars) return label;
  return label.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key])
  );
}

function folderIcon(folder: MailyMailboxFolder, className: string) {
  switch (folder) {
    case 'inbox':
      return <IconPlaceholder
  lucide="Inbox"
  tabler="IconInbox"
  hugeicons="InboxIcon"
  phosphor="Tray"
  remixicon="RiInboxLine"
  className={className}
/>;
    case 'sent':
      return <IconPlaceholder
  lucide="Send"
  tabler="IconSend"
  hugeicons="MailSend02Icon"
  phosphor="PaperPlaneTilt"
  remixicon="RiSendPlaneLine"
  className={className}
/>;
    case 'drafts':
      return <IconPlaceholder
  lucide="FileText"
  tabler="IconFileText"
  hugeicons="File02Icon"
  phosphor="FileText"
  remixicon="RiFileTextLine"
  className={className}
/>;
    case 'bounced':
      return <IconPlaceholder
  lucide="AlertCircle"
  tabler="IconAlertCircle"
  hugeicons="AlertCircleIcon"
  phosphor="WarningCircle"
  remixicon="RiErrorWarningLine"
  className={className}
/>;
  }
}

function errorLabelForAction(action: string): MailyMailboxLabelKey {
  switch (action) {
    case 'detail':
      return 'errors.detail';
    case 'saveDraft':
      return 'errors.saveDraft';
    case 'sendDraft':
      return 'errors.send';
    case 'discardDraft':
      return 'errors.discard';
    case 'messageAction':
      return 'errors.messageAction';
    default:
      return 'errors.refresh';
  }
}

export function MailboxView(props: MailyMailboxViewProps) {
  const {
    dataSource,
    labels = defaultMailboxLabels,
    className,
    initialFolder = 'inbox',
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    pageSize = DEFAULT_PAGE_SIZE,
    contactSuggestions = [],
    contactSuggestionLimit = DEFAULT_CONTACT_SUGGESTION_LIMIT,
    defaultComposeBodyMode = 'plainText',
    allowComposeBodyModeSwitch = true,
    composeEditorProps,
    onError,
    onSent,
    onDraftSaved,
    onMessageAction,
    formatDate = defaultFormatDate,
  } = props;

  const t = React.useCallback(
    (key: MailyMailboxLabelKey, vars?: Record<string, string | number>) =>
      interpolate(labels[key], vars),
    [labels]
  );

  const [folder, setFolder] = React.useState<MailyMailboxFolder>(initialFolder);
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [composeDraftId, setComposeDraftId] = React.useState<string | null>(
    null
  );
  const [composeSeed, setComposeSeed] =
    React.useState<MailyMailboxComposeValues | null>(null);
  const [composeInReplyTo, setComposeInReplyTo] = React.useState<string | null>(
    null
  );

  const [counts, setCounts] = React.useState<MailyMailboxCounts>(emptyCounts);
  const [messages, setMessages] = React.useState<MailyMailboxMessageList>({
    items: [],
    nextCursor: null,
  });
  const [detail, setDetail] = React.useState<MailyMailboxMessageDetail | null>(
    null
  );

  const [messagesLoading, setMessagesLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [discarding, setDiscarding] = React.useState(false);
  const [messageActionPending, setMessageActionPending] =
    React.useState<MailyMailboxMessageAction | null>(null);
  const [errorKey, setErrorKey] = React.useState<MailyMailboxLabelKey | null>(
    null
  );

  const reportError = React.useCallback(
    (error: unknown, action: string) => {
      setErrorKey(errorLabelForAction(action));
      onError?.(error, action);
    },
    [onError]
  );

  const loadContactSuggestions = React.useCallback(
    async (q: string) => {
      if (dataSource.listContactSuggestions) {
        return dataSource.listContactSuggestions({
          q,
          limit: contactSuggestionLimit,
        });
      }

      return filterMailboxContactSuggestions(
        contactSuggestions,
        q,
        contactSuggestionLimit
      );
    },
    [contactSuggestionLimit, contactSuggestions, dataSource]
  );

  const refreshCounts = React.useCallback(async () => {
    if (!dataSource.getCounts) {
      setCounts(emptyCounts());
      return;
    }
    const next = await dataSource.getCounts();
    setCounts({ ...emptyCounts(), ...next });
  }, [dataSource]);

  const refreshMessages = React.useCallback(
    async (folderOverride?: MailyMailboxFolder) => {
      const nextFolder = folderOverride ?? folder;
      const q = search.trim();
      const next = await dataSource.listMessages({
        folder: nextFolder,
        q: q.length > 0 ? q : undefined,
        limit: pageSize,
      });
      setMessages(next);
    },
    [dataSource, folder, pageSize, search]
  );

  const refreshMailbox = React.useCallback(
    async (folderOverride?: MailyMailboxFolder) => {
      setRefreshing(true);
      try {
        await Promise.all([refreshCounts(), refreshMessages(folderOverride)]);
        setErrorKey(null);
      } catch (error) {
        reportError(error, 'refresh');
      } finally {
        setRefreshing(false);
        setMessagesLoading(false);
      }
    },
    [refreshCounts, refreshMessages, reportError]
  );

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setMessagesLoading(true);
      try {
        await Promise.all([refreshCounts(), refreshMessages()]);
      } catch (error) {
        if (!cancelled) {
          reportError(error, 'refresh');
          setMessages({ items: [], nextCursor: null });
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    run();
    if (pollIntervalMs <= 0)
      return () => {
        cancelled = true;
      };

    const id = window.setInterval(run, pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollIntervalMs, refreshCounts, refreshMessages, reportError]);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selectedId) {
        setDetail(null);
        return;
      }

      setDetailLoading(true);
      try {
        const next = await dataSource.getMessage(selectedId);
        if (!cancelled) {
          setDetail(next);
          setErrorKey(null);
        }
      } catch (error) {
        if (!cancelled) {
          setDetail(null);
          reportError(error, 'detail');
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [dataSource, reportError, selectedId]);

  const selectFolder = (next: MailyMailboxFolder) => {
    setFolder(next);
    setSelectedId(null);
    setComposeOpen(false);
    setComposeDraftId(null);
    setComposeSeed(null);
    setComposeInReplyTo(null);
  };

  const selectMessage = (row: MailyMailboxMessageRow) => {
    setSelectedId(row.id);
    if (row.status === 'draft') {
      setComposeDraftId(row.id);
      setComposeSeed(null);
      setComposeInReplyTo(null);
      setComposeOpen(true);
      return;
    }
    setComposeOpen(false);
    setComposeDraftId(null);
    setComposeSeed(null);
    setComposeInReplyTo(null);
  };

  const openNewDraft = () => {
    setSelectedId(null);
    setDetail(null);
    setComposeDraftId(null);
    setComposeSeed(null);
    setComposeInReplyTo(null);
    setComposeOpen(true);
  };

  const saveDraft = async (values: MailyMailboxComposeValues) => {
    const draft = composeValuesToMailboxDraft(values, composeInReplyTo);
    setSaving(true);
    try {
      if (composeDraftId) {
        await dataSource.updateDraft(composeDraftId, draft);
        onDraftSaved?.(composeDraftId);
      } else {
        const created = await dataSource.createDraft(draft);
        const createdId = created.id;
        setComposeDraftId(createdId);
        setSelectedId(createdId);
        setFolder('drafts');
        onDraftSaved?.(createdId);
      }
      await refreshMailbox(composeDraftId ? undefined : 'drafts');
      setErrorKey(null);
    } catch (error) {
      reportError(error, 'saveDraft');
    } finally {
      setSaving(false);
    }
  };

  const sendDraft = async (values: MailyMailboxComposeValues) => {
    const draft = composeValuesToMailboxDraft(values, composeInReplyTo);
    let draftId = composeDraftId;
    setSending(true);
    try {
      if (draftId) {
        await dataSource.updateDraft(draftId, draft);
      } else {
        const created = await dataSource.createDraft(draft);
        draftId = created.id;
      }

      const result = await dataSource.sendDraft(draftId);
      onSent?.(result);
      setComposeOpen(false);
      setComposeDraftId(null);
      setComposeSeed(null);
      setComposeInReplyTo(null);
      setSelectedId(null);
      setFolder('sent');
      await refreshMailbox('sent');
      setErrorKey(null);
    } catch (error) {
      reportError(error, 'sendDraft');
    } finally {
      setSending(false);
    }
  };

  const discardDraft = async () => {
    setDiscarding(true);
    try {
      if (composeDraftId) {
        await dataSource.discardDraft(composeDraftId);
      }
      setComposeOpen(false);
      setComposeDraftId(null);
      setComposeSeed(null);
      setComposeInReplyTo(null);
      setSelectedId(null);
      await refreshMailbox();
      setErrorKey(null);
    } catch (error) {
      reportError(error, 'discardDraft');
    } finally {
      setDiscarding(false);
    }
  };

  const openReply = (message: MailyMailboxMessageDetail) => {
    const date = formatDate(message.createdAt, 'long');
    setSelectedId(message.id);
    setComposeDraftId(null);
    setComposeInReplyTo(message.messageId ?? message.id);
    setComposeSeed(
      createReplyComposeValues(
        message,
        t('compose.wrote', { date, sender: message.fromAddress })
      )
    );
    setComposeOpen(true);
  };

  const openForward = (message: MailyMailboxMessageDetail) => {
    setSelectedId(message.id);
    setComposeDraftId(null);
    setComposeInReplyTo(null);
    setComposeSeed(
      createForwardComposeValues(message, t('compose.forwardedHeader'))
    );
    setComposeOpen(true);
  };

  const runMessageAction = async (
    message: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => {
    setMessageActionPending(action);
    try {
      const input: MailyMailboxMessageActionInput = {
        messageId: message.id,
        action,
        value,
      };
      const result = await dataSource.runMessageAction?.(input);
      onMessageAction?.({ ...input, message });

      if (
        action === 'archive' ||
        action === 'delete' ||
        action === 'reportSpam' ||
        action === 'reportPhishing' ||
        action === 'reportIllegal'
      ) {
        setSelectedId(null);
        setDetail(null);
      } else if (result && 'fromAddress' in result) {
        setDetail(result);
      } else {
        try {
          setDetail(await dataSource.getMessage(message.id));
        } catch {
          setSelectedId(null);
          setDetail(null);
        }
      }

      await refreshMailbox();
      setErrorKey(null);
    } catch (error) {
      reportError(error, 'messageAction');
    } finally {
      setMessageActionPending(null);
    }
  };

  const initialComposeValues = React.useMemo(() => {
    if (composeDraftId && detail?.id === composeDraftId) {
      return detailToComposeValues(detail);
    }
    return composeSeed ?? emptyComposeValues();
  }, [composeDraftId, composeSeed, detail]);

  return (
    <div
      className={cn(
        'maily-mailbox border-border bg-muted/30 text-foreground h-[42rem] max-h-[calc(100vh-2rem)] min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border',
        className
      )}
    >
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full min-h-0 min-w-0"
      >
        <ResizablePanel
          defaultSize="48px"
          minSize="48px"
          maxSize="16rem"
          groupResizeBehavior="preserve-pixel-size"
          className="min-w-12"
        >
          <div className="@container/rail @[4rem]/rail:items-stretch @[4rem]/rail:p-3 flex h-full flex-col items-center gap-2 p-2">
            <Button
              type="button"
              size="icon"
              onClick={openNewDraft}
              className="@[4rem]/rail:w-full @[4rem]/rail:justify-start @[4rem]/rail:gap-2 @[4rem]/rail:px-2.5 justify-center gap-0"
              title={t('compose.new')}
              aria-label={t('compose.new')}
            >
              <IconPlaceholder
  lucide="Pencil"
  tabler="IconPencil"
  hugeicons="PencilIcon"
  phosphor="Pencil"
  remixicon="RiPencilLine"
  className="size-4"
/>
              <span className="@[4rem]/rail:inline hidden min-w-0 truncate">
                {t('compose.new')}
              </span>
            </Button>
            <nav className="@[4rem]/rail:items-stretch flex w-full flex-col items-center gap-0.5">
              {FOLDERS.map((item) => {
                const active = folder === item;
                const count = counts[item] ?? 0;
                return (
                  <Button
                    key={item}
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={t(`folders.${item}`)}
                    aria-label={t(`folders.${item}`)}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => selectFolder(item)}
                    className={cn(
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground @[4rem]/rail:w-full @[4rem]/rail:justify-start @[4rem]/rail:gap-2 @[4rem]/rail:px-2.5 relative justify-center gap-0',
                      active &&
                        'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                    )}
                  >
                    {folderIcon(item, 'size-4')}
                    <span className="@[4rem]/rail:inline hidden min-w-0 flex-1 truncate text-left">
                      {t(`folders.${item}`)}
                    </span>
                    {count > 0 && (
                      <>
                        <Badge
                          variant={active ? 'default' : 'outline'}
                          className="@[4rem]/rail:inline-flex hidden"
                        >
                          {count}
                        </Badge>
                        <span
                          aria-hidden
                          className="bg-primary @[4rem]/rail:hidden absolute right-1 top-1 size-1.5 rounded-full"
                        />
                      </>
                    )}
                  </Button>
                );
              })}
            </nav>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize="28%" minSize="18rem" className="min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-border border-b p-2">
              <InputGroup className="bg-muted/30 h-8">
                <InputGroupAddon>
                  <IconPlaceholder
  lucide="Search"
  tabler="IconSearch"
  hugeicons="Search01Icon"
  phosphor="MagnifyingGlass"
  remixicon="RiSearchLine"
  className="size-4"
/>
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(event.target.value)
                  }
                  placeholder={t('searchPlaceholder')}
                  className="h-7 px-1.5 py-0"
                />
                {refreshing && (
                  <InputGroupAddon align="inline-end">
                    <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
                      aria-label={t('refresh')}
/>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <MessageList
                folder={folder}
                labels={labels}
                rows={messages.items}
                isLoading={messagesLoading}
                selectedId={selectedId}
                onSelect={selectMessage}
                formatDate={formatDate}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize="65%" minSize="22rem" className="min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            {errorKey && (
              <div
                role="status"
                className="border-destructive/30 bg-destructive/10 text-destructive flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <IconPlaceholder
  lucide="AlertCircle"
  tabler="IconAlertCircle"
  hugeicons="AlertCircleIcon"
  phosphor="WarningCircle"
  remixicon="RiErrorWarningLine"
  className="size-4 shrink-0"
/>
                <span>{t(errorKey)}</span>
              </div>
            )}
            {composeOpen ? (
              <ScrollArea className="min-h-0 flex-1">
                <Compose
                  initialValues={initialComposeValues}
                  labels={labels}
                  loadContactSuggestions={loadContactSuggestions}
                  defaultBodyMode={defaultComposeBodyMode}
                  allowBodyModeSwitch={allowComposeBodyModeSwitch}
                  editorProps={composeEditorProps}
                  isExistingDraft={!!composeDraftId}
                  isSaving={saving}
                  isSending={sending}
                  isDiscarding={discarding}
                  onSave={saveDraft}
                  onSend={sendDraft}
                  onDiscard={discardDraft}
                />
              </ScrollArea>
            ) : selectedId ? (
              <MessageReader
                detail={detail}
                isLoading={detailLoading}
                labels={labels}
                formatDate={formatDate}
                actionPending={messageActionPending}
                onReply={openReply}
                onForward={openForward}
                onRunAction={runMessageAction}
              />
            ) : (
              <EmptyState
                title={t('empty.noSelection')}
                description={t('empty.noSelectionDesc')}
                className="h-full"
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export const InboxOutboxView = MailboxView;

function MessageList(props: {
  folder: MailyMailboxFolder;
  labels: MailyMailboxLabels;
  rows: MailyMailboxMessageRow[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (row: MailyMailboxMessageRow) => void;
  formatDate: (date: string | Date, mode: 'short' | 'long') => string;
}) {
  const { folder, labels, rows, isLoading, selectedId, onSelect, formatDate } =
    props;
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center gap-2 text-sm">
        <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>
        {t('loading')}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState className="h-full" title={t(`empty.${folder}`)} />;
  }

  return (
    <div className="min-w-0">
      <ul className="divide-border divide-y">
        {rows.map((row) => {
          const active = row.id === selectedId;
          const display =
            row.direction === 'in'
              ? row.fromAddress
              : formatRecipients(row.toAddresses);

          return (
            <li key={row.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelect(row)}
                className={cn(
                  'hover:bg-accent h-auto w-full flex-col items-stretch justify-start gap-1.5 whitespace-normal rounded-none px-3 py-2.5 text-left font-normal',
                  active && 'bg-accent'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm',
                      row.isUnread ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {display || t('message.unknownSender')}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(row.createdAt, 'short')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {row.isFavorite && (
                    <IconPlaceholder
  lucide="Star"
  tabler="IconStar"
  hugeicons="StarIcon"
  phosphor="Star"
  remixicon="RiStarLine"
  className="size-3.5 shrink-0 fill-current text-amber-500"
/>
                  )}
                  <span
                    className={cn(
                      'truncate text-sm',
                      row.isUnread && 'font-semibold'
                    )}
                  >
                    {row.subject || t('message.noSubject')}
                  </span>
                  {row.hasAttachments && (
                    <IconPlaceholder
  lucide="Paperclip"
  tabler="IconPaperclip"
  hugeicons="AttachmentIcon"
  phosphor="Paperclip"
  remixicon="RiAttachmentLine"
  className="text-muted-foreground size-3 shrink-0"
/>
                  )}
                </div>
                {row.snippet && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {row.snippet}
                  </p>
                )}
                {(row.status === 'failed' || row.status === 'dsn') && (
                  <Badge variant="destructive" className="self-start">
                    {t('message.bounced')}
                  </Badge>
                )}
                {row.status === 'queued' && (
                  <Badge variant="outline" className="self-start">
                    {t('message.queued')}
                  </Badge>
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MessageReader(props: {
  detail: MailyMailboxMessageDetail | null;
  isLoading: boolean;
  labels: MailyMailboxLabels;
  formatDate: (date: string | Date, mode: 'short' | 'long') => string;
  actionPending: MailyMailboxMessageAction | null;
  onReply: (detail: MailyMailboxMessageDetail) => void;
  onForward: (detail: MailyMailboxMessageDetail) => void;
  onRunAction: (
    detail: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => Promise<void>;
}) {
  const {
    detail,
    isLoading,
    labels,
    formatDate,
    actionPending,
    onReply,
    onForward,
    onRunAction,
  } = props;
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
        <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>
        {t('loading')}
      </div>
    );
  }

  if (!detail) return null;

  const hue = senderHue(detail.fromAddress);
  const labelsToShow = detail.labels ?? [];
  const isFavorite = detail.isFavorite ?? false;
  const run = (action: MailyMailboxMessageAction, value?: string | boolean) =>
    onRunAction(detail, action, value);

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1">
          <MessageActionButton
            label={t('actions.archive')}
            pending={actionPending === 'archive'}
            onClick={() => run('archive')}
          >
            <IconPlaceholder
  lucide="Archive"
  tabler="IconArchive"
  hugeicons="ArchiveIcon"
  phosphor="Archive"
  remixicon="RiArchiveLine"
  className="size-4"
/>
          </MessageActionButton>
          <MessageActionButton
            label={t('actions.reportSpam')}
            pending={actionPending === 'reportSpam'}
            onClick={() => run('reportSpam')}
          >
            <IconPlaceholder
  lucide="ShieldAlert"
  tabler="IconShieldExclamation"
  hugeicons="SpamIcon"
  phosphor="ShieldWarning"
  remixicon="RiSpam2Line"
  className="size-4"
/>
          </MessageActionButton>
          <MessageActionButton
            label={t('actions.delete')}
            pending={actionPending === 'delete'}
            onClick={() => run('delete')}
          >
            <IconPlaceholder
  lucide="Trash2"
  tabler="IconTrash"
  hugeicons="Delete02Icon"
  phosphor="Trash"
  remixicon="RiDeleteBinLine"
  className="size-4"
/>
          </MessageActionButton>
          <MessageActionButton
            label={t('actions.markUnread')}
            pending={actionPending === 'markUnread'}
            onClick={() => run('markUnread', true)}
          >
            <IconPlaceholder
  lucide="MailOpen"
  tabler="IconMailOpened"
  hugeicons="MailOpenIcon"
  phosphor="EnvelopeOpen"
  remixicon="RiMailOpenLine"
  className="size-4"
/>
          </MessageActionButton>
        </div>
        <div className="flex items-center gap-1">
          <MessageActionButton
            label={t('actions.print')}
            pending={actionPending === 'print'}
            onClick={() => run('print')}
          >
            <IconPlaceholder
  lucide="Printer"
  tabler="IconPrinter"
  hugeicons="PrinterIcon"
  phosphor="Printer"
  remixicon="RiPrinterLine"
  className="size-4"
/>
          </MessageActionButton>
          <MessageActionButton
            label={t('actions.openExternal')}
            pending={false}
            onClick={() => run('showOriginal')}
          >
            <IconPlaceholder
  lucide="ExternalLink"
  tabler="IconExternalLink"
  hugeicons="ArrowUpRight01Icon"
  phosphor="ArrowSquareOut"
  remixicon="RiExternalLinkLine"
  className="size-4"
/>
          </MessageActionButton>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-4 px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 text-xl font-semibold leading-tight">
                {detail.subject || t('message.noSubject')}
              </h2>
              {labelsToShow.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MessageActionButton
              label={
                isFavorite ? t('actions.unfavorite') : t('actions.favorite')
              }
              pending={actionPending === 'favorite'}
              pressed={isFavorite}
              onClick={() => run('favorite', !isFavorite)}
            >
              <IconPlaceholder
  lucide="Star"
  tabler="IconStar"
  hugeicons="StarIcon"
  phosphor="Star"
  remixicon="RiStarLine"
  className={cn(
                  'size-4',
                  isFavorite && 'fill-current text-amber-500'
                )}
/>
            </MessageActionButton>
            <MessageActionButton
              label={t('actions.react')}
              pending={actionPending === 'react'}
              onClick={() => run('react', 'smile')}
            >
              <IconPlaceholder
  lucide="Smile"
  tabler="IconMoodSmile"
  hugeicons="SmileIcon"
  phosphor="Smiley"
  remixicon="RiEmotionHappyLine"
  className="size-4"
/>
            </MessageActionButton>
            <MessageActionButton
              label={t('actions.reply')}
              pending={false}
              onClick={() => onReply(detail)}
            >
              <IconPlaceholder
  lucide="Reply"
  tabler="IconCornerUpLeft"
  hugeicons="MailReply01Icon"
  phosphor="ArrowBendUpLeft"
  remixicon="RiReplyLine"
  className="size-4"
/>
            </MessageActionButton>
            <MessageMoreMenu
              detail={detail}
              labels={labels}
              actionPending={actionPending}
              onReply={onReply}
              onForward={onForward}
              onRunAction={onRunAction}
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: `hsl(${hue} 55% 45%)` }}
          >
            {senderInitial(detail.fromAddress)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">
                {detail.fromAddress}
              </span>
              <time className="text-muted-foreground shrink-0 text-xs">
                {formatDate(detail.createdAt, 'long')}
              </time>
            </div>
            <div className="text-muted-foreground text-xs">
              {t('message.toPrefix')}{' '}
              <span>{formatRecipients(detail.toAddresses)}</span>
              {detail.ccAddresses && detail.ccAddresses.length > 0 && (
                <>
                  {' - '}
                  {t('message.cc')}{' '}
                  <span>{formatRecipients(detail.ccAddresses)}</span>
                </>
              )}
            </div>
            {detail.lastError && (
              <div className="text-destructive mt-1 text-xs">
                {detail.lastError}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 pt-4">
        <ScrollArea className="h-full">
          <div className="px-2">
            {detail.bodyHtml ? (
              <HtmlBody html={detail.bodyHtml} />
            ) : detail.bodyText ? (
              <pre className="whitespace-pre-wrap px-4 py-2 font-sans text-sm leading-relaxed">
                {detail.bodyText}
              </pre>
            ) : (
              <p className="text-muted-foreground px-4 py-2 text-sm">
                {t('message.noBody')}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </article>
  );
}

function MessageActionButton(props: {
  label: string;
  pending: boolean;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.pressed}
      disabled={props.pending}
      onClick={props.onClick}
      className={props.className}
    >
      {props.pending ? (
        <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>
      ) : (
        props.children
      )}
    </Button>
  );
}

function MessageMoreMenu(props: {
  detail: MailyMailboxMessageDetail;
  labels: MailyMailboxLabels;
  actionPending: MailyMailboxMessageAction | null;
  onReply: (detail: MailyMailboxMessageDetail) => void;
  onForward: (detail: MailyMailboxMessageDetail) => void;
  onRunAction: (
    detail: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => Promise<void>;
}) {
  const { detail, labels, actionPending, onReply, onForward, onRunAction } =
    props;
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);
  const item = (
    action: MailyMailboxMessageAction,
    label: MailyMailboxLabelKey,
    icon: React.ReactNode,
    value?: string | boolean | null,
    variant?: 'default' | 'destructive'
  ) => (
    <DropdownMenuItem
      onSelect={() => onRunAction(detail, action, value)}
      disabled={actionPending !== null}
      variant={variant}
    >
      {actionPending === action ? (
        <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>
      ) : (
        icon
      )}
      {t(label)}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={t('actions.more')}
          aria-label={t('actions.more')}
        >
          <IconPlaceholder
  lucide="MoreVertical"
  tabler="IconDotsVertical"
  hugeicons="MoreVerticalIcon"
  phosphor="DotsThreeVertical"
  remixicon="RiMore2Line"
  className="size-4"
/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onSelect={() => onReply(detail)}>
          <IconPlaceholder
  lucide="Reply"
  tabler="IconCornerUpLeft"
  hugeicons="MailReply01Icon"
  phosphor="ArrowBendUpLeft"
  remixicon="RiReplyLine"
  className="size-4"
/>
          {t('actions.reply')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onForward(detail)}>
          <IconPlaceholder
  lucide="Forward"
  tabler="IconArrowForward"
  hugeicons="Forward01Icon"
  phosphor="ArrowBendUpRight"
  remixicon="RiShareForwardLine"
  className="size-4"
/>
          {t('actions.forward')}
        </DropdownMenuItem>
        {item(
          'delete',
          'actions.delete',
          <IconPlaceholder
  lucide="Trash2"
  tabler="IconTrash"
  hugeicons="Delete02Icon"
  phosphor="Trash"
  remixicon="RiDeleteBinLine"
  className="size-4"
/>,
          null,
          'destructive'
        )}
        {item(
          'markUnread',
          'actions.markUnread',
          <IconPlaceholder
  lucide="MailOpen"
  tabler="IconMailOpened"
  hugeicons="MailOpenIcon"
  phosphor="EnvelopeOpen"
  remixicon="RiMailOpenLine"
  className="size-4"
/>,
          true
        )}
        {item('blockSender', 'actions.blockSender', <IconPlaceholder
  lucide="Ban"
  tabler="IconBan"
  hugeicons="Cancel01Icon"
  phosphor="Prohibit"
  remixicon="RiForbidLine"
  className="size-4"
/>)}
        {item(
          'reportSpam',
          'actions.reportSpam',
          <IconPlaceholder
  lucide="ShieldAlert"
  tabler="IconShieldExclamation"
  hugeicons="SpamIcon"
  phosphor="ShieldWarning"
  remixicon="RiSpam2Line"
  className="size-4"
/>
        )}
        {item(
          'reportPhishing',
          'actions.reportPhishing',
          <IconPlaceholder
  lucide="Flag"
  tabler="IconFlag"
  hugeicons="Flag01Icon"
  phosphor="Flag"
  remixicon="RiFlagLine"
  className="size-4"
/>
        )}
        {item(
          'reportIllegal',
          'actions.reportIllegal',
          <IconPlaceholder
  lucide="Flag"
  tabler="IconFlag"
  hugeicons="Flag01Icon"
  phosphor="Flag"
  remixicon="RiFlagLine"
  className="size-4"
/>
        )}
        {item(
          'filterSimilar',
          'actions.filterSimilar',
          <IconPlaceholder
  lucide="Filter"
  tabler="IconFilter"
  hugeicons="FilterIcon"
  phosphor="Funnel"
  remixicon="RiFilter3Line"
  className="size-4"
/>
        )}
        {item(
          'translate',
          'actions.translate',
          <IconPlaceholder
  lucide="Languages"
  tabler="IconLanguage"
  hugeicons="TranslateIcon"
  phosphor="Translate"
  remixicon="RiTranslate"
  className="size-4"
/>
        )}
        {item('print', 'actions.print', <IconPlaceholder
  lucide="Printer"
  tabler="IconPrinter"
  hugeicons="PrinterIcon"
  phosphor="Printer"
  remixicon="RiPrinterLine"
  className="size-4"
/>)}
        {item('download', 'actions.download', <IconPlaceholder
  lucide="Download"
  tabler="IconDownload"
  hugeicons="Download01Icon"
  phosphor="DownloadSimple"
  remixicon="RiDownloadLine"
  className="size-4"
/>)}
        {item(
          'showOriginal',
          'actions.showOriginal',
          <IconPlaceholder
  lucide="Code2"
  tabler="IconCode"
  hugeicons="SourceCodeIcon"
  phosphor="Code"
  remixicon="RiCodeLine"
  className="size-4"
/>
        )}
        {item(
          'feedback',
          'actions.feedback',
          <IconPlaceholder
  lucide="AlertCircle"
  tabler="IconAlertCircle"
  hugeicons="AlertCircleIcon"
  phosphor="WarningCircle"
  remixicon="RiErrorWarningLine"
  className="size-4"
/>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HtmlBody({ html }: { html: string }) {
  const ref = React.useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    const frame = ref.current;
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const h = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight
      );
      frame.style.height = `${h + 8}px`;
      doc.addEventListener(
        'wheel',
        (event) => {
          const viewport = frame.closest(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLElement | null;
          if (!viewport) return;
          const maxTop = viewport.scrollHeight - viewport.clientHeight;
          if (maxTop <= 0) return;
          const unit =
            event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? viewport.clientHeight
                : 1;
          const nextTop = Math.max(
            0,
            Math.min(maxTop, viewport.scrollTop + event.deltaY * unit)
          );
          viewport.scrollTop = nextTop;
          event.preventDefault();
          event.stopPropagation();
        },
        { passive: false }
      );
    } catch {
      frame.style.height = '50vh';
    }
  };

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>
:root { color-scheme: light; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  padding: 8px 16px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #202124;
  word-wrap: break-word;
}
img { max-width: 100%; height: auto; }
table { max-width: 100%; }
a { color: #1a73e8; }
blockquote { margin: 0; padding: 4px 0 4px 12px; border-left: 2px solid #dadce0; color: #5f6368; }
</style></head><body>${html}</body></html>`;

  return (
    <iframe
      ref={ref}
      title="message-html"
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      onLoad={handleLoad}
      className="block w-full bg-white"
      style={{ height: '240px' }}
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToHtml(value: string) {
  const text = value.trim();
  if (!text) return undefined;

  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const html = paragraph
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br>');
      return `<p>${html}</p>`;
    })
    .join('');
}

function composeHtmlContent(values: MailyMailboxComposeValues) {
  return values.html?.trim() || plainTextToHtml(values.text);
}

function Compose(props: {
  initialValues: MailyMailboxComposeValues;
  labels: MailyMailboxLabels;
  loadContactSuggestions: (
    q: string
  ) => MaybePromise<MailyMailboxContactSuggestion[]>;
  defaultBodyMode: MailyMailboxComposeBodyMode;
  allowBodyModeSwitch: boolean;
  editorProps?: Omit<
    EditorProps,
    'contentHtml' | 'contentJson' | 'onCreate' | 'onUpdate'
  >;
  isExistingDraft: boolean;
  isSaving: boolean;
  isSending: boolean;
  isDiscarding: boolean;
  onSave: (values: MailyMailboxComposeValues) => Promise<void>;
  onSend: (values: MailyMailboxComposeValues) => Promise<void>;
  onDiscard: () => Promise<void>;
}) {
  const {
    initialValues,
    labels,
    loadContactSuggestions,
    defaultBodyMode,
    allowBodyModeSwitch,
    editorProps,
    isExistingDraft,
    isSaving,
    isSending,
    isDiscarding,
    onSave,
    onSend,
    onDiscard,
  } = props;
  const [values, setValues] =
    React.useState<MailyMailboxComposeValues>(initialValues);
  const [bodyMode, setBodyMode] =
    React.useState<MailyMailboxComposeBodyMode>(defaultBodyMode);
  const [editorRevision, setEditorRevision] = React.useState(0);
  const [showCc, setShowCc] = React.useState(
    () => initialValues.cc.trim().length > 0
  );
  const [showBcc, setShowBcc] = React.useState(
    () => initialValues.bcc.trim().length > 0
  );
  const [focusRecipient, setFocusRecipient] = React.useState<
    'cc' | 'bcc' | null
  >(null);
  const toInputId = React.useId();
  const ccInputId = React.useId();
  const bccInputId = React.useId();
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);

  React.useEffect(() => {
    setValues(initialValues);
    setBodyMode(defaultBodyMode);
    setEditorRevision((revision) => revision + 1);
    setShowCc(initialValues.cc.trim().length > 0);
    setShowBcc(initialValues.bcc.trim().length > 0);
    setFocusRecipient(null);
  }, [defaultBodyMode, initialValues]);

  const set = (key: keyof MailyMailboxComposeValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setBodyText = (value: string) =>
    setValues((prev) => ({
      ...prev,
      text: value,
      html: bodyMode === 'plainText' ? null : prev.html,
    }));

  const updateFromEditor = React.useCallback(
    (editor: Parameters<NonNullable<EditorProps['onUpdate']>>[0]) => {
      setValues((prev) => ({
        ...prev,
        text: editor.getText({ blockSeparator: '\n' }),
        html: editor.getHTML(),
      }));
    },
    []
  );

  const switchBodyMode = (nextMode: MailyMailboxComposeBodyMode) => {
    setBodyMode(nextMode);
    if (nextMode === 'mailyEditor') {
      setEditorRevision((revision) => revision + 1);
    }
  };

  const editorConfig = editorProps?.config;
  const editorBodyClassName = cn('mt-2 min-h-56', editorConfig?.bodyClassName);
  const editorContentClassName = cn('min-h-48', editorConfig?.contentClassName);

  return (
    <form
      className="flex h-full min-h-0 flex-col gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSend(values);
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">
          {isExistingDraft ? t('compose.editDraft') : t('compose.new')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDiscard()}
            disabled={isDiscarding}
          >
            <IconPlaceholder
  lucide="Trash2"
  tabler="IconTrash"
  hugeicons="Delete02Icon"
  phosphor="Trash"
  remixicon="RiDeleteBinLine"
  className="size-4"
/>
            {t('compose.discard')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSave(values)}
            disabled={isSaving}
          >
            {isSaving && <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>}
            {t('compose.saveDraft')}
          </Button>
          <Button type="submit" size="sm" disabled={isSending}>
            {isSending ? (
              <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>
            ) : (
              <IconPlaceholder
  lucide="Send"
  tabler="IconSend"
  hugeicons="MailSend02Icon"
  phosphor="PaperPlaneTilt"
  remixicon="RiSendPlaneLine"
  className="size-4"
/>
            )}
            {t('compose.send')}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <RecipientField
          id={toInputId}
          label={t('message.to')}
          actions={
            (!showCc || !showBcc) && (
              <div className="flex items-center gap-1">
                {!showCc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setShowCc(true);
                      setFocusRecipient('cc');
                    }}
                    className="text-muted-foreground hover:text-foreground h-auto rounded-sm px-1 py-0 text-sm font-medium hover:bg-transparent"
                  >
                    {t('message.cc')}
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setShowBcc(true);
                      setFocusRecipient('bcc');
                    }}
                    className="text-muted-foreground hover:text-foreground h-auto rounded-sm px-1 py-0 text-sm font-medium hover:bg-transparent"
                  >
                    {t('message.bcc')}
                  </Button>
                )}
              </div>
            )
          }
        >
          <RecipientAutocompleteInput
            id={toInputId}
            value={values.to}
            onChange={(value) => set('to', value)}
            placeholder=""
            emptyLabel={t('contacts.noSuggestions')}
            loadingLabel={t('loading')}
            loadSuggestions={loadContactSuggestions}
            className="h-7 px-2.5 py-0"
          />
        </RecipientField>
        {showCc && (
          <RecipientField id={ccInputId} label={t('message.cc')}>
            <RecipientAutocompleteInput
              id={ccInputId}
              value={values.cc}
              onChange={(value) => set('cc', value)}
              placeholder=""
              emptyLabel={t('contacts.noSuggestions')}
              loadingLabel={t('loading')}
              loadSuggestions={loadContactSuggestions}
              autoFocus={focusRecipient === 'cc'}
              className="h-7 px-2.5 py-0"
            />
          </RecipientField>
        )}
        {showBcc && (
          <RecipientField id={bccInputId} label={t('message.bcc')}>
            <RecipientAutocompleteInput
              id={bccInputId}
              value={values.bcc}
              onChange={(value) => set('bcc', value)}
              placeholder=""
              emptyLabel={t('contacts.noSuggestions')}
              loadingLabel={t('loading')}
              loadSuggestions={loadContactSuggestions}
              autoFocus={focusRecipient === 'bcc'}
              className="h-7 px-2.5 py-0"
            />
          </RecipientField>
        )}
        <Field label={t('message.subject')}>
          <Input
            value={values.subject}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              set('subject', event.target.value)
            }
          />
        </Field>
        <div className="grid min-h-0 flex-1 gap-1.5 text-sm font-medium">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{t('message.body')}</span>
            {allowBodyModeSwitch && (
              <ToggleGroupCompat
                selectionMode="single"
                value={bodyMode}
                className="gap-1"
              >
                <ToggleGroupCompatItem
                  type="button"
                  value="plainText"
                  pressed={bodyMode === 'plainText'}
                  onClick={() => switchBodyMode('plainText')}
                  size="sm"
                >
                  {t('compose.mode.plainText')}
                </ToggleGroupCompatItem>
                <ToggleGroupCompatItem
                  type="button"
                  value="mailyEditor"
                  pressed={bodyMode === 'mailyEditor'}
                  onClick={() => switchBodyMode('mailyEditor')}
                  size="sm"
                >
                  {t('compose.mode.mailyEditor')}
                </ToggleGroupCompatItem>
              </ToggleGroupCompat>
            )}
          </div>
          {bodyMode === 'mailyEditor' ? (
            <Editor
              {...editorProps}
              key={editorRevision}
              contentHtml={composeHtmlContent(values)}
              onCreate={updateFromEditor}
              onUpdate={updateFromEditor}
              config={{
                ...editorConfig,
                hasMenuBar: editorConfig?.hasMenuBar ?? true,
                wrapClassName: cn('min-h-0', editorConfig?.wrapClassName),
                bodyClassName: editorBodyClassName,
                contentClassName: editorContentClassName,
                autofocus: editorConfig?.autofocus ?? 'end',
              }}
            />
          ) : (
            <Textarea
              value={values.text}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBodyText(event.target.value)
              }
              className="h-full min-h-40 resize-none"
            />
          )}
        </div>
      </div>
    </form>
  );
}

const RECIPIENT_SEPARATOR_PATTERN = /[,;\n]/;

function recipientTokenForCaret(value: string, caret: number) {
  const position = Math.max(0, Math.min(caret, value.length));
  let start = position;
  let end = position;

  while (start > 0 && !RECIPIENT_SEPARATOR_PATTERN.test(value[start - 1])) {
    start -= 1;
  }
  while (end < value.length && !RECIPIENT_SEPARATOR_PATTERN.test(value[end])) {
    end += 1;
  }

  return {
    start,
    end,
    query: value.slice(start, end).trim(),
  };
}

function formatContactSuggestion(
  suggestion: MailyMailboxContactSuggestion
): string {
  const displayName = suggestion.displayName?.trim();
  if (!displayName) return suggestion.address;
  return `${displayName} <${suggestion.address}>`;
}

function replaceRecipientToken(
  value: string,
  caret: number,
  suggestion: MailyMailboxContactSuggestion
) {
  const token = recipientTokenForCaret(value, caret);
  const before = value.slice(0, token.start);
  const replacement = formatContactSuggestion(suggestion);
  let after = value.slice(token.end);

  if (!after) {
    after = ', ';
  } else if (/^[,;]/.test(after)) {
    after = after.replace(/^([,;])\s*/, '$1 ');
  } else if (/^\n/.test(after)) {
    after = after.replace(/^\n\s*/, '\n');
  } else {
    after = `, ${after.trimStart()}`;
  }

  const leadingSpace = before.length > 0 && !/[\s\n]$/.test(before) ? ' ' : '';
  const nextValue = `${before}${leadingSpace}${replacement}${after}`;

  return {
    value: nextValue,
    caret: before.length + leadingSpace.length + replacement.length + 2,
  };
}

function RecipientAutocompleteInput(props: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
  loadingLabel: string;
  loadSuggestions: (q: string) => MaybePromise<MailyMailboxContactSuggestion[]>;
  autoFocus?: boolean;
  className?: string;
}) {
  const {
    id,
    value,
    onChange,
    placeholder,
    emptyLabel,
    loadingLabel,
    loadSuggestions,
    autoFocus,
    className,
  } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const caretRef = React.useRef(0);
  const requestRef = React.useRef(0);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<
    MailyMailboxContactSuggestion[]
  >([]);

  const updateQuery = React.useCallback((nextValue: string, caret: number) => {
    caretRef.current = caret;
    const nextQuery = recipientTokenForCaret(nextValue, caret).query;
    setQuery(nextQuery);
    setOpen(nextQuery.length > 0);
  }, []);

  React.useEffect(() => {
    const q = query.trim();
    if (!open || !q) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);

    const timer = window.setTimeout(() => {
      Promise.resolve(loadSuggestions(q))
        .then((next) => {
          if (requestRef.current === requestId) {
            setSuggestions(next);
          }
        })
        .finally(() => {
          if (requestRef.current === requestId) {
            setLoading(false);
          }
        });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loadSuggestions, open, query]);

  React.useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  React.useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;

      input.focus();
      input.setSelectionRange(caretRef.current, caretRef.current);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const selectSuggestion = (suggestion: MailyMailboxContactSuggestion) => {
    const next = replaceRecipientToken(value, caretRef.current, suggestion);
    onChange(next.value);
    setOpen(false);
    setQuery('');
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild data-slot="input-group-control">
        <InputGroupInput
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            updateQuery(
              nextValue,
              event.target.selectionStart ?? nextValue.length
            );
          }}
          onFocus={(event: React.FocusEvent<HTMLInputElement>) =>
            updateQuery(
              event.currentTarget.value,
              event.currentTarget.selectionStart ??
                event.currentTarget.value.length
            )
          }
          onClick={(event: React.MouseEvent<HTMLInputElement>) =>
            updateQuery(
              event.currentTarget.value,
              event.currentTarget.selectionStart ??
                event.currentTarget.value.length
            )
          }
          onKeyUp={(event: React.KeyboardEvent<HTMLInputElement>) =>
            updateQuery(
              event.currentTarget.value,
              event.currentTarget.selectionStart ??
                event.currentTarget.value.length
            )
          }
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        style={{
          width: 'var(--radix-popover-trigger-width, var(--anchor-width))',
        }}
        className="min-w-72 p-0"
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-56">
            {loading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 px-3 py-4 text-sm">
                <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-4 animate-spin"
/>
                {loadingLabel}
              </div>
            ) : suggestions.length > 0 ? (
              <CommandGroup>
                {suggestions.map((suggestion) => {
                  const label = formatContactSuggestion(suggestion);
                  return (
                    <CommandItem
                      key={suggestion.id ?? suggestion.address}
                      value={`${suggestion.displayName ?? ''} ${suggestion.address}`}
                      onSelect={() => selectSuggestion(suggestion)}
                      className="cursor-pointer"
                    >
                      <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                        {senderInitial(
                          suggestion.displayName || suggestion.address
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {suggestion.displayName || suggestion.address}
                        </span>
                        {suggestion.displayName && (
                          <span className="text-muted-foreground block truncate text-xs">
                            {suggestion.address}
                          </span>
                        )}
                      </span>
                      <span className="sr-only">{label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : (
              <div className="text-muted-foreground px-3 py-6 text-center text-sm">
                {emptyLabel}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function RecipientField(props: {
  id: string;
  label: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-border grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 border-b py-1 text-sm">
      <label
        htmlFor={props.id}
        className="text-muted-foreground shrink-0 font-medium"
      >
        {props.label}
      </label>
      <InputGroup className="bg-input/40 dark:bg-input/30 h-8 border-0 shadow-none">
        {props.children}
        {props.actions && (
          <InputGroupAddon align="inline-end" className="pr-1">
            {props.actions}
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}

function Field(props: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-medium', props.className)}>
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

function EmptyState(props: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center',
        props.className
      )}
    >
      <div className="text-sm font-medium">{props.title}</div>
      {props.description && (
        <p className="text-muted-foreground mt-1 max-w-64 text-sm">
          {props.description}
        </p>
      )}
    </div>
  );
}
