import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumb({ children, className }: { children: React.ReactNode; className?: string }) {
  return <nav aria-label="breadcrumb" className={cn('flex items-center', className)}>{children}</nav>;
}

export function BreadcrumbList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ol className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      {children}
    </ol>
  );
}

export function BreadcrumbItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={cn('flex items-center gap-1.5', className)}>{children}</li>;
}

export function BreadcrumbLink({ href, children, className }: { href?: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href ?? '#'} className={cn('hover:text-foreground transition-colors', className)}>
      {children}
    </a>
  );
}

export function BreadcrumbPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span aria-current="page" className={cn('font-medium text-foreground', className)}>
      {children}
    </span>
  );
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <li role="presentation" aria-hidden className={cn('text-muted-foreground/50', className)}>
      <ChevronRight className="w-3.5 h-3.5" />
    </li>
  );
}
