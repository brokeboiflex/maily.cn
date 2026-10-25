'use client';

import { IconPlaceholder } from "@/components/icon-placeholder"
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { MailyMailboxViewProps } from './types';

function parseDate(value?: string) {
  const parts = value?.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!parts) return undefined;
  const [, year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

export function SearchDatePicker(props: {
  id: string;
  value?: string;
  placeholder: string;
  clearLabel: string;
  onChange: (value: string | undefined) => void;
  calendarProps?: MailyMailboxViewProps['searchCalendarProps'];
}) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDate(props.value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={props.id}
          type="button"
          variant="outline"
          className="h-9 w-full min-w-0 justify-start font-normal"
        >
          <IconPlaceholder
  lucide="CalendarIcon"
  tabler="IconCalendar"
  hugeicons="Calendar03Icon"
  phosphor="CalendarBlank"
  remixicon="RiCalendarLine"
  className="text-muted-foreground size-4 shrink-0"
/>
          <span className="truncate">
            {selected
              ? selected.toLocaleDateString(props.calendarProps?.locale?.code, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : props.value || props.placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
      >
        <Calendar
          {...props.calendarProps}
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            props.onChange(
              date
                ? `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
                : undefined
            );
            setOpen(false);
          }}
        />
        {props.value && (
          <div className="border-border border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                props.onChange(undefined);
                setOpen(false);
              }}
            >
              {props.clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
