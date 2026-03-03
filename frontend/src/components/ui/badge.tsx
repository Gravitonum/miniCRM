/**
 * Badge — компонент значка для статусов и лейблов.
 *
 * @example
 * <Badge variant="slate">Поиск</Badge>
 * <Badge variant="emerald">Закрыта</Badge>
 */
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
                slate: 'bg-slate-100 text-slate-700',
                blue: 'bg-blue-100 text-blue-700',
                violet: 'bg-violet-100 text-violet-700',
                amber: 'bg-amber-100 text-amber-700',
                orange: 'bg-orange-100 text-orange-700',
                emerald: 'bg-emerald-100 text-emerald-700',
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
