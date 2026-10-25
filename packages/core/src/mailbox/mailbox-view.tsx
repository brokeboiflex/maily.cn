'use client';
import * as React from 'react';
import { useControllableState } from './use-controllable-state';
import { composeValuesToMailboxDraft } from './compose-draft';
import {
  defaultMailboxLabels,
  type MailyMailboxLabelKey,
  type MailyMailboxLabels,
} from './labels';
import type {
  MailyMailboxFolder,
  MailyMailboxLabel,
  MailyMailboxMessageRow,
  MailyMailboxAttachment,
  MailyMailboxAttachmentDownloadInput,
  MailyMailboxMessageDetail,
  MailyMailboxMessageList,
  MailyMailboxCounts,
  MailyMailboxUploadedAttachment,
  MailyMailboxThread,
  MailyMailboxComposeValues,
  MailyMailboxComposeBodyMode,
  MailyMailboxMessageAction,
  MailyMailboxMessageActionInput,
  MailyMailboxDataSource,
  MailyMailboxDraftInput,
  MailyMailboxHandle,
  MailyMailboxViewProps,
  MaybePromise,
} from './types';
import {
  useKeyedValue,
  useLatestRef,
  useOwnedRef,
  useResettableState,
} from '@/editor/utils/state-hooks';

import { Button } from '@/editor/components/base-button';
import { Input } from '@/editor/components/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/editor/components/popover';
import { Badge } from '@/editor/components/ui/badge';
import { Avatar, AvatarFallback } from '@/editor/components/ui/avatar';
import { Field, FieldLabel, FieldSet } from '@/editor/components/ui/field';
import { Label } from '@/editor/components/ui/label';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/editor/components/ui/empty';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/editor/components/ui/attachment';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/editor/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/editor/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/editor/components/ui/input-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/editor/components/ui/sheet';
import { ScrollArea } from '@/editor/components/ui/scroll-area';
import { Checkbox } from '@/editor/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/editor/components/ui/tooltip';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/editor/components/ui/dialog';
import { Textarea } from '@/editor/components/textarea';
import { Editor, type EditorProps } from '../editor';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from '../editor/components/ui/toggle-group-compat';
import { cn } from '@/editor/utils/classname';
import { createId } from '@/editor/utils/create-id';
import { useEvent } from '@/editor/utils/use-event';

import {
  filterMailboxContactSuggestions,
  type MailyMailboxContactSuggestion,
} from './contacts';
import { addressListTokens, formatMailboxAddress } from './addresses';
import {
  defaultMailboxComposeSeed,
  type MailyMailboxComposeSeedKind,
} from './compose-seed';
import type { MailyMailboxMessageActionContext } from './message-actions';
import {
  buildMailboxSearchQuery,
  resolveMailboxSearchFilters,
  withEnabledSearchFilters,
  type MailyMailboxSearchQuery,
} from './search';
import {
  canStartComposition,
  getMailboxComposeOperations,
  resolveMailboxDraftCapabilities,
  type MailboxDraftCapabilities,
} from './draft-capabilities';
import { groupMailboxMessagesByThread } from './conversations';
import {
  Archive,
  Trash2,
  Star,
  MailOpen,
  Ban,
  ShieldAlert,
  Flag,
  Filter,
  Languages,
  Printer,
  Download,
  CodeIcon,
  AlertCircle,
  Smile,
  Inbox,
  Send,
  FileText,
  Pencil,
  Search,
  LoaderCircleIcon,
  Paperclip,
  ExternalLink,
  Reply,
  Forward,
  MoreVertical,
  Menu,
  ArrowLeft,
  ReplyAll,
  Tag,
  ChevronRight,
  RotateCwIcon,
  Plus,
  X,
} from 'lucide-react';

/** Adapter callbacks may return or throw synchronously; both settle a Promise. */
function callAdapter<T>(call: () => MaybePromise<T>): Promise<T> {
  return new Promise<T>((resolve) => resolve(call()));
}

const FOLDERS: readonly MailyMailboxFolder[] = [
  'inbox',
  'starred',
  'sent',
  'drafts',
  'allMail',
  'spam',
  'trash',
];

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_CONTACT_SUGGESTION_LIMIT = 8;
const DEFAULT_MESSAGE_ACTIONS: readonly MailyMailboxMessageAction[] = [];
// A stable default keeps the suggestion loader from changing on every render.
const NO_CONTACT_SUGGESTIONS: MailyMailboxContactSuggestion[] = [];

const TOOLBAR_LEADING_MESSAGE_ACTIONS = [
  'restore',
  'notSpam',
  'deleteForever',
  'archive',
  'reportSpam',
  'delete',
  'markUnread',
  'markRead',
] as const satisfies readonly MailyMailboxMessageAction[];

const TOOLBAR_TRAILING_MESSAGE_ACTIONS = [
  'print',
  'showOriginal',
] as const satisfies readonly MailyMailboxMessageAction[];

const HEADER_MESSAGE_ACTIONS = [
  'favorite',
  'react',
] as const satisfies readonly MailyMailboxMessageAction[];

type MessageActionMetadata = {
  label: MailyMailboxLabelKey;
  toolbarLabel?: MailyMailboxLabelKey;
  icon: (className: string) => React.ReactNode;
  value?: string | boolean | null;
  variant?: 'default' | 'destructive';
};

const MESSAGE_ACTION_METADATA: Record<
  MailyMailboxMessageAction,
  MessageActionMetadata
> = {
  archive: {
    label: 'actions.archive',
    icon: (className) => <Archive className={className} />,
  },
  restore: {
    label: 'actions.restore',
    icon: (className) => <Inbox className={className} />,
  },
  notSpam: {
    label: 'actions.notSpam',
    icon: (className) => <MailOpen className={className} />,
  },
  deleteForever: {
    label: 'actions.deleteForever',
    icon: (className) => <Trash2 className={className} />,
    variant: 'destructive',
  },
  delete: {
    label: 'actions.delete',
    icon: (className) => <Trash2 className={className} />,
    variant: 'destructive',
  },
  favorite: {
    label: 'actions.favorite',
    icon: (className) => <Star className={className} />,
  },
  markUnread: {
    label: 'actions.markUnread',
    icon: (className) => <MailOpen className={className} />,
    value: true,
  },
  markRead: {
    label: 'actions.markRead',
    icon: (className) => <MailOpen className={className} />,
    value: true,
  },
  blockSender: {
    label: 'actions.blockSender',
    icon: (className) => <Ban className={className} />,
  },
  reportSpam: {
    label: 'actions.reportSpam',
    icon: (className) => <ShieldAlert className={className} />,
  },
  reportPhishing: {
    label: 'actions.reportPhishing',
    icon: (className) => <Flag className={className} />,
  },
  reportIllegal: {
    label: 'actions.reportIllegal',
    icon: (className) => <Flag className={className} />,
  },
  filterSimilar: {
    label: 'actions.filterSimilar',
    icon: (className) => <Filter className={className} />,
  },
  translate: {
    label: 'actions.translate',
    icon: (className) => <Languages className={className} />,
  },
  print: {
    label: 'actions.print',
    icon: (className) => <Printer className={className} />,
  },
  download: {
    label: 'actions.download',
    icon: (className) => <Download className={className} />,
  },
  showOriginal: {
    label: 'actions.showOriginal',
    toolbarLabel: 'actions.openExternal',
    icon: (className) => <CodeIcon className={className} />,
  },
  feedback: {
    label: 'actions.feedback',
    icon: (className) => <AlertCircle className={className} />,
  },
  react: {
    label: 'actions.react',
    icon: (className) => <Smile className={className} />,
  },
};

function emptyCounts(): MailyMailboxCounts {
  return {
    inbox: 0,
    allMail: 0,
    starred: 0,
    sent: 0,
    drafts: 0,
    bounced: 0,
    spam: 0,
    trash: 0,
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
    attachments:
      detail.attachments?.flatMap((attachment) =>
        attachment.id
          ? [
              {
                id: attachment.id,
                filename: attachment.filename,
                contentType: attachment.contentType,
                size: attachment.size,
              },
            ]
          : []
      ) ?? [],
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

function senderInitial(addr: string): string {
  return (addr.trim()[0] ?? '?').toUpperCase();
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
      return <Inbox className={className} />;
    case 'allMail':
      return <Archive className={className} />;
    case 'starred':
      return <Star className={className} />;
    case 'sent':
      return <Send className={className} />;
    case 'drafts':
      return <FileText className={className} />;
    case 'spam':
      return <ShieldAlert className={className} />;
    case 'trash':
      return <Trash2 className={className} />;
    case 'bounced':
      return <AlertCircle className={className} />;
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
    case 'bulkAction':
      return 'errors.bulkAction';
    case 'undo':
      return 'errors.undo';
    case 'labels':
      return 'errors.labels';
    case 'labelMutation':
      return 'errors.labelMutation';
    default:
      return 'errors.refresh';
  }
}

/** A mailbox surface; its `ref` exposes `refresh()` (MailyMailboxHandle). */
export const MailboxView = React.forwardRef<
  MailyMailboxHandle,
  MailyMailboxViewProps
>(function MailboxView(props, ref) {
  return (
    <TooltipProvider>
      <MailboxSession
        key={props.account?.id ?? 'mailbox'}
        {...props}
        handleRef={ref}
      />
    </TooltipProvider>
  );
});

function MailboxSession(
  props: MailyMailboxViewProps & {
    handleRef: React.ForwardedRef<MailyMailboxHandle>;
  }
) {
  const {
    dataSource,
    messageActions = DEFAULT_MESSAGE_ACTIONS,
    labels = defaultMailboxLabels,
    className,
    initialFolder = 'inbox',
    markReadOnOpen = false,
    pollIntervalMs = 0,
    autosaveDelayMs = false,
    createComposeSeed = defaultMailboxComposeSeed,
    pageSize = DEFAULT_PAGE_SIZE,
    contactSuggestions = NO_CONTACT_SUGGESTIONS,
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
  // Which values the host controls. Callbacks depend on these flags rather
  // than on the controlled values, so a new selection does not restart reads.
  const folderControlled = props.folder !== undefined;
  const searchControlled = props.search !== undefined;
  const searchFiltersControlled = props.searchFilters !== undefined;
  const labelSelectionControlled = props.selectedLabelId !== undefined;
  const readerSelectionControlled = props.selectedMessageId !== undefined;
  const bulkSelectionControlled = props.selectedMessageIds !== undefined;

  // Every owned box below belongs to one data-source lifetime: a new source
  // gets fresh boxes, so work started under the old source cannot touch them.
  const lifetimeRef = useOwnedRef(dataSource, { active: true, epoch: 0 });
  React.useLayoutEffect(() => {
    const lifetime = lifetimeRef.current;
    lifetime.active = true;
    return () => {
      lifetime.active = false;
      lifetime.epoch += 1;
    };
  }, [lifetimeRef]);
  const captureLifetime = React.useCallback(() => {
    const lifetime = lifetimeRef.current;
    const epoch = lifetime.epoch;
    return () => lifetime.active && lifetime.epoch === epoch;
  }, [lifetimeRef]);

  const t = React.useCallback(
    (key: MailyMailboxLabelKey, vars?: Record<string, string | number>) =>
      interpolate(labels[key], vars),
    [labels]
  );
  // Hosts often pass an inline onError; its identity must not restart reads.
  const onErrorRef = useLatestRef(onError);
  const { create, edit, send, sendMessage, discard } =
    resolveMailboxDraftCapabilities(dataSource, props.draftCapabilities);
  const draftCapabilities = React.useMemo<MailboxDraftCapabilities>(
    () => ({ create, edit, send, sendMessage, discard }),
    [create, edit, send, sendMessage, discard]
  );

  const [folder, setFolder] = useControllableState(
    props.folder,
    initialFolder,
    props.onFolderChange
  );
  const [search, setSearch] = useControllableState(
    props.search,
    props.defaultSearch ?? '',
    props.onSearchChange
  );
  const filtersKey = JSON.stringify(props.searchFilters);
  const controlledSearchFilters = useKeyedValue(
    () => props.searchFilters,
    [filtersKey]
  );
  // Advanced filters the host's backend supports; all are off by default.
  const searchFiltersKey = resolveMailboxSearchFilters(
    props.searchCapabilities
  ).join(' ');
  const enabledSearchFilters = useKeyedValue(
    () => resolveMailboxSearchFilters(props.searchCapabilities),
    [searchFiltersKey]
  );
  const [requestedSearchFields, setSearchFields] = useControllableState(
    controlledSearchFilters,
    withEnabledSearchFilters(
      props.defaultSearchFilters ?? {},
      enabledSearchFilters
    ),
    props.onSearchFiltersChange
  );
  // Disabled filters never reach the UI or the data source, even when a
  // controlled value still carries them. Keyed by content, so clearing them
  // from local state does not start another read.
  const enabledSearchFields = withEnabledSearchFilters(
    requestedSearchFields,
    enabledSearchFilters
  );
  const searchFields = useKeyedValue(
    () => enabledSearchFields,
    [JSON.stringify(enabledSearchFields)]
  );
  const advancedSearchAvailable = enabledSearchFilters.length > 0;
  const searchClearable = !!search || Object.keys(searchFields).length > 0;
  // A hidden trigger closes the form, and it stays closed when one returns.
  const [advancedSearchOpen, setAdvancedSearchOpen] = useResettableState(
    () => false,
    [advancedSearchAvailable]
  );
  const [searchDraft, setSearchDraft] = React.useState<MailyMailboxSearchQuery>(
    {}
  );
  // The scope is the host's choice; it applies only while a search is active.
  const searchScope = props.searchScope ?? 'folder';
  const searching =
    !!search.trim() || Object.values(searchFields).some(Boolean);
  const globalSearch = searching && searchScope === 'allMail';
  const listFolder: MailyMailboxFolder = globalSearch ? 'allMail' : folder;
  const [selectedLabelId, setSelectedLabelId] = useControllableState(
    props.selectedLabelId,
    props.defaultSelectedLabelId ?? null,
    props.onSelectedLabelIdChange
  );
  // The actions the host offers on a surface. Maily applies no folder rules;
  // it only drops actions whose callback the data source lacks.
  const messageActionsFor = React.useCallback(
    (
      surface: MailyMailboxMessageActionContext['surface'],
      messageIds: readonly string[]
    ) => {
      const requested =
        typeof messageActions === 'function'
          ? messageActions({
              surface,
              folder,
              labelId: selectedLabelId,
              searchScope,
              searching,
              messageIds,
            })
          : messageActions;
      return Array.from(new Set(requested)).filter((action) =>
        surface === 'bulk'
          ? !!dataSource.runBulkMessageAction
          : !!dataSource.runMessageAction ||
            (action === 'showOriginal' && !!dataSource.getMessageSource)
      );
    },
    [
      messageActions,
      folder,
      selectedLabelId,
      searchScope,
      searching,
      dataSource.runMessageAction,
      dataSource.runBulkMessageAction,
      dataSource.getMessageSource,
    ]
  );
  const labelSelection = React.useRef({ id: selectedLabelId, epoch: 0 });
  React.useLayoutEffect(() => {
    if (labelSelection.current.id !== selectedLabelId)
      labelSelection.current = {
        id: selectedLabelId,
        epoch: labelSelection.current.epoch + 1,
      };
  }, [selectedLabelId]);
  const [mailboxLabels, setMailboxLabels] = React.useState<MailyMailboxLabel[]>(
    []
  );
  const [labelForm, updateLabelForm] = React.useState<{
    mode: 'create' | 'rename' | 'delete';
    label?: MailyMailboxLabel;
  } | null>(null);
  const labelFormOwner = React.useRef(labelForm);
  const setLabelForm = React.useCallback((next: typeof labelForm) => {
    labelFormOwner.current = next;
    updateLabelForm(next);
  }, []);
  const [labelName, setLabelName] = React.useState('');
  const [selectedIds, setSelectedIds] = useControllableState(
    props.selectedMessageIds,
    props.defaultSelectedMessageIds ?? [],
    props.onSelectedMessageIdsChange
  );
  const [undoReceipt, setUndoReceipt] = React.useState<{
    token: string;
    expiresAt?: string | number | Date;
  } | null>(null);
  const [selectedId, setSelectedId] = useControllableState(
    props.selectedMessageId,
    props.defaultSelectedMessageId ?? null,
    props.onSelectedMessageIdChange
  );
  const readerSelection = React.useRef({ id: selectedId, epoch: 0 });
  React.useLayoutEffect(() => {
    if (readerSelection.current.id !== selectedId)
      readerSelection.current = {
        id: selectedId,
        epoch: readerSelection.current.epoch + 1,
      };
  }, [selectedId]);

  const bulkSelection = React.useRef({
    key: JSON.stringify(selectedIds),
    epoch: 0,
  });
  const bulkSelectionKey = JSON.stringify(selectedIds);
  React.useLayoutEffect(() => {
    if (bulkSelection.current.key !== bulkSelectionKey)
      bulkSelection.current = {
        key: bulkSelectionKey,
        epoch: bulkSelection.current.epoch + 1,
      };
  }, [bulkSelectionKey]);

  const mailboxRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const lastMessageTrigger = React.useRef<HTMLElement | null>(null);
  const [compact, setCompact] = React.useState(false);
  const [navigationOpen, setNavigationOpen] = React.useState(false);
  React.useEffect(() => {
    const element = mailboxRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 768);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
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
  const [detailRevision, invalidateDetail] = React.useReducer(
    (n: number) => n + 1,
    0
  );
  const [threadRevision, invalidateThread] = React.useReducer(
    (n: number) => n + 1,
    0
  );
  // A new detail request (source, selection or invalidation) starts from an
  // empty, loading reader during render instead of showing the previous one.
  const detailRequest = [dataSource, selectedId, detailRevision];
  const [detail, setDetail] =
    useResettableState<MailyMailboxMessageDetail | null>(
      () => null,
      detailRequest
    );
  const [detailLoading, setDetailLoading] = useResettableState(
    () => !!selectedId,
    detailRequest
  );

  const [messagesLoading, setMessagesLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  // Each source lifetime owns its locks; an old finally cannot unlock a new action.
  const composeLockRef = useOwnedRef(dataSource, false);
  const composeDirtyRef = useOwnedRef(dataSource, false);
  const composeOwnedRef = useOwnedRef(dataSource, false);
  // Whether the open composer owns its draft (created it, or hydrated it).
  // Async guards read the ref; render reads the state written with it.
  const [composeOwned, setComposeOwnedState] = useResettableState(
    () => false,
    [dataSource]
  );
  const setComposeOwned = React.useCallback(
    (owned: boolean) => {
      composeOwnedRef.current = owned;
      setComposeOwnedState(owned);
    },
    [composeOwnedRef, setComposeOwnedState]
  );
  const pendingFolderRequest = React.useRef<{
    folder: MailyMailboxFolder;
    labelId: string | null;
  } | null>(null);
  const pendingBackRequest = React.useRef(false);
  const pendingReaderRequest = React.useRef<MailyMailboxMessageRow | null>(
    null
  );
  const [pendingNavigation, setPendingNavigation] = React.useState<
    (() => void) | null
  >(null);
  // The saved attachments of the draft as the composer opened it. Selection
  // changes, Undo and failed re-reads replace `detail`; the open composition
  // keeps what it was hydrated with.
  const [composeSnapshot, setComposeSnapshot] = React.useState<{
    draftId: string;
    attachments: MailyMailboxAttachment[];
  } | null>(null);
  const composeAttachments =
    composeDraftId && composeSnapshot?.draftId === composeDraftId
      ? composeSnapshot.attachments
      : undefined;
  // Saves re-send attachment references, so a saved draft holding attachments
  // without a host ID cannot be edited here without dropping them.
  const draftHasUnreferencedAttachments = !!composeAttachments?.some(
    (attachment) => !attachment.id
  );
  const composeCapabilities = React.useMemo<MailboxDraftCapabilities>(
    () =>
      draftHasUnreferencedAttachments
        ? { ...draftCapabilities, edit: false }
        : draftCapabilities,
    [draftCapabilities, draftHasUnreferencedAttachments]
  );
  // Guards read the committed capabilities when they run, so a timer or a
  // dialog created before the host withdrew an operation cannot dispatch it.
  const composeCapabilitiesRef = useLatestRef(composeCapabilities);
  const allowComposeNavigation = (navigate: () => void) => {
    if (!composeDirtyRef.current) return true;
    setPendingNavigation(() => navigate);
    return false;
  };
  // Compose, Reply and Forward start compositions that createDraft can keep
  // or sendMessage can send. The unsaved-change dialog clears dirty state
  // before it navigates; if both were withdrawn meanwhile, the current
  // composition stays protected.
  const allowNewComposition = (open: () => void) =>
    canStartComposition(composeCapabilitiesRef.current) &&
    allowComposeNavigation(() => {
      if (canStartComposition(composeCapabilitiesRef.current)) open();
      else composeDirtyRef.current = true;
    });
  const composeRevisionRef = useOwnedRef<string | undefined>(
    dataSource,
    undefined
  );
  const composeDraftRef = useOwnedRef<string | null>(dataSource, null);
  const messagesGeneration = React.useRef(0);
  const pageCursorsRef = React.useRef<
    Array<{ cursor?: string; start: number }>
  >([{ start: 1 }]);
  const pageIndexRef = React.useRef(0);
  // The visible page and its first row number, for the page range label.
  const [pagePosition, setPagePosition] = React.useState({
    index: 0,
    start: 1,
  });
  const pageIndex = pagePosition.index;
  const pageChangeLockRef = useOwnedRef(dataSource, false);
  const hasPreviousPage = pageIndex > 0;
  const pageStart = messages.items.length ? pagePosition.start : 0;
  const pageEnd = messages.items.length
    ? pageStart + messages.items.length - 1
    : 0;
  const pageTotal = messages.total;
  const countsGeneration = React.useRef(0);
  React.useEffect(
    () => () => {
      messagesGeneration.current += 1;
      countsGeneration.current += 1;
    },
    []
  );
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [discarding, setDiscarding] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [messageActionPending, setMessageActionPending] =
    React.useState<MailyMailboxMessageAction | null>(null);
  // Each error remembers its action; a success clears only what it resolves.
  const [errorNotice, setErrorNotice] = React.useState<{
    key: MailyMailboxLabelKey;
    action: string;
  } | null>(null);
  const showError = React.useCallback((action: string) => {
    setErrorNotice({ key: errorLabelForAction(action), action });
  }, []);
  const clearError = React.useCallback((...actions: string[]) => {
    setErrorNotice((current) =>
      current && actions.includes(current.action) ? null : current
    );
  }, []);
  const previousDataSource = React.useRef(dataSource);
  // Initial state already matches a fresh source, so only a changed source
  // resets; a remounted effect (StrictMode, a re-shown Activity) keeps state.
  React.useLayoutEffect(() => {
    if (previousDataSource.current !== dataSource) {
      previousDataSource.current = dataSource;
      if (!readerSelectionControlled) setSelectedId(null);
      if (!bulkSelectionControlled) setSelectedIds([]);
      composeDraftRef.current = null;
      composeRevisionRef.current = undefined;
      setComposeDraftId(null);
      setComposeSeed(null);
      setComposeInReplyTo(null);
      setLabelForm(null);
      setSaving(false);
      setSending(false);
      setDiscarding(false);
      setLoadingMore(false);
      setMessageActionPending(null);
      setRefreshing(false);
      setComposeOpen(false);
      // The previous composer stays mounted until this commit and may already
      // have reported its state into the new lifetime's boxes.
      composeDirtyRef.current = false;
      setComposeOwned(false);
      setUndoReceipt(null);
      setMailboxLabels([]);
      pendingFolderRequest.current = null;
      pendingReaderRequest.current = null;
      pendingBackRequest.current = false;
    }
  }, [
    bulkSelectionControlled,
    composeDirtyRef,
    composeDraftRef,
    composeOwnedRef,
    composeRevisionRef,
    dataSource,
    readerSelectionControlled,
    setComposeOwned,
    setLabelForm,
    setSelectedId,
    setSelectedIds,
  ]);
  const reportError = React.useCallback(
    (error: unknown, action: string) => {
      showError(action);
      onErrorRef.current?.(error, action);
    },
    [onErrorRef, showError]
  );

  const queryKey = JSON.stringify([
    folder,
    globalSearch,
    search,
    searchFields,
    selectedLabelId,
  ]);
  const queryOwner = React.useRef({ key: queryKey, epoch: 0 });
  React.useLayoutEffect(() => {
    if (queryOwner.current.key === queryKey) return;
    queryOwner.current = {
      key: queryKey,
      epoch: queryOwner.current.epoch + 1,
    };
    messagesGeneration.current += 1;
    pageChangeLockRef.current = false;
    setRefreshing(false);
    setLoadingMore(false);
    setErrorNotice(null);
  }, [queryKey, pageChangeLockRef]);
  const beginMessageRead = React.useCallback(() => {
    const isCurrent = captureLifetime();
    const query = queryOwner.current;
    if (!isCurrent() || query.key !== queryKey) return () => false;
    const generation = ++messagesGeneration.current;
    // The new read takes ownership of shared progress indicators and paging.
    pageChangeLockRef.current = false;
    setRefreshing(false);
    setLoadingMore(false);
    return () =>
      isCurrent() &&
      query.key === queryKey &&
      queryOwner.current === query &&
      messagesGeneration.current === generation;
  }, [captureLifetime, queryKey, pageChangeLockRef]);
  const structuredSearch = React.useMemo<MailyMailboxSearchQuery>(
    () => ({
      ...searchFields,
      text: search.trim() || undefined,
      labelId: selectedLabelId ?? searchFields.labelId,
    }),
    [search, searchFields, selectedLabelId]
  );
  const serializedSearch =
    buildMailboxSearchQuery(structuredSearch) || undefined;

  const loadContactSuggestions = React.useCallback(
    async (q: string) => {
      try {
        if (dataSource.listContactSuggestions) {
          return await dataSource.listContactSuggestions({
            q,
            limit: contactSuggestionLimit,
          });
        }

        return filterMailboxContactSuggestions(
          contactSuggestions,
          q,
          contactSuggestionLimit
        );
      } catch (error) {
        onErrorRef.current?.(error, 'contactSuggestions');
        throw error;
      }
    },
    [contactSuggestionLimit, contactSuggestions, dataSource, onErrorRef]
  );
  // Child components call these detached; binding keeps adapter `this` intact
  // and their identities stable for one data source.
  const adapterMethods = React.useMemo(
    () => ({
      uploadAttachment: dataSource.uploadAttachment?.bind(dataSource),
      discardUploadedAttachment:
        dataSource.discardUploadedAttachment?.bind(dataSource),
      downloadAttachment: dataSource.downloadAttachment?.bind(dataSource),
      getMessageSource: dataSource.getMessageSource?.bind(dataSource),
    }),
    [dataSource]
  );

  const refreshCounts = React.useCallback(async () => {
    const isCurrent = captureLifetime();
    if (!isCurrent()) return;
    if (!dataSource.getCounts) {
      setCounts(emptyCounts());
      return;
    }
    const generation = ++countsGeneration.current;
    try {
      const next = await dataSource.getCounts();
      if (!isCurrent() || generation !== countsGeneration.current) return;
      setCounts({ ...emptyCounts(), ...next });
    } catch (error) {
      // Counts are optional metadata: keep the list and the last known counts.
      if (isCurrent() && generation === countsGeneration.current)
        onErrorRef.current?.(error, 'counts');
    }
  }, [captureLifetime, dataSource, onErrorRef]);

  const refreshMessages = React.useCallback(
    async (preservePages: boolean, isCurrent: () => boolean) => {
      if (!isCurrent()) return;
      if (!preservePages) {
        pageCursorsRef.current = [{ start: 1 }];
        pageIndexRef.current = 0;
        setPagePosition({ index: 0, start: 1 });
      }
      let currentIndex = pageIndexRef.current;
      // Rebuild the cursor chain after mutations/polling: a host cursor can
      // depend on the preceding page. Keep only the requested page visible.
      const refreshedPages: Array<{ cursor?: string; start: number }> = [
        { start: 1 },
      ];
      let cursor: string | undefined;
      let start = 1;
      let total: number | undefined;
      for (let index = 0; index <= currentIndex; index += 1) {
        const page = await dataSource.listMessages({
          folder: listFolder,
          q: serializedSearch,
          search: structuredSearch,
          labelId: selectedLabelId ?? undefined,
          cursor,
          limit: pageSize,
        });
        if (!isCurrent()) return;
        total = page.total ?? total;
        const atTarget = index === currentIndex;
        if (atTarget || !page.nextCursor) {
          if (!page.items.length && index > 0) {
            currentIndex = index - 1;
            index = -1;
            cursor = undefined;
            start = 1;
            refreshedPages.splice(1);
            continue;
          }
          if (index !== pageIndexRef.current) {
            if (!bulkSelectionControlled) setSelectedIds([]);
            if (!readerSelectionControlled && !composeDraftRef.current)
              setSelectedId(null);
          }
          pageIndexRef.current = index;
          pageCursorsRef.current = refreshedPages;
          setPagePosition({ index, start: refreshedPages[index]?.start ?? 1 });
          setMessages({ ...page, total });
          return;
        }
        cursor = page.nextCursor ?? undefined;
        start += page.items.length;
        refreshedPages.push({ cursor, start });
      }
    },
    [
      listFolder,
      dataSource,
      serializedSearch,
      structuredSearch,
      selectedLabelId,
      pageSize,
      bulkSelectionControlled,
      setSelectedIds,
      readerSelectionControlled,
      composeDraftRef,
      setSelectedId,
    ]
  );

  const refreshMailbox = React.useCallback(async () => {
    const isCurrent = beginMessageRead();
    if (!isCurrent()) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshCounts(), refreshMessages(true, isCurrent)]);
      if (!isCurrent()) return;
      clearError('refresh');
    } catch (error) {
      if (!isCurrent()) return;
      reportError(error, 'refresh');
    } finally {
      if (isCurrent()) setRefreshing(false);
      if (isCurrent()) setMessagesLoading(false);
    }
  }, [
    beginMessageRead,
    clearError,
    refreshCounts,
    refreshMessages,
    reportError,
  ]);

  const latestRefreshMailbox = useLatestRef(refreshMailbox);

  const changePage = React.useCallback(
    async (direction: 'previous' | 'next') => {
      if (pageChangeLockRef.current || messagesLoading) return;
      const currentIndex = pageIndexRef.current;
      const nextIndex =
        direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || (direction === 'next' && !messages.nextCursor))
        return;
      const isCurrent = beginMessageRead();
      if (!isCurrent()) return;
      const target =
        direction === 'next'
          ? { cursor: messages.nextCursor ?? undefined, start: pageEnd + 1 }
          : pageCursorsRef.current[nextIndex];
      pageChangeLockRef.current = true;
      setLoadingMore(true);
      try {
        const page = await dataSource.listMessages({
          folder: listFolder,
          q: serializedSearch,
          search: structuredSearch,
          labelId: selectedLabelId ?? undefined,
          cursor: target?.cursor,
          limit: pageSize,
        });
        if (!isCurrent()) return;
        if (!page.items.length && direction === 'next') {
          setMessages((current) => ({
            ...current,
            nextCursor: null,
            total: page.total ?? current.total,
          }));
          return;
        }
        pageCursorsRef.current = [
          ...pageCursorsRef.current.slice(0, nextIndex),
          target,
        ];
        pageIndexRef.current = nextIndex;
        setPagePosition({ index: nextIndex, start: target?.start ?? 1 });
        if (!bulkSelectionControlled) setSelectedIds([]);
        if (!readerSelectionControlled && !composeDraftRef.current)
          setSelectedId(null);
        setMessages({ ...page, total: page.total ?? messages.total });
      } catch (error) {
        if (isCurrent()) reportError(error, 'refresh');
      } finally {
        if (isCurrent()) {
          pageChangeLockRef.current = false;
          setLoadingMore(false);
        }
      }
    },
    [
      pageChangeLockRef,
      messagesLoading,
      messages.nextCursor,
      messages.total,
      beginMessageRead,
      pageEnd,
      dataSource,
      listFolder,
      serializedSearch,
      structuredSearch,
      selectedLabelId,
      pageSize,
      bulkSelectionControlled,
      setSelectedIds,
      readerSelectionControlled,
      composeDraftRef,
      setSelectedId,
      reportError,
    ]
  );

  const labelsGeneration = React.useRef(0);
  const refreshLabels = React.useCallback(async () => {
    const isCurrent = captureLifetime();
    const generation = ++labelsGeneration.current;
    // A handle kept after unmount must not reach the host.
    if (!isCurrent() || !dataSource.listLabels) return;
    try {
      const next = await callAdapter(() => dataSource.listLabels!());
      if (isCurrent() && generation === labelsGeneration.current) {
        setMailboxLabels(next);
        clearError('labels');
      }
    } catch (error) {
      if (isCurrent() && generation === labelsGeneration.current)
        reportError(error, 'labels');
    }
  }, [captureLifetime, clearError, dataSource, reportError]);
  const latestRefreshLabels = useLatestRef(refreshLabels);
  // Each data source reads its labels once; refresh() reads them again.
  React.useEffect(() => {
    void latestRefreshLabels.current();
  }, [dataSource, latestRefreshLabels]);
  // The host refreshes when it knows the data changed; Maily does not poll
  // unless pollIntervalMs asks it to.
  React.useImperativeHandle(
    props.handleRef,
    () => ({
      refresh: async () => {
        await Promise.all([
          latestRefreshMailbox.current(),
          latestRefreshLabels.current(),
        ]);
      },
    }),
    [latestRefreshMailbox, latestRefreshLabels]
  );

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      const isCurrent = beginMessageRead();
      setMessagesLoading(true);
      try {
        await Promise.all([refreshCounts(), refreshMessages(false, isCurrent)]);
      } catch (error) {
        if (!cancelled && isCurrent()) {
          reportError(error, 'refresh');
          setMessages({ items: [], nextCursor: null });
        }
      } finally {
        if (!cancelled && isCurrent()) setMessagesLoading(false);
      }
    }

    run();
    if (pollIntervalMs <= 0)
      return () => {
        cancelled = true;
      };

    const id = window.setInterval(() => {
      const isCurrent = beginMessageRead();
      Promise.all([refreshCounts(), refreshMessages(true, isCurrent)])
        .catch((error) => {
          if (!cancelled && isCurrent()) reportError(error, 'refresh');
        })
        .finally(() => {
          if (!cancelled && isCurrent()) setMessagesLoading(false);
        });
    }, pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    pollIntervalMs,
    beginMessageRead,
    refreshCounts,
    refreshMessages,
    reportError,
  ]);

  const detailFreshness = React.useRef(0);
  const [composeSession, setComposeSession] = React.useState(0);
  // Read when a detail request completes, which must not restart the request.
  const composeOpenRef = useLatestRef(composeOpen);
  // An acknowledged mutation result for the reader selection it was made in.
  const [threadDetailOverride, setThreadDetailOverride] = useResettableState<{
    selectionId: string | null;
    detail: MailyMailboxMessageDetail;
  } | null>(() => null, [dataSource, selectedId]);
  const clearReaderAfterMutation = () => {
    setSelectedId(null);
    setDetail(null);
    setThreadDetailOverride(null);
    // A host may keep the same selected ID after a mutation. Re-read its
    // actual backend state rather than overriding that controlled selection.
    if (props.selectedMessageId != null) invalidateDetail();
  };

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selectedId) return;
      // An acknowledged mutation result outranks reads that started before it.
      const freshness = ++detailFreshness.current;
      const isFresh = () => !cancelled && detailFreshness.current === freshness;
      try {
        const next = await dataSource.getMessage(selectedId);
        if (isFresh()) {
          // Parent-accepted selection may point outside the loaded page. Hydrate
          // an unopened draft, but never replace an owned dirty/send session.
          if (
            !composeOpenRef.current &&
            !composeDirtyRef.current &&
            !composeLockRef.current &&
            composeDraftRef.current !== next.id
          ) {
            const isDraft = next.status === 'draft';
            composeDraftRef.current = isDraft ? next.id : null;
            composeRevisionRef.current = isDraft ? next._revision : undefined;
            setComposeOwned(false);
            setComposeSession((session) => session + 1);
            setComposeDraftId(isDraft ? next.id : null);
            setComposeSeed(null);
            setComposeInReplyTo(isDraft ? (next.inReplyTo ?? null) : null);
            setComposeOpen(isDraft);
          }
          if (composeDraftRef.current === next.id && !composeOwnedRef.current) {
            composeRevisionRef.current = next._revision;
            setComposeInReplyTo(next.inReplyTo ?? null);
            setComposeSnapshot({
              draftId: next.id,
              attachments: next.attachments ?? [],
            });
            setComposeOwned(true);
          }
          setDetail(next);
          clearError('detail');
        }
      } catch (error) {
        if (isFresh()) {
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
  }, [
    dataSource,
    reportError,
    selectedId,
    detailRevision,
    composeOpenRef,
    composeDirtyRef,
    composeLockRef,
    composeDraftRef,
    composeOwnedRef,
    setDetail,
    clearError,
    composeRevisionRef,
    setDetailLoading,
    setComposeOwned,
  ]);

  const selectedRow = messages.items.find((row) => row.id === selectedId);
  const selectedThreadId =
    selectedRow?.threadId ??
    (detail?.id === selectedId ? detail.threadId : undefined);
  const [thread, setThread] = useResettableState<MailyMailboxThread | null>(
    () => null,
    [dataSource, selectedId, selectedThreadId, threadRevision, detailRevision]
  );
  React.useEffect(() => {
    let cancelled = false;
    const threadId = selectedThreadId;
    if (!threadId || !dataSource.getThread) {
      return;
    }
    callAdapter(() => dataSource.getThread!(threadId))
      .then((value) => {
        if (!cancelled && value.threadId === threadId) setThread(value);
      })
      .catch((error) => {
        if (!cancelled) reportError(error, 'detail');
      });
    return () => {
      cancelled = true;
    };
  }, [
    dataSource,
    reportError,
    selectedId,
    selectedThreadId,
    threadRevision,
    detailRevision,
    setThread,
  ]);

  const selectFolder = (
    next: MailyMailboxFolder,
    labelId: string | null = null,
    acceptedByHost = false
  ) => {
    if (composeLockRef.current) return;
    if (!allowComposeNavigation(() => selectFolder(next, labelId))) return;
    pendingBackRequest.current = false;
    if (folderControlled && next !== folder) {
      pendingFolderRequest.current = { folder: next, labelId };
      setFolder(next);
      return;
    }
    setNavigationOpen(false);
    composeDirtyRef.current = false;
    setComposeOwned(false);
    messagesGeneration.current += 1;
    composeDraftRef.current = null;
    composeRevisionRef.current = undefined;
    setFolder(next);
    if (!acceptedByHost || !searchControlled) setSearch('');
    if (!acceptedByHost || !searchFiltersControlled) setSearchFields({});
    setAdvancedSearchOpen(false);
    if (!acceptedByHost || !labelSelectionControlled || labelId !== null)
      setSelectedLabelId(labelId);
    if (!acceptedByHost || !bulkSelectionControlled) setSelectedIds([]);
    if (!acceptedByHost || !readerSelectionControlled) setSelectedId(null);
    setComposeOpen(false);
    setComposeDraftId(null);
    setComposeSeed(null);
    setComposeInReplyTo(null);
  };
  // Effects that complete a host-accepted navigation call the latest handler.
  const selectAcceptedFolder = useEvent(selectFolder);

  const previousControlledFolder = React.useRef(folder);
  React.useEffect(() => {
    if (previousControlledFolder.current === folder) return;
    previousControlledFolder.current = folder;
    if (!folderControlled) return;
    const request = pendingFolderRequest.current;
    pendingFolderRequest.current = null;
    if (request?.folder === folder) {
      selectAcceptedFolder(folder, request.labelId, true);
      return;
    }
    // External navigation updates the list without discarding a live composer.
    if (!searchControlled) setSearch('');
    if (!searchFiltersControlled) setSearchFields({});
    if (!labelSelectionControlled) setSelectedLabelId(null);
  }, [
    folder,
    folderControlled,
    labelSelectionControlled,
    searchControlled,
    searchFiltersControlled,
    selectAcceptedFolder,
    setSearch,
    setSearchFields,
    setSelectedLabelId,
  ]);

  // Narrowed capabilities clear the values they disabled, so a filter enabled
  // again starts empty. The host coordinates a controlled value itself.
  const previousSearchFilters = React.useRef(enabledSearchFilters);
  React.useEffect(() => {
    if (previousSearchFilters.current === enabledSearchFilters) return;
    previousSearchFilters.current = enabledSearchFilters;
    if (searchFiltersControlled) return;
    setSearchFields((current) =>
      withEnabledSearchFilters(current, enabledSearchFilters)
    );
  }, [enabledSearchFilters, searchFiltersControlled, setSearchFields]);

  const previousQuery = React.useRef(queryKey);
  React.useEffect(() => {
    if (previousQuery.current !== queryKey) {
      previousQuery.current = queryKey;
      if (!bulkSelectionControlled) setSelectedIds([]);
      if (!readerSelectionControlled && !composeDraftRef.current)
        setSelectedId(null);
    }
  }, [
    queryKey,
    props.selectedMessageIds,
    props.selectedMessageId,
    setSelectedIds,
    setSelectedId,
    bulkSelectionControlled,
    readerSelectionControlled,
    composeDraftRef,
  ]);

  const composeIntent = useKeyedValue(() => ({}), [dataSource, composeSession]);
  // One key per create or direct-send request. A retry of the same content
  // reuses it, so a host can deduplicate a request whose response was lost;
  // changed content is a new request, so a host can never acknowledge it with
  // an earlier result.
  const requestKeyRef = useOwnedRef<{ key: string; payload: string } | null>(
    composeIntent,
    null
  );
  const requestKeyFor = (
    operation: 'createDraft' | 'sendMessage',
    draft: MailyMailboxDraftInput
  ) => {
    const payload = JSON.stringify([operation, draft]);
    if (requestKeyRef.current?.payload !== payload)
      requestKeyRef.current = { key: createId(), payload };
    return requestKeyRef.current.key;
  };
  const currentComposeIntent = useLatestRef(composeIntent);
  const captureCompose = () => {
    const isCurrent = captureLifetime();
    return () => isCurrent() && currentComposeIntent.current === composeIntent;
  };

  const selectMessage = (row: MailyMailboxMessageRow) => {
    if (composeLockRef.current) return;
    if (composeOpen && composeDraftId === row.id) return;
    if (!allowComposeNavigation(() => selectMessage(row))) return;
    pendingBackRequest.current = false;
    if (readerSelectionControlled && row.id !== selectedId) {
      pendingReaderRequest.current = row;
      setSelectedId(row.id);
      return;
    }
    composeDirtyRef.current = false;
    setComposeOwned(false);
    setComposeSession((session) => session + 1);
    composeDraftRef.current = row.status === 'draft' ? row.id : null;
    composeRevisionRef.current =
      row.status === 'draft' ? row._revision : undefined;
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
  const selectAcceptedMessage = useEvent(selectMessage);

  React.useEffect(() => {
    const requested = pendingReaderRequest.current;
    if (!requested || requested.id !== selectedId) return;
    pendingReaderRequest.current = null;
    selectAcceptedMessage(requested);
  }, [selectAcceptedMessage, selectedId]);

  const openNewDraft = () => {
    if (composeLockRef.current) return;
    if (!allowNewComposition(openNewDraft)) return;
    pendingBackRequest.current = false;
    setNavigationOpen(false);
    composeDirtyRef.current = false;
    setComposeOwned(false);
    setComposeSession((session) => session + 1);
    composeDraftRef.current = null;
    composeRevisionRef.current = undefined;
    setSelectedId(null);
    setDetail(null);
    setComposeDraftId(null);
    setComposeSeed(null);
    setComposeInReplyTo(null);
    setComposeOpen(true);
  };

  const draftInReplyTo = composeInReplyTo;

  const composeHydrated =
    !composeDraftId || detail?.id === composeDraftId || composeOwned;

  const saveDraft = async (
    values: MailyMailboxComposeValues
  ): Promise<boolean> => {
    const isCurrent = captureCompose();
    if (!isCurrent()) return false;
    if (!composeHydrated) return false;
    const draft = composeValuesToMailboxDraft(values, draftInReplyTo);
    draft.revision = composeRevisionRef.current;
    if (composeLockRef.current) return false;
    const currentDraftId = composeDraftRef.current ?? composeDraftId;
    const capabilities = composeCapabilitiesRef.current;
    if (!(currentDraftId ? capabilities.edit : capabilities.create))
      return false;
    composeLockRef.current = true;
    setSaving(true);
    try {
      if (currentDraftId) {
        if (!dataSource.updateDraft) return false;
        const saved = await dataSource.updateDraft(currentDraftId, draft);
        if (!isCurrent()) return true;
        composeRevisionRef.current = saved._revision;
        // The acknowledged write is the draft's saved state from now on.
        setComposeSnapshot({
          draftId: currentDraftId,
          attachments: draft.attachments ?? [],
        });
        onDraftSaved?.(currentDraftId);
      } else {
        if (!dataSource.createDraft) return false;
        draft.idempotencyKey = requestKeyFor('createDraft', draft);
        const created = await dataSource.createDraft(draft);
        if (!isCurrent()) return true;
        const createdId = created.id;
        setComposeOwned(true);
        setComposeSnapshot({
          draftId: createdId,
          attachments: draft.attachments ?? [],
        });
        composeRevisionRef.current = created._revision;
        composeDraftRef.current = createdId;
        setComposeDraftId(createdId);
        setSelectedId(createdId);
        onDraftSaved?.(createdId);
      }
      clearError('saveDraft');
      // The write is acknowledged: its outcome no longer depends on this
      // refresh, which reports its own errors and may outlive the composer.
      await latestRefreshMailbox.current();
      return true;
    } catch (error) {
      if (!isCurrent()) return false;
      reportError(error, 'saveDraft');
      return false;
    } finally {
      composeLockRef.current = false;
      if (isCurrent()) setSaving(false);
    }
  };

  // Sends the composition: a new one through sendMessage when the host has it,
  // otherwise through its draft. A failed send keeps the composition open and
  // editable; the host deduplicates retries by draft ID and revision, or by
  // idempotencyKey.
  const sendComposition = async (
    values: MailyMailboxComposeValues,
    onPrepared?: () => void,
    onDispatched?: () => void
  ) => {
    const isLifetimeCurrent = captureLifetime();
    const isCurrent = captureCompose();
    const selection = readerSelection.current;

    if (!isCurrent() || !composeHydrated || composeLockRef.current) return;
    const draft = composeValuesToMailboxDraft(values, draftInReplyTo);
    draft.revision = composeRevisionRef.current;
    let draftId = composeDraftRef.current ?? composeDraftId;
    // The version this send delivers: observed when opened, or the last write.
    let sendRevision = composeRevisionRef.current;
    const capabilities = composeCapabilitiesRef.current;
    const dirty = composeDirtyRef.current;
    if (
      !getMailboxComposeOperations(capabilities, {
        persisted: !!draftId,
        dirty,
      }).send
    )
      return;
    composeLockRef.current = true;
    const preparesNewDraft = !draftId;
    let wroteDraft = false;
    const ownsSelection = () =>
      readerSelection.current === selection ||
      (preparesNewDraft &&
        readerSelection.current.id === draftId &&
        readerSelection.current.epoch === selection.epoch + 1);
    setSending(true);
    try {
      let result: unknown;
      if (!draftId && capabilities.sendMessage && dataSource.sendMessage) {
        draft.idempotencyKey = requestKeyFor('sendMessage', draft);
        // Once handed to the host, the attachment references are the host's,
        // even if this send fails with an unknown outcome.
        onDispatched?.();
        result = await dataSource.sendMessage(draft);
        if (!isCurrent()) return;
        onPrepared?.();
      } else {
        if (draftId) {
          // An unchanged saved draft is sent as it is.
          if (dirty && capabilities.edit && dataSource.updateDraft) {
            const saved = await dataSource.updateDraft(draftId, draft);
            wroteDraft = true;
            sendRevision = saved._revision;
            if (isCurrent()) {
              composeRevisionRef.current = saved._revision;
              setComposeSnapshot({
                draftId,
                attachments: draft.attachments ?? [],
              });
            }
          }
        } else {
          if (!dataSource.createDraft) return;
          draft.idempotencyKey = requestKeyFor('createDraft', draft);
          const created = await dataSource.createDraft(draft);
          draftId = created.id;
          wroteDraft = true;
          sendRevision = created._revision;
          if (isCurrent()) {
            // As with Save draft, the mounted form owns the content it wrote.
            setComposeOwned(true);
            setComposeSnapshot({
              draftId,
              attachments: draft.attachments ?? [],
            });
            composeRevisionRef.current = created._revision;
            composeDraftRef.current = draftId;
            setComposeDraftId(draftId);
            setSelectedId(draftId);
          }
        }
        // Acknowledgment hands the captured form's uploaded references to the
        // draft, even if that form departed. Its callback owns its lifecycle.
        onPrepared?.();
        // A departed composition or data source never sends what it prepared.
        if (!isCurrent()) return;
        // Sending was withdrawn while the draft was written: keep it as a draft.
        if (!composeCapabilitiesRef.current.send || !dataSource.sendDraft) {
          if (wroteDraft) onDraftSaved?.(draftId);
          await latestRefreshMailbox.current();
          if (!isCurrent()) return;
          showError('sendDraft');
          return;
        }
        result = await dataSource.sendDraft(draftId, {
          revision: sendRevision,
        });
        if (!isCurrent()) return;
      }
      onSent?.(result);
      // The closing form may unmount before it reports its acknowledged state.
      composeDirtyRef.current = false;
      setComposeOpen(false);
      composeDraftRef.current = null;
      composeRevisionRef.current = undefined;
      setComposeDraftId(null);
      setComposeSeed(null);
      setComposeInReplyTo(null);
      if (ownsSelection()) clearReaderAfterMutation();
      clearError('sendDraft', 'saveDraft');
      await latestRefreshMailbox.current();
    } catch (error) {
      if (!isCurrent()) return;
      reportError(error, 'sendDraft');
    } finally {
      composeLockRef.current = false;
      if (isLifetimeCurrent()) setSending(false);
    }
  };

  const discardDraft = async () => {
    const isCurrent = captureLifetime();
    const selection = readerSelection.current;
    const ownsSelection = () => readerSelection.current === selection;
    if (!isCurrent()) return;
    if (composeLockRef.current) return;
    const draftId = composeDraftId;
    // An unsaved composition closes locally; only a persisted draft needs the host.
    if (draftId && !composeCapabilitiesRef.current.discard) return;
    composeLockRef.current = true;
    setDiscarding(true);
    try {
      if (draftId) {
        if (!dataSource.discardDraft) return;
        await dataSource.discardDraft(draftId);
        if (!isCurrent()) return;
      }
      // Discarding is explicit; unsaved content no longer guards navigation.
      composeDirtyRef.current = false;
      setComposeOpen(false);
      composeDraftRef.current = null;
      composeRevisionRef.current = undefined;
      setComposeDraftId(null);
      setComposeSeed(null);
      setComposeInReplyTo(null);
      if (ownsSelection()) clearReaderAfterMutation();
      clearError('discardDraft', 'saveDraft', 'sendDraft');
      await latestRefreshMailbox.current();
    } catch (error) {
      if (!isCurrent()) return;
      reportError(error, 'discardDraft');
    } finally {
      composeLockRef.current = false;
      if (isCurrent()) setDiscarding(false);
    }
  };

  const openSeededComposition = (
    kind: MailyMailboxComposeSeedKind,
    message: MailyMailboxMessageDetail
  ) => {
    if (composeLockRef.current) return;
    if (!allowNewComposition(() => openSeededComposition(kind, message)))
      return;
    composeDirtyRef.current = false;
    setComposeOwned(false);
    setComposeSession((session) => session + 1);
    composeDraftRef.current = null;
    composeRevisionRef.current = undefined;
    setSelectedId(message.id);
    setComposeDraftId(null);
    const { inReplyTo = null, ...seed } = createComposeSeed(kind, message, {
      account: props.account,
      labels,
      formatDate,
    });
    setComposeInReplyTo(inReplyTo);
    setComposeSeed(seed);
    setComposeOpen(true);
  };

  // Messages already marked read on open in this source lifetime.
  const autoReadIdsRef = useOwnedRef(dataSource, new Set<string>());
  const runMessageAction = async (
    message: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => {
    const isCurrent = captureLifetime();
    const selectionEpoch = readerSelection.current.epoch;
    const ownsReader = () =>
      readerSelection.current.id === message.id &&
      readerSelection.current.epoch === selectionEpoch;
    if (!isCurrent()) return;
    if (!dataSource.runMessageAction || composeLockRef.current) return;
    composeLockRef.current = true;
    setMessageActionPending(action);
    try {
      const input: MailyMailboxMessageActionInput = {
        messageId: message.id,
        action,
        value,
      };
      const result = await dataSource.runMessageAction(input);
      if (!isCurrent()) return;
      // Reads that started before this acknowledgment must not replace it.
      if (ownsReader()) detailFreshness.current += 1;
      onMessageAction?.({ ...input, message });

      if (result && 'undo' in result && result.undo)
        setUndoReceipt(result.undo);

      // Whether the message left the view is the host's to say.
      if (
        ownsReader() &&
        result &&
        !('fromAddress' in result) &&
        result.removedFromView
      ) {
        clearReaderAfterMutation();
      } else if (ownsReader() && result && 'fromAddress' in result) {
        setDetail(result);
        setThreadDetailOverride({
          selectionId: readerSelection.current.id,
          detail: result,
        });
        invalidateThread();
      } else if (ownsReader()) {
        try {
          const nextDetail = await dataSource.getMessage(message.id);
          if (!isCurrent()) return;
          if (ownsReader()) {
            setDetail(nextDetail);
            setThreadDetailOverride({
              selectionId: readerSelection.current.id,
              detail: nextDetail,
            });
            invalidateThread();
          }
          if (!isCurrent()) return;
        } catch {
          if (!isCurrent()) return;
          if (ownsReader()) {
            setSelectedId(null);
            setDetail(null);
          }
        }
      }

      clearError('messageAction');
      await latestRefreshMailbox.current();
    } catch (error) {
      if (!isCurrent()) return;
      if (action === 'markRead') autoReadIdsRef.current.delete(message.id);
      reportError(error, 'messageAction');
    } finally {
      composeLockRef.current = false;
      if (isCurrent()) setMessageActionPending(null);
    }
  };

  const runAutoReadAction = useEvent(runMessageAction);
  // Read when the detail arrives; an inline messageActions must not re-run it.
  const messageActionsForRef = useLatestRef(messageActionsFor);
  React.useEffect(() => {
    if (
      !markReadOnOpen ||
      !detail?.isUnread ||
      autoReadIdsRef.current.has(detail.id) ||
      !messageActionsForRef.current('reader', [detail.id]).includes('markRead')
    )
      return;
    if (composeLockRef.current) return;
    autoReadIdsRef.current.add(detail.id);
    void runAutoReadAction(detail, 'markRead', true);
  }, [
    detail,
    markReadOnOpen,
    autoReadIdsRef,
    composeLockRef,
    messageActionsForRef,
    runAutoReadAction,
  ]);

  const runBulkAction = async (
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => {
    const ids = [...selectedIds];
    if (!messageActionsFor('bulk', ids).includes(action)) return;
    const selectedSet = bulkSelection.current;
    const reader = readerSelection.current;
    const isCurrent = captureLifetime();
    if (!ids.length || !dataSource.runBulkMessageAction || !isCurrent()) return;
    if (composeLockRef.current) return;
    composeLockRef.current = true;
    setMessageActionPending(action);
    try {
      const result = await dataSource.runBulkMessageAction({
        messageIds: ids,
        action,
        value,
      });
      if (!isCurrent()) return;
      if (result && 'undo' in result && result.undo)
        setUndoReceipt(result.undo);
      clearError('bulkAction');
      if (bulkSelection.current === selectedSet) setSelectedIds([]);
      if (readerSelection.current === reader) clearReaderAfterMutation();
      await latestRefreshMailbox.current();
    } catch (error) {
      if (isCurrent()) reportError(error, 'bulkAction');
    } finally {
      composeLockRef.current = false;
      if (isCurrent()) setMessageActionPending(null);
    }
  };

  const runUndo = async () => {
    if (!undoReceipt || !dataSource.undoMessageAction || composeLockRef.current)
      return;
    if (
      undoReceipt.expiresAt &&
      new Date(undoReceipt.expiresAt).getTime() <= Date.now()
    ) {
      setUndoReceipt(null);
      return;
    }
    const isCurrent = captureLifetime();
    composeLockRef.current = true;
    try {
      await dataSource.undoMessageAction(undoReceipt.token);
      if (!isCurrent()) return;
      setUndoReceipt(null);
      clearError('undo');
      // The host reverted state the reader may be showing; drop the mutation
      // overlay and read the selected message and thread again.
      setThreadDetailOverride(null);
      invalidateDetail();
      invalidateThread();
      await latestRefreshMailbox.current();
    } catch (error) {
      if (isCurrent()) reportError(error, 'undo');
    } finally {
      composeLockRef.current = false;
    }
  };

  React.useEffect(() => {
    if (!undoReceipt?.expiresAt) return;
    const expiresAt = new Date(undoReceipt.expiresAt).getTime();
    if (!Number.isFinite(expiresAt)) return;
    const timeout = window.setTimeout(
      () => setUndoReceipt(null),
      Math.max(0, expiresAt - Date.now())
    );
    return () => window.clearTimeout(timeout);
  }, [undoReceipt]);

  const mutateLabel = async (
    operation: 'create' | 'rename' | 'delete',
    label?: MailyMailboxLabel,
    requestedName?: string
  ) => {
    if (!dataSource.listLabels || composeLockRef.current) return;
    const name = requestedName?.trim();
    if (operation !== 'delete' && !name) return;
    const isCurrent = captureLifetime();
    const selectedLabel = labelSelection.current;
    const form = labelFormOwner.current;
    composeLockRef.current = true;
    try {
      if (operation === 'create' && dataSource.createLabel)
        await dataSource.createLabel(name!);
      if (operation === 'rename' && label && name && dataSource.renameLabel)
        await dataSource.renameLabel(label.id, name);
      if (operation === 'delete' && label && dataSource.deleteLabel) {
        await dataSource.deleteLabel(label.id);
        if (!isCurrent()) return;
        if (
          labelSelection.current === selectedLabel &&
          selectedLabel.id === label.id
        )
          setSelectedLabelId(null);
      }
      if (!isCurrent()) return;
      const generation = ++labelsGeneration.current;
      const nextLabels = await dataSource.listLabels();
      if (!isCurrent()) return;
      if (generation === labelsGeneration.current) setMailboxLabels(nextLabels);
      clearError('labelMutation');
      if (labelFormOwner.current === form) {
        setLabelForm(null);
        setLabelName('');
      }
      await latestRefreshMailbox.current();
    } catch (error) {
      if (isCurrent()) reportError(error, 'labelMutation');
    } finally {
      composeLockRef.current = false;
    }
  };

  const applyLabelToSelection = async (labelId: string, remove = false) => {
    if (!selectedIds.length || composeLockRef.current) return;
    const action = remove ? dataSource.removeLabel : dataSource.applyLabel;
    if (!action) return;
    const isCurrent = captureLifetime();
    composeLockRef.current = true;
    try {
      await action.call(dataSource, selectedIds, labelId);
      if (!isCurrent()) return;
      clearError('labelMutation');
      await latestRefreshMailbox.current();
    } catch (error) {
      if (isCurrent()) reportError(error, 'labelMutation');
    } finally {
      composeLockRef.current = false;
    }
  };

  const labelInputId = React.useId();

  const initialComposeValues = React.useMemo(() => {
    if (composeDraftId && detail?.id === composeDraftId) {
      return detailToComposeValues(detail);
    }
    return composeSeed ?? emptyComposeValues();
  }, [composeDraftId, composeSeed, detail]);

  const labelDialogContent = (
    <DialogContent
      showCloseButton={false}
      className="sm:max-w-sm"
      onKeyDown={(event) => {
        // Radix focuses before its passive Escape listener registers. Preserve
        // immediate dismissal in this leaf dialog even if an older layer consumed
        // the key during registration; host modality/focus behavior stays intact.
        if (event.key === 'Escape') {
          event.preventDefault();
          setLabelForm(null);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {t(
            labelForm?.mode === 'delete'
              ? 'actions.deleteLabel'
              : labelForm?.mode === 'rename'
                ? 'actions.renameLabel'
                : 'actions.createLabel'
          )}
        </DialogTitle>
        <DialogDescription>
          {labelForm?.mode === 'delete'
            ? labelForm.label?.name
            : t('labels.description')}
        </DialogDescription>
      </DialogHeader>
      {labelForm?.mode === 'delete' ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLabelForm(null)}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void mutateLabel('delete', labelForm.label)}
          >
            {t('actions.deleteLabel')}
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (labelForm)
              void mutateLabel(labelForm.mode, labelForm.label, labelName);
          }}
        >
          <Field>
            <FieldLabel htmlFor={labelInputId}>{t('labels.name')}</FieldLabel>
            <Input
              id={labelInputId}
              value={labelName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setLabelName(event.target.value)
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLabelForm(null)}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={!labelName.trim()}>
              {t(
                labelForm?.mode === 'rename'
                  ? 'actions.renameLabel'
                  : 'actions.createLabel'
              )}
            </Button>
          </div>
        </form>
      )}
    </DialogContent>
  );

  const returnToList = () => {
    if (composeLockRef.current) return;
    if (!allowComposeNavigation(returnToList)) return;
    if (readerSelectionControlled && selectedId !== null) {
      pendingBackRequest.current = true;
      setSelectedId(null);
      return;
    }
    setSelectedId(null);
    setComposeOpen(false);
    composeDraftRef.current = null;
    composeRevisionRef.current = undefined;
    setComposeDraftId(null);
    setComposeSeed(null);
    setComposeInReplyTo(null);
    setComposeOwned(false);
  };
  // Completes a Back request after the host accepted the null selection.
  const returnToAcceptedList = useEvent(returnToList);
  React.useEffect(() => {
    if (pendingBackRequest.current && selectedId === null) {
      pendingBackRequest.current = false;
      returnToAcceptedList();
    }
  }, [returnToAcceptedList, selectedId]);
  const detailOpen = composeOpen || !!selectedId;
  const previousDetailOpen = React.useRef(detailOpen);
  React.useEffect(() => {
    if (previousDetailOpen.current && !detailOpen) {
      const target = lastMessageTrigger.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
      else listRef.current?.focus({ preventScroll: true });
    }
    previousDetailOpen.current = detailOpen;
  }, [detailOpen]);
  const focusBack = React.useCallback((node: HTMLButtonElement | null) => {
    if (
      node &&
      (document.activeElement === document.body ||
        document.activeElement === lastMessageTrigger.current)
    ) {
      node.focus({ preventScroll: true });
    }
  }, []);
  const backButton = (
    <MailboxIconButton
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      ref={focusBack}
      data-mailbox-back
      aria-label={t('navigation.back')}
      onClick={returnToList}
      disabled={saving || sending || discarding}
    >
      <ArrowLeft className="size-4" />
    </MailboxIconButton>
  );
  const navigation = (
    <div className="flex shrink-0 flex-col gap-2 p-3 [&_button]:min-h-11">
      {canStartComposition(draftCapabilities) && (
        <Button
          type="button"
          size="icon"
          onClick={openNewDraft}
          className="w-full justify-start gap-2 px-2.5"
          aria-label={t('compose.new')}
        >
          <Pencil className="size-4" />
          <span className="inline min-w-0 truncate">{t('compose.new')}</span>
        </Button>
      )}
      <nav className="flex w-full flex-col gap-0.5">
        {(props.folders ?? FOLDERS).map((item) => {
          const active = folder === item && !selectedLabelId && !globalSearch;
          const count = counts[item] ?? 0;
          return (
            <Button
              key={item}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t(`folders.${item}`)}
              aria-current={active ? 'page' : undefined}
              onClick={() => selectFolder(item)}
              className={cn(
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative w-full justify-start gap-2 px-2.5',
                active &&
                  'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
              )}
            >
              {folderIcon(item, 'size-4')}
              <span className="inline min-w-0 flex-1 truncate text-left">
                {t(`folders.${item}`)}
              </span>
              {count > 0 && (
                <span className="text-muted-foreground min-w-[2ch] text-right text-xs tabular-nums">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </nav>
      {dataSource.listLabels && (
        <>
          <div className="mt-4 flex w-full items-center justify-between">
            <span className="inline px-2.5 text-sm font-medium">
              {t('labels.heading')}
            </span>
            {dataSource.createLabel && (
              <Dialog
                open={labelForm?.mode === 'create'}
                onOpenChange={(open) => {
                  if (!open) setLabelForm(null);
                }}
              >
                <DialogTrigger asChild>
                  <MailboxIconButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('actions.createLabel')}
                    onClick={() => {
                      setLabelForm({ mode: 'create' });
                      setLabelName('');
                    }}
                  >
                    <Plus className="size-4" />
                  </MailboxIconButton>
                </DialogTrigger>
                {labelDialogContent}
              </Dialog>
            )}
          </div>
          <ul className="w-full space-y-0.5">
            {mailboxLabels.map((label) => (
              <li key={label.id} className="group flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'min-w-0 flex-1 justify-start gap-2',
                    selectedLabelId === label.id && 'bg-accent font-medium'
                  )}
                  aria-label={label.name}
                  aria-current={
                    selectedLabelId === label.id ? 'page' : undefined
                  }
                  onClick={() => {
                    const navigate = () => {
                      selectFolder('allMail', label.id);
                    };
                    if (
                      !composeLockRef.current &&
                      allowComposeNavigation(navigate)
                    )
                      navigate();
                  }}
                >
                  <Tag className="size-4 shrink-0" />
                  <span className="inline min-w-0 truncate">{label.name}</span>
                </Button>
                {(dataSource.renameLabel || dataSource.deleteLabel) && (
                  <Dialog
                    open={labelForm?.label?.id === label.id}
                    onOpenChange={(open) => {
                      if (!open) setLabelForm(null);
                    }}
                  >
                    <DropdownMenu>
                      <DialogTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <MailboxIconButton
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="inline-flex size-11 shrink-0"
                            aria-label={`${t('actions.more')}: ${label.name}`}
                          >
                            <MoreVertical className="size-4" />
                          </MailboxIconButton>
                        </DropdownMenuTrigger>
                      </DialogTrigger>
                      <DropdownMenuContent align="start">
                        {dataSource.renameLabel && (
                          <DropdownMenuItem
                            onClick={() => {
                              setLabelForm({ mode: 'rename', label });
                              setLabelName(label.name);
                            }}
                          >
                            {t('actions.renameLabel')}
                          </DropdownMenuItem>
                        )}
                        {dataSource.deleteLabel && (
                          <DropdownMenuItem
                            onClick={() =>
                              setLabelForm({ mode: 'delete', label })
                            }
                          >
                            {t('actions.deleteLabel')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {labelDialogContent}
                  </Dialog>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  return (
    <div
      ref={mailboxRef}
      className={cn(
        'maily-mailbox border-border bg-background text-foreground @container/mailbox flex h-[42rem] max-h-[calc(100dvh-2rem)] min-h-0 min-w-0 overflow-hidden rounded-lg border',
        className
      )}
    >
      {!compact && (
        <aside
          aria-label={t('navigation.menu')}
          className="bg-muted/30 border-border flex w-52 shrink-0 flex-col overflow-y-auto border-r"
        >
          {navigation}
        </aside>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-border flex shrink-0 items-center border-b">
          {compact && (
            <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
              <SheetTrigger asChild>
                <MailboxIconButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-11 shrink-0"
                  aria-label={t('navigation.menu')}
                >
                  <Menu className="size-5" />
                </MailboxIconButton>
              </SheetTrigger>
              <SheetContent
                side="left"
                showCloseButton={false}
                aria-describedby={undefined}
                className="flex w-72 max-w-[calc(100vw-3rem)] flex-col gap-0 p-0"
              >
                <SheetHeader className="flex-row items-center justify-between p-3">
                  <SheetTitle>{t('navigation.menu')}</SheetTitle>
                  <SheetClose asChild>
                    <MailboxIconButton
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={t('navigation.close')}
                    >
                      <X className="size-4" />
                    </MailboxIconButton>
                  </SheetClose>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  {navigation}
                </div>
              </SheetContent>
            </Sheet>
          )}
          <div className="min-w-0 flex-1 p-2">
            {/* The form renders outside InputGroupAddon: React bubbles clicks from
                portalled content through the component tree, and the addon's
                click handler would focus the search input and dismiss it. */}
            <Popover
              open={advancedSearchOpen}
              onOpenChange={(open) => {
                if (open) setSearchDraft(searchFields);
                setAdvancedSearchOpen(open);
              }}
            >
              <InputGroup className="bg-muted/30 h-11">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSearch(event.target.value);
                  }}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="h-10 min-w-0 px-1.5 py-0 text-base"
                />
                {(searchClearable || advancedSearchAvailable) && (
                  <InputGroupAddon align="inline-end">
                    {searchClearable && (
                      <MailboxIconButton
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-11"
                        aria-label={t('search.clear')}
                        onClick={() => {
                          setSearch('');
                          if (searchControlled) return;
                          setSearchFields({});
                        }}
                      >
                        <X className="size-4" />
                      </MailboxIconButton>
                    )}
                    {advancedSearchAvailable && (
                      <PopoverTrigger asChild>
                        <MailboxIconButton
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          aria-label={t('search.advanced')}
                        >
                          <Filter className="size-4" />
                        </MailboxIconButton>
                      </PopoverTrigger>
                    )}
                  </InputGroupAddon>
                )}
                {refreshing && (
                  <InputGroupAddon align="inline-end">
                    <LoaderCircleIcon
                      className="size-4 animate-spin"
                      aria-label={t('refresh')}
                    />
                  </InputGroupAddon>
                )}
              </InputGroup>
              {advancedSearchAvailable && (
                <PopoverContent
                  align="start"
                  className="w-80 max-w-[calc(100vw-2rem)] p-4"
                >
                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setSearchFields(
                        withEnabledSearchFilters(
                          searchDraft,
                          enabledSearchFilters
                        )
                      );
                      setAdvancedSearchOpen(false);
                    }}
                  >
                    {enabledSearchFilters.map((key) =>
                      key === 'hasAttachments' || key === 'unread' ? (
                        <Field key={key} orientation="horizontal">
                          <Checkbox
                            id={`${labelInputId}-search-${key}`}
                            checked={!!searchDraft[key]}
                            onCheckedChange={(checked) => {
                              setSearchDraft((current) => ({
                                ...current,
                                [key]: checked === true || undefined,
                              }));
                            }}
                          />
                          <FieldLabel htmlFor={`${labelInputId}-search-${key}`}>
                            {t(`search.${key}`)}
                          </FieldLabel>
                        </Field>
                      ) : (
                        <Field
                          key={key}
                          orientation="horizontal"
                          className="grid grid-cols-[6rem_1fr] items-center gap-2"
                        >
                          <FieldLabel htmlFor={`${labelInputId}-search-${key}`}>
                            {t(`search.${key}`)}
                          </FieldLabel>
                          <Input
                            id={`${labelInputId}-search-${key}`}
                            value={searchDraft[key] ?? ''}
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              setSearchDraft((current) => ({
                                ...current,
                                [key]: event.target.value || undefined,
                              }));
                            }}
                          />
                        </Field>
                      )
                    )}
                    <div className="flex justify-end">
                      <Button type="submit" size="sm">
                        {t('search.submit')}
                      </Button>
                    </div>
                  </form>
                </PopoverContent>
              )}
            </Popover>
          </div>
        </div>
        {pendingNavigation && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) setPendingNavigation(null);
            }}
          >
            <DialogContent
              showCloseButton={false}
              className="sm:max-w-sm"
              aria-describedby={undefined}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setPendingNavigation(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{t('compose.unsavedConfirm')}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingNavigation(null)}
                >
                  {t('compose.stay')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const navigate = pendingNavigation;
                    composeDirtyRef.current = false;
                    setPendingNavigation(null);
                    navigate();
                  }}
                >
                  {t('compose.discard')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {errorNotice && (
          <div
            role="status"
            className="border-destructive/30 bg-destructive/10 text-destructive flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{t(errorNotice.key)}</span>
          </div>
        )}
        {undoReceipt && dataSource.undoMessageAction && (
          <div
            role="status"
            className="bg-foreground text-background flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span>{t('actions.completed')}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                !!messageActionPending || saving || sending || discarding
              }
              onClick={() => void runUndo()}
            >
              {t('actions.undo')}
            </Button>
          </div>
        )}
        <div
          ref={listRef}
          tabIndex={-1}
          hidden={detailOpen}
          className={cn(
            'min-h-0 flex-1 flex-col outline-none',
            detailOpen ? 'hidden' : 'flex'
          )}
        >
          <div className="border-border flex min-h-11 flex-wrap items-center gap-x-0 gap-y-1 border-b py-1 pr-2">
            {(dataSource.runBulkMessageAction ||
              dataSource.applyLabel ||
              dataSource.removeLabel) && (
              <Label className="flex size-11 shrink-0 items-center justify-center">
                <MailboxTooltip label={t('actions.selectAll')}>
                  <Checkbox
                    aria-label={t('actions.selectAll')}
                    checked={
                      messages.items.length > 0 &&
                      messages.items.every((message) =>
                        selectedIds.includes(message.id)
                      )
                    }
                    disabled={
                      !messages.items.length || messagesLoading || loadingMore
                    }
                    onCheckedChange={(checked) =>
                      setSelectedIds(
                        checked === true
                          ? messages.items.map((message) => message.id)
                          : []
                      )
                    }
                  />
                </MailboxTooltip>
              </Label>
            )}
            {selectedIds.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                <span className="sr-only">
                  {t('selection.count', { count: selectedIds.length })}
                </span>
                {messageActionsFor('bulk', selectedIds)
                  .filter((action) =>
                    [
                      'archive',
                      'delete',
                      'reportSpam',
                      'markRead',
                      'markUnread',
                      'restore',
                      'notSpam',
                      'deleteForever',
                    ].includes(action)
                  )
                  .filter((action) => {
                    if (action === 'markRead')
                      return messages.items.some(
                        (row) => selectedIds.includes(row.id) && row.isUnread
                      );
                    if (action === 'markUnread')
                      return messages.items.some(
                        (row) => selectedIds.includes(row.id) && !row.isUnread
                      );
                    return true;
                  })
                  .map((action) => (
                    <BulkActionButton
                      key={action}
                      action={action}
                      label={t(MESSAGE_ACTION_METADATA[action].label)}
                      disabled={!!messageActionPending}
                      onRun={runBulkAction}
                    />
                  ))}
                {mailboxLabels.length > 0 &&
                  (dataSource.applyLabel || dataSource.removeLabel) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <MailboxIconButton
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          aria-label={t(
                            dataSource.applyLabel
                              ? 'actions.applyLabel'
                              : 'actions.removeLabel'
                          )}
                        >
                          <Tag className="size-4" />
                        </MailboxIconButton>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-56 space-y-1">
                        {mailboxLabels.map((label, labelIndex) => {
                          const checked = messages.items
                            .filter((row) => selectedIds.includes(row.id))
                            .every(
                              (row) =>
                                row.labels?.includes(label.id) ||
                                row.labels?.includes(label.name)
                            );
                          return (
                            <Field
                              key={label.id}
                              orientation="horizontal"
                              className="hover:bg-accent gap-2 rounded-sm px-2 py-1.5"
                            >
                              <Checkbox
                                id={`${labelInputId}-apply-${labelIndex}`}
                                checked={checked}
                                disabled={
                                  checked
                                    ? !dataSource.removeLabel
                                    : !dataSource.applyLabel
                                }
                                onCheckedChange={(value) =>
                                  void applyLabelToSelection(
                                    label.id,
                                    value !== true
                                  )
                                }
                              />
                              <FieldLabel
                                htmlFor={`${labelInputId}-apply-${labelIndex}`}
                                className="min-w-0 truncate"
                              >
                                {label.name}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  )}
              </div>
            )}
            {selectedIds.length === 0 && (
              <MailboxIconButton
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t('refresh')}
                disabled={refreshing || loadingMore}
                onClick={() => void refreshMailbox()}
              >
                <RotateCwIcon
                  className={cn('size-4', refreshing && 'animate-spin')}
                />
              </MailboxIconButton>
            )}
            <div className="ml-auto flex items-center gap-1">
              <span
                className="text-muted-foreground px-1 text-xs whitespace-nowrap tabular-nums"
                aria-live="polite"
              >
                {t(
                  pageTotal === undefined
                    ? 'pagination.range'
                    : 'pagination.rangeWithTotal',
                  { start: pageStart, end: pageEnd, total: pageTotal ?? 0 }
                )}
              </span>
              <MailboxIconButton
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t('pagination.previous')}
                disabled={
                  !hasPreviousPage ||
                  messagesLoading ||
                  loadingMore ||
                  refreshing
                }
                onClick={() => void changePage('previous')}
              >
                <ChevronRight className="size-4 rotate-180" />
              </MailboxIconButton>
              <MailboxIconButton
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t('pagination.next')}
                disabled={
                  !messages.nextCursor ||
                  messagesLoading ||
                  loadingMore ||
                  refreshing
                }
                onClick={() => void changePage('next')}
              >
                <ChevronRight className="size-4" />
              </MailboxIconButton>
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <MessageList
              folder={listFolder}
              labels={labels}
              rows={messages.items}
              isLoading={messagesLoading}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelect={(row) => {
                lastMessageTrigger.current =
                  document.activeElement as HTMLElement;
                selectMessage(row);
              }}
              onToggleSelection={
                dataSource.runBulkMessageAction ||
                dataSource.applyLabel ||
                dataSource.removeLabel
                  ? (ids) =>
                      setSelectedIds((current) =>
                        ids.every((id) => current.includes(id))
                          ? current.filter((id) => !ids.includes(id))
                          : [...new Set([...current, ...ids])]
                      )
                  : undefined
              }
              onToggleFavorite={
                messageActionsFor('list', []).includes('favorite')
                  ? (row) =>
                      void runMessageAction(row, 'favorite', !row.isFavorite)
                  : undefined
              }
              formatDate={formatDate}
            />
          </ScrollArea>
        </div>
        {detailOpen && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {composeOpen ? (
              <>
                <div className="border-border flex min-h-12 items-center border-b px-2">
                  {backButton}
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  {!composeHydrated ? (
                    <div role="status" className="p-5">
                      {t('loading')}
                    </div>
                  ) : (
                    <Compose
                      key={composeSession}
                      initialValues={initialComposeValues}
                      labels={labels}
                      loadContactSuggestions={loadContactSuggestions}
                      defaultBodyMode={defaultComposeBodyMode}
                      allowBodyModeSwitch={allowComposeBodyModeSwitch}
                      editorProps={composeEditorProps}
                      isExistingDraft={!!composeDraftId}
                      capabilities={composeCapabilities}
                      attachmentsReadOnly={draftHasUnreferencedAttachments}
                      savedAttachments={
                        composeDraftId && composeAttachments?.length
                          ? {
                              messageId: composeDraftId,
                              attachments: composeAttachments,
                            }
                          : undefined
                      }
                      downloadAttachment={adapterMethods.downloadAttachment}
                      isSaving={saving}
                      autosaveDelayMs={autosaveDelayMs}
                      isSending={sending}
                      isDiscarding={discarding}
                      ownershipToken={lifetimeRef}
                      uploadAttachment={adapterMethods.uploadAttachment}
                      discardUploadedAttachment={
                        adapterMethods.discardUploadedAttachment
                      }
                      onError={onError}
                      onDirtyChange={(dirty) => {
                        composeDirtyRef.current = dirty;
                      }}
                      onSave={saveDraft}
                      onSend={sendComposition}
                      onDiscard={discardDraft}
                    />
                  )}
                </ScrollArea>
              </>
            ) : selectedId ? (
              <MessageReader
                key={selectedId}
                backButton={backButton}
                getMessageSource={adapterMethods.getMessageSource}
                thread={thread}
                threadDetailOverride={
                  threadDetailOverride?.selectionId === selectedId
                    ? threadDetailOverride.detail
                    : null
                }
                detail={detail}
                isLoading={detailLoading}
                labels={labels}
                formatDate={formatDate}
                messageActions={messageActionsFor('reader', [selectedId])}
                actionPending={messageActionPending}
                onReply={
                  canStartComposition(draftCapabilities)
                    ? (message) => openSeededComposition('reply', message)
                    : undefined
                }
                onReplyAll={
                  canStartComposition(draftCapabilities)
                    ? (message) => openSeededComposition('replyAll', message)
                    : undefined
                }
                onForward={
                  canStartComposition(draftCapabilities)
                    ? (message) => openSeededComposition('forward', message)
                    : undefined
                }
                onRunAction={runMessageAction}
                downloadAttachment={adapterMethods.downloadAttachment}
                onError={onError}
              />
            ) : null}
          </div>
        )}
      </div>
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
  selectedIds: string[];
  onSelect: (row: MailyMailboxMessageRow) => void;
  onToggleSelection?: (ids: string[]) => void;
  onToggleFavorite?: (row: MailyMailboxMessageRow) => void;
  formatDate: (date: string | Date, mode: 'short' | 'long') => string;
}) {
  const {
    folder,
    labels,
    rows,
    isLoading,
    selectedId,
    selectedIds,
    onSelect,
    onToggleSelection,
    onToggleFavorite,
    formatDate,
  } = props;
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center gap-2 text-sm">
        <LoaderCircleIcon className="size-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState className="h-full" title={t(`empty.${folder}`)} />;
  }

  return (
    <div className="@container/list min-w-0 [contain:inline-size]">
      <ul className="divide-border divide-y">
        {groupMailboxMessagesByThread(rows).map((conversation) => {
          const groupRows = conversation.messages;
          const row = groupRows[groupRows.length - 1];
          const conversationIds = groupRows.map((item) => item.id);
          const active = groupRows.some((item) => item.id === selectedId);
          const allSelected = conversationIds.every((id) =>
            selectedIds.includes(id)
          );
          const display =
            row.direction === 'in'
              ? row.fromAddress
              : formatRecipients(row.toAddresses);

          return (
            <li
              key={conversation.threadId ?? row.id}
              className={cn(
                'flex min-w-0 items-stretch',
                (active || allSelected) && 'bg-accent',
                !row.isUnread && 'bg-muted/20'
              )}
            >
              {onToggleSelection && (
                <Label className="flex size-11 shrink-0 items-center justify-center">
                  <MailboxTooltip
                    label={t(
                      allSelected
                        ? 'actions.deselectConversation'
                        : 'actions.selectConversation',
                      { subject: row.subject || t('message.noSubject') }
                    )}
                  >
                    <Checkbox
                      aria-label={t(
                        allSelected
                          ? 'actions.deselectConversation'
                          : 'actions.selectConversation',
                        { subject: row.subject || t('message.noSubject') }
                      )}
                      checked={allSelected}
                      onCheckedChange={() =>
                        onToggleSelection?.(conversationIds)
                      }
                    />
                  </MailboxTooltip>
                </Label>
              )}
              {onToggleFavorite && (
                <MailboxIconButton
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-11 shrink-0"
                  aria-label={t(
                    row.isFavorite ? 'actions.unfavorite' : 'actions.favorite'
                  )}
                  onClick={() => onToggleFavorite(row)}
                >
                  <Star
                    className={cn(
                      'text-muted-foreground size-4',
                      row.isFavorite && 'fill-current text-amber-500'
                    )}
                  />
                </MailboxIconButton>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelect(row)}
                className={cn(
                  'hover:bg-accent grid h-auto min-h-11 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-none px-2 py-2 text-left font-normal whitespace-normal @3xl/list:grid-cols-[12rem_minmax(0,1fr)_auto]',
                  active && 'bg-accent'
                )}
              >
                <span
                  className={cn(
                    'col-start-1 row-start-1 min-w-0 truncate text-sm',
                    row.isUnread ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {display || t('message.unknownSender')}
                </span>
                <span className="col-span-2 col-start-1 row-start-2 flex min-w-0 flex-col @3xl/list:col-span-1 @3xl/list:col-start-2 @3xl/list:row-start-1 @3xl/list:flex-row @3xl/list:items-center @3xl/list:gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 @3xl/list:max-w-[65%] @3xl/list:shrink-0">
                    {row.isFavorite && !onToggleFavorite && (
                      <Star className="size-3.5 shrink-0 fill-current text-amber-500" />
                    )}
                    <span
                      className={cn(
                        'truncate text-sm',
                        row.isUnread && 'font-semibold'
                      )}
                    >
                      {row.subject || t('message.noSubject')}
                    </span>
                    {groupRows.length > 1 && (
                      <Badge variant="outline">{groupRows.length}</Badge>
                    )}
                    {row.hasAttachments && (
                      <Paperclip className="text-muted-foreground size-3 shrink-0" />
                    )}
                  </span>
                  {row.snippet && (
                    <span className="text-muted-foreground min-w-0 truncate text-sm">
                      {row.snippet}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground col-start-2 row-start-1 text-xs @3xl/list:col-start-3">
                  {formatDate(row.createdAt, 'short')}
                </span>
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

/** Source is rendered as escaped text, never as HTML or an iframe. */
function MessageSource(props: {
  messageId: string;
  getSource: NonNullable<MailyMailboxDataSource['getMessageSource']>;
  labels: MailyMailboxLabels;
  onBack: () => void;
  onError: MailyMailboxViewProps['onError'];
}) {
  const { messageId, getSource, labels, onBack, onError } = props;
  const [attempt, setAttempt] = React.useState(0);
  // Each request (message, adapter or retry) starts from an empty view.
  const request = [getSource, messageId, attempt];
  const [source, setSource] = useResettableState<string | null>(
    () => null,
    request
  );
  const [failed, setFailed] = useResettableState(() => false, request);
  const errorHandler = useLatestRef(onError);
  React.useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => getSource(messageId))
      .then(
        (value) => {
          if (active) setSource(value);
        },
        (error) => {
          if (!active) return;
          setFailed(true);
          errorHandler.current?.(error, 'messageSource');
        }
      );
    return () => {
      active = false;
    };
  }, [getSource, messageId, attempt, setSource, setFailed, errorHandler]);

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-label={labels['actions.showOriginal']}
    >
      <div className="border-border flex shrink-0 items-center gap-2 border-b p-3">
        <Button variant="outline" onClick={onBack}>
          {labels['source.back']}
        </Button>
      </div>
      {failed ? (
        <div className="space-y-3 p-5">
          <p role="alert" className="text-sm">
            {labels['source.error']}
          </p>
          <Button
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {labels['source.retry']}
          </Button>
        </div>
      ) : source === null ? (
        <p role="status" className="text-muted-foreground p-5 text-sm">
          {labels.loading}
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <pre
            className="p-5 font-mono text-xs break-all whitespace-pre-wrap"
            tabIndex={0}
          >
            {source}
          </pre>
        </ScrollArea>
      )}
    </section>
  );
}

function MessageReader(props: {
  backButton: React.ReactNode;
  getMessageSource: MailyMailboxDataSource['getMessageSource'];
  thread?: MailyMailboxThread | null;
  threadDetailOverride?: MailyMailboxMessageDetail | null;
  detail: MailyMailboxMessageDetail | null;
  isLoading: boolean;
  labels: MailyMailboxLabels;
  formatDate: (date: string | Date, mode: 'short' | 'long') => string;
  messageActions: readonly MailyMailboxMessageAction[];
  actionPending: MailyMailboxMessageAction | null;
  /** Reply and Forward start new compositions; omitted without draft creation. */
  onReply?: (detail: MailyMailboxMessageDetail) => void;
  onReplyAll?: (detail: MailyMailboxMessageDetail) => void;
  onForward?: (detail: MailyMailboxMessageDetail) => void;
  downloadAttachment: MailyMailboxDataSource['downloadAttachment'];
  onError: MailyMailboxViewProps['onError'];
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
    messageActions,
    actionPending,
    onReply,
    onReplyAll,
    onForward,
    onRunAction,
  } = props;
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);

  const [showSource, setShowSource] = React.useState(false);
  const runReaderAction: typeof onRunAction = async (
    message,
    action,
    value
  ) => {
    if (action === 'showOriginal' && props.getMessageSource) {
      setShowSource(true);
      return;
    }
    await onRunAction(message, action, value);
  };

  if (showSource && detail && props.getMessageSource) {
    return (
      <MessageSource
        messageId={detail.id}
        getSource={props.getMessageSource}
        labels={labels}
        onBack={() => setShowSource(false)}
        onError={props.onError}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="border-border flex min-h-12 shrink-0 items-center border-b px-2">
          {props.backButton}
        </div>
        <div
          role="status"
          className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm"
        >
          <LoaderCircleIcon className="size-4 animate-spin" />
          {t('loading')}
        </div>
      </>
    );
  }

  if (!detail)
    return (
      <div className="border-border flex min-h-12 items-center border-b px-2">
        {props.backButton}
      </div>
    );

  const threadDetail = props.threadDetailOverride;
  const threadMessages =
    props.thread?.threadId && props.thread.threadId === detail.threadId
      ? !threadDetail
        ? props.thread.messages
        : props.thread.messages.some(
              (message) => message.id === threadDetail.id
            )
          ? props.thread.messages.map((message) =>
              message.id === threadDetail.id ? threadDetail : message
            )
          : [...props.thread.messages, threadDetail]
      : [detail];
  const labelsToShow = detail.labels ?? [];
  const isFavorite = detail.isFavorite ?? false;
  const enabledActions = new Set(messageActions);
  const toolbarLeadingActions = TOOLBAR_LEADING_MESSAGE_ACTIONS.filter(
    (action) => enabledActions.has(action)
  );
  const toolbarTrailingActions = TOOLBAR_TRAILING_MESSAGE_ACTIONS.filter(
    (action) => enabledActions.has(action)
  );
  const headerActions = HEADER_MESSAGE_ACTIONS.filter((action) =>
    enabledActions.has(action)
  );
  const run = (
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => runReaderAction(detail, action, value);
  const actionLabel = (
    action: MailyMailboxMessageAction,
    mode: 'button' | 'menu'
  ) => {
    if (action === 'favorite' && isFavorite) return t('actions.unfavorite');
    if (action === 'showOriginal' && props.getMessageSource)
      return t('actions.showOriginal');
    const metadata = MESSAGE_ACTION_METADATA[action];
    return t(
      mode === 'button' && metadata.toolbarLabel
        ? metadata.toolbarLabel
        : metadata.label
    );
  };
  const actionValue = (action: MailyMailboxMessageAction) => {
    if (action === 'favorite') return !isFavorite;
    return MESSAGE_ACTION_METADATA[action].value;
  };
  const actionIconClassName = (action: MailyMailboxMessageAction) =>
    cn(
      'size-4',
      action === 'favorite' && isFavorite && 'fill-current text-amber-500'
    );
  const renderActionButton = (action: MailyMailboxMessageAction) => (
    <MessageActionButton
      key={action}
      label={actionLabel(action, 'button')}
      className={
        action === 'react' ? 'hidden @md/mailbox:inline-flex' : undefined
      }
      pending={actionPending === action}
      pressed={action === 'favorite' ? isFavorite : undefined}
      onClick={() => run(action, actionValue(action))}
    >
      {action === 'showOriginal' && !props.getMessageSource ? (
        <ExternalLink className="size-4" />
      ) : (
        MESSAGE_ACTION_METADATA[action].icon(actionIconClassName(action))
      )}
    </MessageActionButton>
  );

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-1 border-b px-2 py-1">
        <div className="flex flex-wrap items-center gap-1">
          {props.backButton}
          {toolbarLeadingActions.map(renderActionButton)}
        </div>
        <div className="flex items-center gap-1">
          {toolbarTrailingActions.map(renderActionButton)}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="min-w-0 [contain:inline-size]">
          <div className="flex flex-col gap-4 px-3 pt-4 @lg/mailbox:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 text-xl leading-tight font-semibold [overflow-wrap:anywhere] break-words">
                    {detail.subject || t('message.noSubject')}
                  </h2>
                  {labelsToShow.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                {headerActions.map(renderActionButton)}
                {onReply && (
                  <MessageActionButton
                    label={t('actions.reply')}
                    pending={false}
                    onClick={() => onReply(detail)}
                  >
                    <Reply className="size-4" />
                  </MessageActionButton>
                )}
                {onReplyAll && (
                  <MessageActionButton
                    className={
                      messageActions.length > 0
                        ? 'hidden @md/mailbox:inline-flex'
                        : undefined
                    }
                    label={t('actions.replyAll')}
                    pending={false}
                    onClick={() => onReplyAll(detail)}
                  >
                    <ReplyAll className="size-4" />
                  </MessageActionButton>
                )}
                {onForward && (
                  <MessageActionButton
                    className={
                      messageActions.length > 0
                        ? 'hidden @md/mailbox:inline-flex'
                        : undefined
                    }
                    label={t('actions.forward')}
                    pending={false}
                    onClick={() => onForward(detail)}
                  >
                    <Forward className="size-4" />
                  </MessageActionButton>
                )}
                {messageActions.length > 0 && (
                  <MessageMoreMenu
                    detail={detail}
                    labels={labels}
                    messageActions={messageActions}
                    actionPending={actionPending}
                    isFavorite={isFavorite}
                    onRunAction={runReaderAction}
                    onReplyAll={onReplyAll && (() => onReplyAll(detail))}
                    onForward={onForward && (() => onForward(detail))}
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback>
                  {senderInitial(detail.fromAddress)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="truncate text-sm font-medium">
                    {detail.fromAddress}
                  </span>
                  <time className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(detail.createdAt, 'long')}
                  </time>
                </div>
                <div className="text-muted-foreground text-xs [overflow-wrap:anywhere] break-words">
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

          <div className="min-w-0 pt-4">
            {threadMessages.map((message) => (
              <section
                key={message.id}
                className="border-border mx-5 my-3 border-b pb-4 last:border-b-0"
              >
                {threadMessages.length > 1 && (
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
                    <span>{message.fromAddress}</span>
                    <time>{formatDate(message.createdAt, 'long')}</time>
                  </div>
                )}
                <div className="px-2">
                  {message.bodyHtml ? (
                    <HtmlBody
                      html={message.bodyHtml}
                      title={t('message.htmlBody')}
                    />
                  ) : message.bodyText ? (
                    <pre className="py-2 font-sans text-sm leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                      {message.bodyText}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground px-4 py-2 text-sm">
                      {t('message.noBody')}
                    </p>
                  )}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <section
                    aria-label={t('message.attachments', {
                      count: message.attachments.length,
                    })}
                    className="border-border mx-3 my-4 border-t pt-4"
                  >
                    <h3 className="mb-3 text-sm font-medium">
                      {t('message.attachments', {
                        count: message.attachments.length,
                      })}
                    </h3>
                    <ul className="space-y-2">
                      {message.attachments.map(
                        (attachment, attachmentIndex) => (
                          <li
                            key={`${message.id}:${attachment.id ?? attachmentIndex}`}
                          >
                            <MessageAttachment
                              messageId={message.id}
                              attachment={attachment}
                              attachmentIndex={attachmentIndex}
                              labels={labels}
                              downloadAttachment={props.downloadAttachment}
                              onError={props.onError}
                            />
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                )}
              </section>
            ))}
          </div>
        </div>
      </ScrollArea>
    </article>
  );
}

function MessageAttachment({
  messageId,
  attachment,
  attachmentIndex,
  labels,
  downloadAttachment,
  onError,
}: MailyMailboxAttachmentDownloadInput & {
  labels: MailyMailboxLabels;
  downloadAttachment: MailyMailboxDataSource['downloadAttachment'];
  onError: MailyMailboxViewProps['onError'];
}) {
  const [pending, setPending] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const inFlight = React.useRef(false);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);
  const downloadLabel = t(
    pending ? 'attachment.downloading' : 'attachment.download',
    { filename: attachment.filename }
  );
  const sizeLabels = [
    'attachment.sizeBytes',
    'attachment.sizeKB',
    'attachment.sizeMB',
    'attachment.sizeGB',
    'attachment.sizeTB',
  ] as const;
  let sizeLabel: string | undefined;
  if (
    typeof attachment.size === 'number' &&
    Number.isFinite(attachment.size) &&
    attachment.size >= 0
  ) {
    let size = attachment.size;
    let unit = 0;
    while (size >= 1024 && unit < sizeLabels.length - 1) {
      size /= 1024;
      unit++;
    }
    sizeLabel = t(sizeLabels[unit], { size: Number(size.toFixed(1)) });
  }
  const metadata = [attachment.contentType, sizeLabel]
    .filter(Boolean)
    .join(' · ');

  const download = async () => {
    if (!downloadAttachment || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);
    try {
      await downloadAttachment({ messageId, attachment, attachmentIndex });
    } catch (error) {
      if (mounted.current) {
        setFailed(true);
        onError?.(error, 'attachmentDownload');
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return (
    <Attachment className="w-full flex-nowrap" aria-busy={pending}>
      <AttachmentMedia>
        <FileText className="size-4" aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle className="[overflow-wrap:anywhere] whitespace-normal">
          {attachment.filename}
        </AttachmentTitle>
        {metadata && (
          <AttachmentDescription className="[overflow-wrap:anywhere] whitespace-normal">
            {metadata}
          </AttachmentDescription>
        )}
        {failed && (
          <p
            role="alert"
            className="text-destructive mt-1 text-xs [overflow-wrap:anywhere]"
          >
            {t('errors.attachmentDownload', { filename: attachment.filename })}
          </p>
        )}
      </AttachmentContent>
      {downloadAttachment && (
        <AttachmentActions>
          <MailboxTooltip label={downloadLabel}>
            <AttachmentAction
              type="button"
              size="icon"
              aria-label={downloadLabel}
              disabled={pending}
              onClick={download}
            >
              {pending ? (
                <LoaderCircleIcon
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
            </AttachmentAction>
          </MailboxTooltip>
        </AttachmentActions>
      )}
    </Attachment>
  );
}

/** A neutral tooltip trigger preserves the nested control's own primitive state. */
function MailboxTooltip({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center',
            className
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function BulkActionButton(props: {
  action: MailyMailboxMessageAction;
  label: string;
  disabled: boolean;
  onRun: (
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => unknown;
}) {
  const { action, label, disabled, onRun } = props;
  return (
    <MailboxIconButton
      type="button"
      size="icon"
      className="size-11"
      variant="ghost"
      aria-label={label}
      disabled={disabled}
      onClick={() => void onRun(action, MESSAGE_ACTION_METADATA[action].value)}
    >
      {MESSAGE_ACTION_METADATA[action].icon('size-4')}
    </MailboxIconButton>
  );
}

// Forward trigger props/ref through to the host Button for Popover/Dialog/Sheet/Menu composition.
const MailboxIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & {
    'aria-label': string;
    tooltipClassName?: string;
  }
>(({ className, tooltipClassName, ...props }, ref) => (
  <MailboxTooltip label={props['aria-label']} className={tooltipClassName}>
    <Button
      {...props}
      // The Tooltip shows the label; a native title would duplicate it.
      title={undefined}
      ref={ref}
      className={cn('size-11 shrink-0', className)}
    />
  </MailboxTooltip>
));
MailboxIconButton.displayName = 'MailboxIconButton';

function MessageActionButton(props: {
  label: string;
  pending: boolean;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MailboxIconButton
      type="button"
      variant="ghost"
      size="icon"
      aria-label={props.label}
      aria-pressed={props.pressed}
      disabled={props.pending}
      onClick={props.onClick}
      className="size-11 shrink-0"
      tooltipClassName={props.className}
    >
      {props.pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" />
      ) : (
        props.children
      )}
    </MailboxIconButton>
  );
}

function MessageMoreMenu(props: {
  onReplyAll?: () => void;
  onForward?: () => void;
  detail: MailyMailboxMessageDetail;
  labels: MailyMailboxLabels;
  messageActions: readonly MailyMailboxMessageAction[];
  actionPending: MailyMailboxMessageAction | null;
  isFavorite: boolean;
  onRunAction: (
    detail: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => Promise<void>;
}) {
  const {
    detail,
    labels,
    messageActions,
    actionPending,
    isFavorite,
    onRunAction,
  } = props;
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars);
  const item = (action: MailyMailboxMessageAction) => {
    const metadata = MESSAGE_ACTION_METADATA[action];
    const label =
      action === 'favorite' && isFavorite
        ? t('actions.unfavorite')
        : t(metadata.label);
    const value = action === 'favorite' ? !isFavorite : metadata.value;

    return (
      <DropdownMenuItem
        key={action}
        onClick={() => onRunAction(detail, action, value)}
        disabled={actionPending !== null}
        variant={metadata.variant}
      >
        {actionPending === action ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          metadata.icon(
            cn(
              'size-4',
              action === 'favorite' &&
                isFavorite &&
                'fill-current text-amber-500'
            )
          )
        )}
        {label}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MailboxIconButton
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={t('actions.more')}
        >
          <MoreVertical className="size-4" />
        </MailboxIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-w-[calc(100vw-2rem)]"
      >
        {props.onReplyAll && (
          <DropdownMenuItem onClick={props.onReplyAll}>
            <ReplyAll className="size-4" />
            {t('actions.replyAll')}
          </DropdownMenuItem>
        )}
        {props.onForward && (
          <DropdownMenuItem onClick={props.onForward}>
            <Forward className="size-4" />
            {t('actions.forward')}
          </DropdownMenuItem>
        )}
        {messageActions.map((action) => item(action))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HtmlBody({ html, title }: { html: string; title: string }) {
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
      title={title}
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
  capabilities: MailboxDraftCapabilities;
  /** The saved draft has attachments without host IDs, so it is read-only. */
  attachmentsReadOnly?: boolean;
  /** Shown when the draft is read-only: its saved attachments. */
  savedAttachments?: SavedDraftAttachments;
  downloadAttachment?: MailyMailboxDataSource['downloadAttachment'];
  autosaveDelayMs: number | false;
  isSaving: boolean;
  isSending: boolean;
  isDiscarding: boolean;
  ownershipToken: object;
  uploadAttachment?: MailyMailboxDataSource['uploadAttachment'];
  discardUploadedAttachment?: MailyMailboxDataSource['discardUploadedAttachment'];
  onError?: MailyMailboxViewProps['onError'];
  onDirtyChange: (dirty: boolean) => void;
  onSave: (values: MailyMailboxComposeValues) => Promise<boolean>;
  onSend: (
    values: MailyMailboxComposeValues,
    onPrepared?: () => void,
    onDispatched?: () => void
  ) => Promise<void>;
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
    capabilities,
    attachmentsReadOnly = false,
    savedAttachments,
    downloadAttachment,
    autosaveDelayMs,
    isSaving,
    isSending,
    isDiscarding,
    ownershipToken,
    uploadAttachment,
    discardUploadedAttachment,
    onError,
    onDirtyChange,
    onSave,
    onSend,
    onDiscard,
  } = props;
  const subjectInputId = React.useId();
  const bodyInputId = React.useId();
  const bodyLabelId = React.useId();
  const [values, setValues] =
    React.useState<MailyMailboxComposeValues>(initialValues);
  const [acknowledged, setAcknowledged] = React.useState(() =>
    JSON.stringify(initialValues)
  );
  const [hasAcknowledgedWrite, setHasAcknowledgedWrite] =
    React.useState(isExistingDraft);
  const [saveError, setSaveError] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const uploadInput = React.useRef<HTMLInputElement>(null);
  const uploadLock = React.useRef(false);
  const alive = React.useRef(false);
  // True while this upload owner (mailbox lifetime and upload handler) is live.
  const uploadOwnerRef = useKeyedValue(
    () => ({ current: true }),
    [ownershipToken, uploadAttachment]
  );
  const ownedUploads = React.useRef(
    new Map<string, MailyMailboxUploadedAttachment>()
  );
  const saveLock = React.useRef(false);
  const valuesRef = useLatestRef(values);
  // Releases an unacknowledged upload; host failures are reported, not thrown.
  // It reads the latest handlers, so a host's inline onError is not a new owner.
  const discardUploadRef = useLatestRef(discardUploadedAttachment);
  const uploadErrorRef = useLatestRef(onError);
  const releaseUpload = React.useCallback(
    (attachment: MailyMailboxUploadedAttachment) => {
      const discard = discardUploadRef.current;
      if (!discard) return;
      void callAdapter(() => discard(attachment)).catch((error) =>
        uploadErrorRef.current?.(error, 'attachmentDiscard')
      );
    },
    [discardUploadRef, uploadErrorRef]
  );
  React.useLayoutEffect(() => {
    const uploads = ownedUploads.current;
    alive.current = true;
    uploadOwnerRef.current = true;
    return () => {
      alive.current = false;
      uploadOwnerRef.current = false;
      for (const attachment of uploads.values()) releaseUpload(attachment);
      uploads.clear();
    };
  }, [uploadOwnerRef, releaseUpload]);
  const serialized = JSON.stringify(values);
  const dirty = serialized !== acknowledged;
  // A composition handed to sendMessage may have been delivered even if the
  // send failed, so it never becomes a draft: a draft's send carries no key and
  // could deliver it again. Retries go through sendMessage, where the host
  // deduplicates by idempotencyKey.
  const [handedToSendMessage, setHandedToSendMessage] = React.useState(false);
  const formCapabilities = handedToSendMessage
    ? { ...capabilities, create: false }
    : capabilities;
  const operations = getMailboxComposeOperations(formCapabilities, {
    persisted: isExistingDraft,
    dirty: dirty || uploading,
  });
  const autosave = operations.autosave && autosaveDelayMs !== false;
  // Timers, uploads and editor callbacks check the committed operations when
  // they run rather than the ones captured when they were scheduled.
  const operationsRef = useLatestRef(operations);
  React.useLayoutEffect(() => {
    onDirtyChange(dirty || uploading);
  }, [dirty, uploading, onDirtyChange]);
  React.useEffect(() => {
    if (!dirty && !uploading) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty, uploading]);
  const save = async (snapshot: MailyMailboxComposeValues) => {
    if (saveLock.current || uploadLock.current || !operationsRef.current.save)
      return;
    const ownerRef = uploadOwnerRef;
    saveLock.current = true;
    const pendingAttachments = (snapshot.attachments ?? []).filter(
      (attachment) => ownedUploads.current.delete(attachment.id)
    );
    try {
      const accepted = await onSave(snapshot);
      if (!accepted) {
        for (const attachment of pendingAttachments) {
          if (ownerRef.current)
            ownedUploads.current.set(attachment.id, attachment);
          else releaseUpload(attachment);
        }
      }
      if (!ownerRef.current) return false;
      if (accepted) {
        for (const attachment of snapshot.attachments ?? [])
          ownedUploads.current.delete(attachment.id);
        setHasAcknowledgedWrite(true);
        setAcknowledged(JSON.stringify(snapshot));
      }
      setSaveError(!accepted);
      return accepted;
    } finally {
      saveLock.current = false;
    }
  };
  // The debounce restarts on edits, not on unrelated renders.
  const saveRef = useLatestRef(save);
  React.useEffect(() => {
    if (
      !dirty ||
      !autosave ||
      isSaving ||
      isSending ||
      isDiscarding ||
      uploading ||
      saveError
    )
      return;
    const timer = window.setTimeout(() => {
      if (operationsRef.current.autosave)
        void saveRef.current(valuesRef.current);
    }, autosaveDelayMs);
    return () => window.clearTimeout(timer);
  }, [
    serialized,
    acknowledged,
    autosave,
    autosaveDelayMs,
    isSaving,
    isSending,
    isDiscarding,
    uploading,
    saveError,
    dirty,
    saveRef,
    valuesRef,
    operationsRef,
  ]);
  const uploadFiles = async (files: File[]) => {
    if (
      !uploadAttachment ||
      uploadLock.current ||
      !operationsRef.current.attach
    )
      return;
    uploadLock.current = true;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of files) {
        // Files that this composition can no longer save or send are not uploaded.
        if (!uploadOwnerRef.current || !operationsRef.current.attach) break;
        try {
          const attachment = await uploadAttachment(file);
          if (!uploadOwnerRef.current) {
            releaseUpload(attachment);
            continue;
          }
          ownedUploads.current.set(attachment.id, attachment);
          setValues((previous) => ({
            ...previous,
            attachments: [...(previous.attachments ?? []), attachment],
          }));
        } catch (error) {
          if (alive.current) {
            setUploadError(file.name);
            onError?.(error, 'attachmentUpload');
          }
        }
      }
    } finally {
      uploadLock.current = false;
      if (alive.current) setUploading(false);
    }
  };
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

  // Compose is mounted only with hydrated content and keyed by draft identity.
  // Later reads must not replace edits owned by this mounted compose session.

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
      // A locked composition keeps its saved values; editor normalization of
      // read-only content must not turn it into unsaved local work.
      if (!operationsRef.current.editable) return;
      const text = editor.getText({ blockSeparator: '\n' });
      const html = editor.getHTML();
      setValues((prev) => ({ ...prev, text, html }));
    },
    [operationsRef]
  );
  // Only an editor the user opened (compose start or a mode switch) takes focus
  // and adopts its normalized content. A locked composition shows read-only
  // text instead, so the editor that appears when it unlocks does neither.
  const editorCreatedRevision = React.useRef<number | null>(null);
  const [lockedEditorRevision, setLockedEditorRevision] = React.useState<
    number | null
  >(null);
  if (!operations.editable && lockedEditorRevision !== editorRevision)
    setLockedEditorRevision(editorRevision);
  const editorOpenedByUser = lockedEditorRevision !== editorRevision;

  const submit = async () => {
    if (uploadLock.current || !operationsRef.current.send) return;
    const snapshot = valuesRef.current;
    const pendingAttachments = (snapshot.attachments ?? []).filter(
      (attachment) => ownedUploads.current.delete(attachment.id)
    );
    let prepared = false;
    let dispatched = false;
    try {
      await onSend(
        snapshot,
        () => {
          prepared = true;
          if (uploadOwnerRef.current) {
            setHasAcknowledgedWrite(true);
            setAcknowledged(JSON.stringify(snapshot));
          }
        },
        () => {
          dispatched = true;
          if (uploadOwnerRef.current) setHandedToSendMessage(true);
        }
      );
    } finally {
      // Uploads the host has received are its own; Maily never discards them.
      if (!prepared && !dispatched)
        for (const attachment of pendingAttachments) {
          if (uploadOwnerRef.current)
            ownedUploads.current.set(attachment.id, attachment);
          else releaseUpload(attachment);
        }
    }
  };

  const switchBodyMode = (nextMode: MailyMailboxComposeBodyMode) => {
    if (nextMode === bodyMode) return;
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
      className="flex min-h-0 min-w-0 flex-col gap-4 p-3 [contain:inline-size] @lg/mailbox:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-2 @lg/mailbox:flex-row @lg/mailbox:items-center @lg/mailbox:justify-between">
        <h2 className="text-lg font-semibold">
          {isExistingDraft
            ? t(operations.editable ? 'compose.editDraft' : 'compose.viewDraft')
            : t('compose.new')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {operations.discard && (
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              variant="ghost"
              onClick={() => onDiscard()}
              disabled={isSaving || isSending || isDiscarding}
            >
              <Trash2 className="size-4" />
              {t('compose.discard')}
            </Button>
          )}
          {operations.save && (
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              variant="outline"
              onClick={() => {
                setSaveError(false);
                void save(values);
              }}
              disabled={isSaving || isSending || isDiscarding}
            >
              {isSaving && <LoaderCircleIcon className="size-4 animate-spin" />}
              {t('compose.saveDraft')}
            </Button>
          )}
          {operations.send && (
            <Button
              type="submit"
              size="sm"
              className="min-h-11"
              disabled={isSaving || isSending || isDiscarding || uploading}
            >
              {isSending ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {t('compose.send')}
            </Button>
          )}
        </div>
      </div>

      <div role="status" className="text-muted-foreground text-sm">
        {saveError
          ? t('compose.saveError')
          : isSaving
            ? t('compose.saving')
            : attachmentsReadOnly && !operations.editable
              ? t('compose.attachmentsReadOnly')
              : (dirty || uploading) &&
                  !operations.save &&
                  // A new composition sent directly has no saved state to lose.
                  !(!isExistingDraft && capabilities.sendMessage)
                ? t('compose.saveUnavailable')
                : !dirty && hasAcknowledgedWrite && operations.save
                  ? t(autosave ? 'compose.autosaved' : 'compose.saved')
                  : null}
      </div>
      {uploadAttachment && operations.attach && (
        <div className="flex flex-col gap-2">
          {/* shadcn-audit-ignore-next-line invisible native file picker */}
          <input
            ref={uploadInput}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = '';
              void uploadFiles(files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={uploading || isSaving || isSending || isDiscarding}
            onClick={() => uploadInput.current?.click()}
          >
            {uploading ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <Paperclip className="size-4" />
            )}
            {t('compose.attach')}
          </Button>
          {uploadError && (
            <p role="alert">
              {t('compose.attachmentUploadError', { filename: uploadError })}
            </p>
          )}
        </div>
      )}
      {/* A read-only draft lists its saved attachments in ReadOnlyComposition. */}
      {(operations.editable || !savedAttachments) &&
        (values.attachments ?? []).map((attachment, index) => (
          <Attachment key={`${attachment.id}:${index}`}>
            <AttachmentContent>
              <AttachmentTitle>{attachment.filename}</AttachmentTitle>
            </AttachmentContent>
            {operations.editable && (
              <AttachmentActions>
                <MailboxTooltip
                  label={t('compose.removeAttachment', {
                    filename: attachment.filename,
                  })}
                >
                  <AttachmentAction
                    type="button"
                    disabled={
                      isSaving || isSending || isDiscarding || uploading
                    }
                    aria-label={t('compose.removeAttachment', {
                      filename: attachment.filename,
                    })}
                    onClick={() => {
                      if (ownedUploads.current.delete(attachment.id))
                        releaseUpload(attachment);
                      setValues((previous) => ({
                        ...previous,
                        attachments: previous.attachments?.filter(
                          (_, position) => position !== index
                        ),
                      }));
                    }}
                  >
                    <X className="size-4" />
                  </AttachmentAction>
                </MailboxTooltip>
              </AttachmentActions>
            )}
          </Attachment>
        ))}
      {!operations.editable ? (
        <ReadOnlyComposition
          values={values}
          labels={labels}
          savedAttachments={savedAttachments}
          downloadAttachment={downloadAttachment}
          onError={onError}
        />
      ) : (
        // Autosave keeps fields enabled: disabling them would drop focus and
        // keystrokes, and edits made during a save stay dirty for the next one.
        <FieldSet
          disabled={isSending || isDiscarding}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
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
          <Field>
            <FieldLabel htmlFor={subjectInputId}>
              {t('message.subject')}
            </FieldLabel>
            <Input
              id={subjectInputId}
              name="subject"
              value={values.subject}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                set('subject', event.target.value)
              }
            />
          </Field>
          <Field
            className="min-h-0 flex-1 gap-1.5"
            aria-labelledby={bodyLabelId}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label
                id={bodyLabelId}
                htmlFor={bodyMode === 'plainText' ? bodyInputId : undefined}
              >
                {t('message.body')}
              </Label>
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
                    className="min-h-11"
                  >
                    {t('compose.mode.plainText')}
                  </ToggleGroupCompatItem>
                  <ToggleGroupCompatItem
                    type="button"
                    value="mailyEditor"
                    pressed={bodyMode === 'mailyEditor'}
                    onClick={() => switchBodyMode('mailyEditor')}
                    size="sm"
                    className="min-h-11"
                  >
                    {t('compose.mode.mailyEditor')}
                  </ToggleGroupCompatItem>
                </ToggleGroupCompat>
              )}
            </div>
            {bodyMode === 'mailyEditor' ? (
              <Editor
                {...editorProps}
                editable={!isSending && !isDiscarding}
                key={editorRevision}
                contentHtml={composeHtmlContent(values)}
                onCreate={(editor) => {
                  // Adopt once per editor the user opened (StrictMode creates twice).
                  if (
                    !editorOpenedByUser ||
                    editorCreatedRevision.current === editorRevision
                  )
                    return;
                  editorCreatedRevision.current = editorRevision;
                  updateFromEditor(editor);
                }}
                onUpdate={updateFromEditor}
                config={{
                  ...editorConfig,
                  hasMenuBar: editorConfig?.hasMenuBar ?? true,
                  wrapClassName: cn('min-h-0', editorConfig?.wrapClassName),
                  bodyClassName: editorBodyClassName,
                  contentClassName: editorContentClassName,
                  autofocus: editorOpenedByUser
                    ? (editorConfig?.autofocus ?? 'end')
                    : false,
                }}
              />
            ) : (
              <Textarea
                id={bodyInputId}
                value={values.text}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBodyText(event.target.value)
                }
                className="h-full min-h-40 resize-none"
              />
            )}
          </Field>
        </FieldSet>
      )}
    </form>
  );
}

/** A saved draft that this host cannot edit, shown as readable text. */
type SavedDraftAttachments = {
  messageId: string;
  attachments: MailyMailboxAttachment[];
};

function ReadOnlyComposition(props: {
  values: MailyMailboxComposeValues;
  labels: MailyMailboxLabels;
  /** The saved draft's attachments, including any without a host ID. */
  savedAttachments?: SavedDraftAttachments;
  downloadAttachment?: MailyMailboxDataSource['downloadAttachment'];
  onError?: MailyMailboxViewProps['onError'];
}) {
  const { values, labels, savedAttachments } = props;
  const attachments = savedAttachments?.attachments ?? [];
  const recipients = (
    [
      ['message.to', values.to],
      ['message.cc', values.cc],
      ['message.bcc', values.bcc],
    ] as const
  ).filter(([, value]) => value.trim());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        {recipients.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted-foreground font-medium">
              {labels[label]}
            </dt>
            <dd className="min-w-0 [overflow-wrap:anywhere] break-words">
              {value}
            </dd>
          </React.Fragment>
        ))}
        <dt className="text-muted-foreground font-medium">
          {labels['message.subject']}
        </dt>
        <dd className="min-w-0 font-medium [overflow-wrap:anywhere] break-words">
          {values.subject.trim() || labels['message.noSubject']}
        </dd>
      </dl>
      <section
        aria-label={labels['message.body']}
        className="border-border min-w-0 rounded-md border"
      >
        {values.html?.trim() ? (
          <HtmlBody html={values.html} title={labels['message.htmlBody']} />
        ) : values.text.trim() ? (
          <pre className="p-3 font-sans text-sm leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
            {values.text}
          </pre>
        ) : (
          <p className="text-muted-foreground p-3 text-sm">
            {labels['message.noBody']}
          </p>
        )}
      </section>
      {savedAttachments && attachments.length > 0 && (
        <ul
          aria-label={interpolate(labels['message.attachments'], {
            count: attachments.length,
          })}
          className="space-y-2"
        >
          {attachments.map((attachment, attachmentIndex) => (
            <li
              key={`${savedAttachments.messageId}:${attachment.id ?? attachmentIndex}`}
            >
              <MessageAttachment
                messageId={savedAttachments.messageId}
                attachment={attachment}
                attachmentIndex={attachmentIndex}
                labels={labels}
                downloadAttachment={props.downloadAttachment}
                onError={props.onError}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function recipientTokenForCaret(value: string, caret: number) {
  const position = Math.max(0, Math.min(caret, value.length));
  const { start, end } = addressListTokens(value).find(
    (token) => token.start <= position && position <= token.end
  ) ?? { start: position, end: position };

  return { start, end, query: value.slice(start, end).trim() };
}

function formatContactSuggestion(
  suggestion: MailyMailboxContactSuggestion
): string {
  return formatMailboxAddress(suggestion.address, suggestion.displayName);
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
  const separator = after.match(/^(?:[,;] |\n)/)?.[0].length ?? 0;

  return {
    value: nextValue,
    caret: before.length + leadingSpace.length + replacement.length + separator,
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
  const searching = open && !!query.trim();
  // Each query change starts loading (or idles when closed or empty); closing
  // clears the previous results, while typing keeps them until new ones arrive.
  const [loading, setLoading] = useResettableState(
    () => searching,
    [loadSuggestions, open, query]
  );
  const [suggestions, setSuggestions] = useResettableState<
    MailyMailboxContactSuggestion[]
  >(() => [], [searching]);

  const updateQuery = React.useCallback((nextValue: string, caret: number) => {
    caretRef.current = caret;
    const nextQuery = recipientTokenForCaret(nextValue, caret).query;
    setQuery(nextQuery);
    setOpen(nextQuery.length > 0);
  }, []);

  React.useEffect(() => {
    const requestId = ++requestRef.current;
    const q = query.trim();
    if (!open || !q) return;
    const timer = window.setTimeout(() => {
      callAdapter(() => loadSuggestions(q))
        .then((next) => {
          if (requestRef.current === requestId) {
            setSuggestions(next);
          }
        })
        .catch(() => {
          if (requestRef.current === requestId) setSuggestions([]);
        })
        .finally(() => {
          if (requestRef.current === requestId) {
            setLoading(false);
          }
        });
    }, 150);

    return () => {
      window.clearTimeout(timer);
      requestRef.current += 1;
    };
  }, [loadSuggestions, open, query, setLoading, setSuggestions]);

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
        className="max-w-[calc(100vw-2rem)] min-w-[min(18rem,calc(100vw-2rem))] p-0"
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-56">
            {loading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 px-3 py-4 text-sm">
                <LoaderCircleIcon className="size-4 animate-spin" />
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
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback>
                          {senderInitial(
                            suggestion.displayName || suggestion.address
                          )}
                        </AvatarFallback>
                      </Avatar>
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
    <Field
      orientation="horizontal"
      className="border-border grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 border-b py-1"
    >
      <FieldLabel
        htmlFor={props.id}
        className="text-muted-foreground shrink-0 font-medium"
      >
        {props.label}
      </FieldLabel>
      <InputGroup className="bg-input/40 dark:bg-input/30 h-8 border-0 shadow-none">
        {props.children}
        {props.actions && (
          <InputGroupAddon align="inline-end" className="pr-1">
            {props.actions}
          </InputGroupAddon>
        )}
      </InputGroup>
    </Field>
  );
}

function EmptyState(props: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <Empty className={cn('min-h-40 border-0 px-5 py-8', props.className)}>
      <EmptyHeader>
        <EmptyTitle>{props.title}</EmptyTitle>
        {props.description && (
          <EmptyDescription>{props.description}</EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );
}
