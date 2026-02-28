import React from 'react';
import { cn } from '../../lib/cn';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, disabled, className }) => {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          !disabled && onCheckedChange?.(!checked);
        }
      }}
      className={cn(
        'inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors',
        checked
          ? 'border-foreground bg-foreground text-primary-foreground'
          : 'border-border bg-background',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
};
