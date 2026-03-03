/**
 * Label — shadcn/ui-совместимый компонент на базе Radix UI Label.
 *
 * @example
 * <Label htmlFor="email">Email</Label>
 */
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils';

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(
            'text-sm font-semibold leading-normal text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            className
        )}
        {...props}
    />
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
