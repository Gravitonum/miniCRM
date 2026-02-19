import * as React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
    const [hasError, setHasError] = React.useState(false);

    return (
        <div
            className={cn(
                'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100',
                className
            )}
            {...props}
        >
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-600 font-semibold text-sm">
                    {fallback.substring(0, 2).toUpperCase()}
                </div>
            )}
        </div>
    );
}
