'use client';

import { IconPlaceholder } from "@/components/icon-placeholder"
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Editor } from '@tiptap/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useMailyContext } from '../../provider';
import {
  createFontSelection,
  fontsourceFileUrl,
  fontStack,
  getFontsourceCatalog,
  loadEditorFont,
  resetFontsourceCatalog,
  resolveFontSelection,
  type FontsourceCategory,
  type FontsourceFont,
  type MailyFontSelection,
} from '../../fonts/fontsource';

const DEFAULT_VALUE = '__maily_default_font__';
const ROW_HEIGHT = 58;
const LIST_VERTICAL_PADDING = 12;

type CatalogState =
  | { status: 'idle' | 'loading'; fonts: FontsourceFont[] }
  | { status: 'ready'; fonts: FontsourceFont[] }
  | { status: 'error'; fonts: FontsourceFont[] };

type FontFamilyPickerProps = {
  editor: Editor;
  currentFont: MailyFontSelection | null;
};

function usePreviewFont(font: FontsourceFont) {
  const previewFamily = `maily-preview-${font.id}`;

  useEffect(() => {
    if (
      typeof document === 'undefined' ||
      typeof FontFace === 'undefined' ||
      !document.fonts
    ) {
      return;
    }

    const selection = createFontSelection(font);
    const url = fontsourceFileUrl(selection);
    if (!url) {
      return;
    }

    const face = new FontFace(previewFamily, `url(${JSON.stringify(url)})`, {
      display: 'swap',
      style: 'normal',
      weight: String(selection.fontRegularWeight),
    });

    document.fonts.add(face);
    void face.load().catch(() => document.fonts.delete(face));

    return () => {
      document.fonts.delete(face);
    };
  }, [font.id, font.defSubset, font.weights, previewFamily]);

  return previewFamily;
}

function FontRow({
  font,
  selected,
  loading,
  categoryLabel,
  onSelect,
}: {
  font: FontsourceFont;
  selected: boolean;
  loading: boolean;
  categoryLabel: string;
  onSelect: () => void;
}) {
  const previewFamily = usePreviewFont(font);
  const selection = useMemo(() => createFontSelection(font), [font]);

  return (
    <CommandItem
      value={font.id}
      onSelect={onSelect}
      className="h-[54px] w-full gap-3 rounded-md px-2.5"
      aria-label={font.family}
    >
      <span
        aria-hidden="true"
        className="text-muted-foreground flex size-8 shrink-0 items-center justify-center text-lg"
        style={{ fontFamily: fontStack(selection) }}
      >
        <span
          style={{
            fontFamily: `'${previewFamily}', ${selection.fontFallback}`,
          }}
        >
          Aa
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[15px] leading-5"
          style={{
            fontFamily: `'${previewFamily}', ${selection.fontFallback}`,
          }}
        >
          {font.family}
        </span>
        <span className="text-muted-foreground block truncate text-[10px] leading-4 tracking-wide uppercase">
          {categoryLabel}
        </span>
      </span>
      {loading ? (
        <IconPlaceholder
  lucide="LoaderCircleIcon"
  tabler="IconLoader2"
  hugeicons="Loading03Icon"
  phosphor="CircleNotch"
  remixicon="RiLoader2Line"
  className="text-muted-foreground size-3.5 animate-spin"
/>
      ) : selected ? (
        <IconPlaceholder
  lucide="CheckIcon"
  tabler="IconCheck"
  hugeicons="Tick02Icon"
  phosphor="Check"
  remixicon="RiCheckLine"
  className="size-3.5"
/>
      ) : null}
    </CommandItem>
  );
}

export function FontFamilyPicker({
  editor,
  currentFont,
}: FontFamilyPickerProps) {
  const { t } = useMailyContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeValue, setActiveValue] = useState(
    currentFont?.fontId ?? DEFAULT_VALUE
  );
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogState>({
    status: 'idle',
    fonts: [],
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadCatalog = useCallback(() => {
    setCatalog((current) => ({ ...current, status: 'loading' }));
    void getFontsourceCatalog()
      .then((fonts) => setCatalog({ status: 'ready', fonts }))
      .catch(() => setCatalog({ status: 'error', fonts: [] }));
  }, []);

  useEffect(() => {
    if (open && catalog.status === 'idle') {
      loadCatalog();
    }
  }, [catalog.status, loadCatalog, open]);

  useEffect(() => {
    setActiveValue(currentFont?.fontId ?? DEFAULT_VALUE);
  }, [currentFont?.fontId]);

  const filteredFonts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return catalog.fonts;
    }

    return catalog.fonts.filter((font) =>
      `${font.family} ${font.category}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    );
  }, [catalog.fonts, query]);

  const virtualizer = useVirtualizer({
    count: filteredFonts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  useEffect(() => {
    virtualizer.scrollToOffset(0);
  }, [query, virtualizer]);

  const categoryLabel = useCallback(
    (category: FontsourceCategory) => {
      const keys = {
        'sans-serif': 'fontPicker.category.sansSerif',
        serif: 'fontPicker.category.serif',
        display: 'fontPicker.category.display',
        handwriting: 'fontPicker.category.handwriting',
        monospace: 'fontPicker.category.monospace',
      } as const;

      return t(keys[category]);
    },
    [t]
  );

  const selectDefault = useCallback(() => {
    editor.chain().focus().unsetMailyFont().run();
    setOpen(false);
  }, [editor]);

  const selectFont = useCallback(
    async (font: FontsourceFont) => {
      setLoadingFontId(font.id);
      const selection = await resolveFontSelection(font);
      loadEditorFont(selection);
      editor.chain().focus().setMailyFont(selection).run();
      setLoadingFontId(null);
      setOpen(false);
    },
    [editor]
  );

  const retry = useCallback(() => {
    resetFontsourceCatalog();
    loadCatalog();
  }, [loadCatalog]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        !['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)
      ) {
        return;
      }

      const currentIndex = filteredFonts.findIndex(
        (font) => font.id === activeValue
      );

      if (event.key === 'Enter') {
        if (activeValue === DEFAULT_VALUE) {
          event.preventDefault();
          selectDefault();
          return;
        }

        const font = filteredFonts[currentIndex];
        if (font) {
          event.preventDefault();
          void selectFont(font);
        }
        return;
      }

      if (filteredFonts.length === 0) {
        return;
      }

      event.preventDefault();
      let nextIndex = currentIndex;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = filteredFonts.length - 1;
      if (event.key === 'ArrowDown')
        nextIndex = Math.min(currentIndex + 1, filteredFonts.length - 1);
      if (event.key === 'ArrowUp') {
        if (currentIndex <= 0) {
          setActiveValue(DEFAULT_VALUE);
          scrollRef.current?.scrollTo({ top: 0 });
          return;
        }
        nextIndex = currentIndex - 1;
      }

      const nextFont = filteredFonts[Math.max(0, nextIndex)];
      if (nextFont) {
        setActiveValue(nextFont.id);
        virtualizer.scrollToIndex(Math.max(0, nextIndex), { align: 'auto' });
      }
    },
    [activeValue, filteredFonts, selectDefault, selectFont, virtualizer]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 max-w-36 gap-1.5 px-2"
          aria-label={t('toolbar.fontFamily')}
        >
          <IconPlaceholder
  lucide="TypeIcon"
  tabler="IconTypography"
  hugeicons="TextFontIcon"
  phosphor="TextT"
  remixicon="RiParagraph"
  className="size-3.5 shrink-0"
/>
          <span className="max-w-24 truncate text-xs font-medium">
            {currentFont?.fontFamily ?? t('fontPicker.default')}
          </span>
          <IconPlaceholder
  lucide="ChevronDownIcon"
  tabler="IconChevronDown"
  hugeicons="ChevronDownIcon"
  phosphor="CaretDown"
  remixicon="RiArrowDownSLine"
  className="text-muted-foreground size-3 shrink-0"
/>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0"
        onKeyDownCapture={handleKeyDown}
      >
        <Command
          shouldFilter={false}
          value={activeValue}
          onValueChange={setActiveValue}
          className="rounded-lg p-0"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('fontPicker.search')}
            aria-label={t('fontPicker.search')}
          />

          <div className="border-border border-b p-1.5">
            <CommandItem
              value={DEFAULT_VALUE}
              onSelect={selectDefault}
              className="h-11 gap-3 px-2.5"
            >
              <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                <IconPlaceholder
  lucide="TypeIcon"
  tabler="IconTypography"
  hugeicons="TextFontIcon"
  phosphor="TextT"
  remixicon="RiParagraph"
  className="size-3.5"
/>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {t('fontPicker.default')}
                </span>
                <span className="text-muted-foreground block truncate text-[10px] leading-4">
                  {t('fontPicker.defaultDescription')}
                </span>
              </span>
              {!currentFont ? <IconPlaceholder
  lucide="CheckIcon"
  tabler="IconCheck"
  hugeicons="Tick02Icon"
  phosphor="Check"
  remixicon="RiCheckLine"
  className="size-3.5"
/> : null}
            </CommandItem>
          </div>

          {catalog.status === 'loading' || catalog.status === 'idle' ? (
            <div className="space-y-1 p-2" aria-label={t('fontPicker.loading')}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-muted/60 h-[54px] animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : catalog.status === 'error' ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <div>
                <p className="text-sm font-medium">
                  {t('fontPicker.loadError')}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t('fontPicker.loadErrorDescription')}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={retry}>
                <IconPlaceholder
  lucide="RotateCwIcon"
  tabler="IconRepeat"
  hugeicons="RepeatIcon"
  phosphor="Repeat"
  remixicon="RiRepeatLine"
  className="size-3.5"
/>
                {t('fontPicker.retry')}
              </Button>
            </div>
          ) : (
            <>
              {filteredFonts.length === 0 ? (
                <CommandEmpty className="py-12">
                  {t('fontPicker.noResults')}
                </CommandEmpty>
              ) : (
                <div
                  ref={scrollRef}
                  className="no-scrollbar max-h-72 overflow-y-auto overscroll-contain p-1.5"
                  style={{
                    height: Math.min(
                      288,
                      virtualizer.getTotalSize() + LIST_VERTICAL_PADDING
                    ),
                  }}
                >
                  <CommandList className="max-h-none overflow-visible p-0">
                    <div
                      className="relative w-full"
                      style={{ height: virtualizer.getTotalSize() }}
                    >
                      {virtualizer.getVirtualItems().map((virtualItem) => {
                        const font = filteredFonts[virtualItem.index];
                        return (
                          <div
                            key={font.id}
                            className="absolute top-0 left-0 w-full py-0.5"
                            style={{
                              height: virtualItem.size,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <FontRow
                              font={font}
                              selected={currentFont?.fontId === font.id}
                              loading={loadingFontId === font.id}
                              categoryLabel={categoryLabel(font.category)}
                              onSelect={() => void selectFont(font)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CommandList>
                </div>
              )}
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
