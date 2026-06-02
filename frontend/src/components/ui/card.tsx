import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/utils';

type CardProps = ComponentPropsWithoutRef<any> & { as?: ElementType };

export function Card({ as: Comp = 'div', className, ...props }: CardProps) {
  return <Comp className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />;
}
