import { cn } from '@/editor/utils/classname';

type Props = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

export function Separator(props: Props) {
  const { orientation = 'vertical', className } = props;

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'bg-border shrink-0',
        orientation === 'vertical'
          ? 'mx-0.5 w-px self-stretch'
          : 'my-0.5 h-px w-full',
        className
      )}
    />
  );
}
