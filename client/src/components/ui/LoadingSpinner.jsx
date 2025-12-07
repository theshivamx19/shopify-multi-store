import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`${sizes[size]} relative`}>
                <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
