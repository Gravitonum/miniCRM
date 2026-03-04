/**
 * Badge — компонент значка для статусов и лейблов.
 *
 * @example
 * <Badge variant="slate">Поиск</Badge>
 * <Badge variant="emerald">Закрыта</Badge>
 */
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary/10 text-primary',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-transparent bg-destructive/10 text-destructive',
                outline: 'border border-border text-foreground',
                slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

/**
 * Значок для статусов, тегов и лейблов.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
