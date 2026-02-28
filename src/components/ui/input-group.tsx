import React from 'react';
import { cn } from '../../lib/cn';

export const InputGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex items-stretch rounded-md border border-input overflow-hidden', className)} {...props} />
);

export const InputGroupInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
InputGroupInput.displayName = 'InputGroupInput';

interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'inline-start' | 'inline-end';
}

export const InputGroupAddon: React.FC<InputGroupAddonProps> = ({ className, align, ...props }) => (
  <div
    className={cn(
      'flex items-center',
      align === 'inline-end' && 'border-l border-input',
      align === 'inline-start' && 'border-r border-input',
      className,
    )}
    {...props}
  />
);

export const InputGroupText: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('px-3 py-2 text-sm text-muted-foreground bg-muted select-none', className)} {...props} />
);
