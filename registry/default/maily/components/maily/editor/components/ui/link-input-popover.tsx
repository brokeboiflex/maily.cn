import { IconPlaceholder } from "@/components/icon-placeholder"
import { useOwnedTimeout } from '../../utils/use-owned-timeout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { DEFAULT_PLACEHOLDER_URL, useMailyContext } from '../../maily-context';
import { InputAutocomplete } from './input-autocomplete';
import { processVariables } from '../../utils/variable';
import { useMemo } from 'react';
import { Editor } from '@tiptap/core';
import type { Selection } from '@tiptap/pm/state';
import { useLatestRef } from '../../utils/state-hooks';
import { useVariableOptions } from '../../utils/node-options';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '../../nodes/variable/variable';
import { Toggle } from '@/components/ui/toggle';
import type { ImageUploadOptions } from '../../extensions/image-upload/image-upload';
import { Field, FieldLabel } from '@/components/ui/field';

type LinkInputPopoverProps = {
  defaultValue?: string;
  isVariable?: boolean;
  onValueChange?: (value: string, isVariable?: boolean) => void;

  icon?: ReactNode;
  tooltip?: string;

  editor: Editor;
  imageUpload?: ImageUploadOptions;
};

export function LinkInputPopover(props: LinkInputPopoverProps) {
  const {
    defaultValue = '',
    onValueChange,
    tooltip,
    icon,
    editor,

    isVariable,
    imageUpload,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!isVariable);
  // Typing edits a local draft. The editor receives one change when the
  // popover commits it (Enter, a suggestion, or closing), so typing never
  // moves focus into the document or adds a history step per keystroke.
  const [draft, setDraft] = useState(defaultValue);
  const [openSelection, setOpenSelection] = useState<Selection | null>(null);
  const skipPendingCommit = useRef(false);
  // If the host surface unmounts while a typed URL is pending (a compact-layout
  // switch, for example), commit it only onto the selection it was typed for.
  const pendingRef = useLatestRef({
    isOpen,
    draft,
    defaultValue,
    openSelection,
    onValueChange,
  });
  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (
        !skipPendingCommit.current &&
        pending.isOpen &&
        pending.draft !== pending.defaultValue &&
        !editor.isDestroyed &&
        editor.isEditable &&
        pending.openSelection?.eq(editor.state.selection)
      )
        pending.onValueChange?.(pending.draft);
    },
    [editor, pendingRef]
  );

  const { schedule: scheduleTimeout, cancel: cancelTimeout } =
    useOwnedTimeout();
  const linkInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const uploadChannel = useId();
  const uploadLock = useRef(false);
  const uploadGeneration = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const {
    placeholderUrl = DEFAULT_PLACEHOLDER_URL,
    t,
    editorActions,
  } = useMailyContext();
  useLayoutEffect(
    () => () => {
      uploadGeneration.current++;
      editorActions?.cancel(uploadChannel);
    },
    [editorActions, uploadChannel]
  );

  const uploadImage = async (file: File) => {
    if (
      !imageUpload?.onImageUpload ||
      !editorActions ||
      uploadLock.current ||
      !editor.isEditable
    )
      return;
    if (!imageUpload.allowedMimeTypes?.includes(file.type)) {
      setUploadError(true);
      return;
    }
    const action = editorActions.capture(uploadChannel);
    const generation = ++uploadGeneration.current;
    uploadLock.current = true;
    // Choosing a file replaces any uncommitted URL draft.
    setDraft(defaultValue);
    skipPendingCommit.current = true;
    setUploading(true);
    setUploadError(false);
    let uploadedSrc: string | undefined;
    let applied = false;
    try {
      uploadedSrc = await imageUpload.onImageUpload(file);
      if (!uploadedSrc) throw new Error('Empty image URL');
      if (generation === uploadGeneration.current && editor.isEditable) {
        applied = action.run(() => {
          // A URL draft must not overwrite the uploaded image during teardown.
          setDraft(uploadedSrc!);
          setIsEditing(true);
          setIsOpen(false);
          onValueChange?.(uploadedSrc!, false);
        });
      }
    } catch {
      if (generation === uploadGeneration.current && action.isCurrent())
        setUploadError(true);
    } finally {
      if (generation === uploadGeneration.current) {
        if (!applied) skipPendingCommit.current = false;
        uploadLock.current = false;
        setUploading(false);
      }
      if (uploadedSrc && !applied) {
        try {
          await imageUpload.onImageUploadDiscard?.(uploadedSrc);
        } catch {
          if (generation === uploadGeneration.current) setUploadError(true);
        }
      }
    }
  };
  const options = useVariableOptions(editor);

  const renderVariable = options?.renderVariable;
  const variables = options?.variables;
  const variableTriggerCharacter =
    options?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = draft.replaceAll(variableTriggerCharacter, '');

    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, variableTriggerCharacter, draft, editor]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          cancelTimeout();
          if (!skipPendingCommit.current && draft !== defaultValue)
            onValueChange?.(draft);
        }
        if (open) {
          skipPendingCommit.current = uploadLock.current;
          setDraft(defaultValue);
          setIsEditing(!isVariable);
          setUploadError(false);
          setOpenSelection(editor.state.selection);
          scheduleTimeout(() => {
            linkInputRef.current?.focus();
          }, 0);
        }
      }}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0">
              <PopoverTrigger asChild>
                <Toggle
                  pressed={!!defaultValue}
                  onPressedChange={() => undefined}
                  type="button"
                  className="size-7! min-w-7! px-0"
                  aria-label={tooltip}
                >
                  <span className="text-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3 [&_svg]:stroke-[2.5]">
                    {icon ?? <IconPlaceholder
  lucide="Link"
  tabler="IconLink"
  hugeicons="Link01Icon"
  phosphor="Link"
  remixicon="RiLink"
/>}
                  </span>
                </Toggle>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>
          <Toggle
            pressed={!!defaultValue}
            onPressedChange={() => undefined}
            type="button"
            className="size-7! min-w-7! px-0"
            aria-label={t('toolbar.link')}
          >
            <span className="text-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3 [&_svg]:stroke-[2.5]">
              {icon ?? <IconPlaceholder
  lucide="Link"
  tabler="IconLink"
  hugeicons="Link01Icon"
  phosphor="Link"
  remixicon="RiLink"
/>}
            </span>
          </Toggle>
        </PopoverTrigger>
      )}

      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 max-w-[calc(100vw-1rem)]"
        sideOffset={8}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const input = linkInputRef.current;
            if (!input) {
              return;
            }

            if (input.value !== defaultValue) onValueChange?.(input.value);
            setIsOpen(false);
          }}
        >
          <Field>
            <FieldLabel htmlFor={inputId}>
              {tooltip ?? t('toolbar.link')}
            </FieldLabel>
            {!isEditing && (
              <div className="flex min-h-8 min-w-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0"
                  id={inputId}
                  disabled={uploading}
                  onClick={() => {
                    setIsEditing(true);
                    scheduleTimeout(() => {
                      linkInputRef.current?.focus();
                    }, 0);
                  }}
                >
                  {renderVariable({
                    variable: {
                      name: defaultValue,
                      valid: true,
                    },
                    fallback: '',
                    from: 'bubble-variable',
                    editor,
                  })}
                </Button>
              </div>
            )}

            {isEditing && (
              <InputAutocomplete
                id={inputId}
                editor={editor}
                value={draft}
                onValueChange={setDraft}
                autoCompleteOptions={autoCompleteOptions}
                ref={linkInputRef}
                aria-label={tooltip ?? t('toolbar.link')}
                placeholder={placeholderUrl}
                className="h-8 w-full"
                startAdornment={<IconPlaceholder
  lucide="Link"
  tabler="IconLink"
  hugeicons="Link01Icon"
  phosphor="Link"
  remixicon="RiLink"
  className="size-3.5"
/>}
                disabled={uploading}
                triggerChar={variableTriggerCharacter}
                onSelectOption={(value) => {
                  const isVariable =
                    autoCompleteOptions.includes(value) ?? false;
                  if (isVariable) {
                    setIsEditing(false);
                  }

                  setDraft(value);
                  onValueChange?.(value, isVariable);
                  setIsOpen(false);
                }}
              />
            )}
          </Field>
        </form>
        {imageUpload?.onImageUpload && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading && <IconPlaceholder
  lucide="Loader2"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="size-3.5 animate-spin"
/>}
              {t(uploading ? 'imageUpload.uploading' : 'imageUpload.upload')}
            </Button>
            {/* shadcn-audit-ignore-next-line invisible native file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept={imageUpload.allowedMimeTypes?.join(',')}
              className="hidden"
              aria-label={t('imageUpload.upload')}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void uploadImage(file);
              }}
            />
            {uploadError && (
              <p role="alert" className="text-destructive text-xs">
                {t('imageUpload.error')}
              </p>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
