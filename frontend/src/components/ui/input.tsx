/**
 * Input — shadcn/ui-совместимое поле ввода.
 *
 * @example
 * <Input type="email" placeholder="name@example.com" />
 * <Input hasError placeholder="Введите имя" />
 */
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Показывать состояние ошибки */
    hasError?: boolean;
}

/**
 * Поле ввода с поддержкой error state и focus ring.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, hasError, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'flex w-full rounded-2xl border-2 bg-muted/40 px-5 py-4 text-base ring-offset-background transition-all duration-200',
                    'placeholder:text-muted-foreground/60',
                    'hover:bg-background',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:border-primary focus-visible:bg-background',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    hasError
                        ? 'border-destructive bg-destructive/5 ring-2 ring-destructive/20 focus-visible:ring-destructive/20 focus-visible:border-destructive'
                        : 'border-border',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export { Input };
