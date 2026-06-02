import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30', className)} {...props} />;
}
