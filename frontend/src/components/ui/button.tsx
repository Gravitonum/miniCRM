/**
 * Button — shadcn/ui-совместимый компонент с вариантами через CVA.
 *
 * @example
 * <Button variant="default" size="lg">Войти</Button>
 * <Button variant="outline" size="sm">Отмена</Button>
 */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                outline:
                    'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                cyan: 'bg-[#19cbfe] text-white shadow-lg shadow-cyan-200 hover:bg-[#17a8d4] hover:shadow-xl hover:shadow-cyan-300 active:scale-[0.98]',
                emerald: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98]',
            },
            size: {
                default: 'h-10 px-5 py-2',
                sm: 'h-8 rounded-lg px-3 text-xs',
                lg: 'h-14 px-8 text-base',
                xl: 'h-16 px-8 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    /** Render as child element (Radix Slot) */
    asChild?: boolean;
}

/**
 * Многовариантная кнопка.
 * @param variant - визуальный стиль ('default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'cyan' | 'emerald')
 * @param size - размер ('sm' | 'default' | 'lg' | 'xl' | 'icon')
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';

export { buttonVariants };
