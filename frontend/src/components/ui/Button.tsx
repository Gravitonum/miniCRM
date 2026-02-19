import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'ghost' | 'link' | 'outline' | 'secondary' | 'danger';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-[#19cbfe] text-white hover:bg-[#17a8d4] shadow-sm': variant === 'default',
                        'hover:bg-gray-100 text-gray-700': variant === 'ghost',
                        'text-[#19cbfe] underline-offset-4 hover:underline': variant === 'link',
                        'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700': variant === 'outline',
                        'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
                        'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
                        'h-10 px-4 py-2': size === 'default',
                        'h-9 rounded-lg px-3 text-xs': size === 'sm',
                        'h-12 rounded-2xl px-8 text-lg': size === 'lg',
                        'h-10 w-10': size === 'icon',
                    },
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
