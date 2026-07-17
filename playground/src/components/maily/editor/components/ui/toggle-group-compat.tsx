import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  ComponentType,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from 'react';
import {
  ToggleGroup as ShadcnToggleGroup,
  ToggleGroupItem as ShadcnToggleGroupItem,
} from '@/components/ui/toggle-group';

type SelectionMode = 'single' | 'multiple';
type ToggleValue = string | string[];

type ToggleGroupCompatProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  selectionMode: SelectionMode;
  value: ToggleValue;
  variant?: 'default' | 'outline' | null;
  size?: 'default' | 'sm' | 'lg' | null;
  spacing?: number;
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
};

type ToggleGroupCompatItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  pressed: boolean;
  variant?: 'default' | 'outline' | null;
  size?: 'default' | 'sm' | 'lg' | null;
};

// Radix uses `type` plus string/string[] values while Base UI uses `multiple`
// plus array values. shadcn exposes those backend-specific signatures. This
// adapter keeps the host's real ToggleGroup and ToggleGroupItem at runtime,
// while controlling each item through the common button state both backends
// expose. The Radix primitive owns `pressed`; Base UI consumes the supplied one.
const ToggleGroupRoot = ShadcnToggleGroup as ComponentType<
  Omit<ToggleGroupCompatProps, 'selectionMode'> & { type: SelectionMode }
>;
const ToggleGroupItem = ShadcnToggleGroupItem as ComponentType<
  ToggleGroupCompatItemProps & RefAttributes<HTMLButtonElement>
>;

export function ToggleGroupCompat({
  selectionMode,
  ...props
}: ToggleGroupCompatProps) {
  return <ToggleGroupRoot type={selectionMode} {...props} />;
}

export const ToggleGroupCompatItem = forwardRef<
  HTMLButtonElement,
  ToggleGroupCompatItemProps
>((props, ref) => <ToggleGroupItem ref={ref} {...props} />);
ToggleGroupCompatItem.displayName = 'ToggleGroupCompatItem';
