import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        success: 'bg-green-500/20 text-green-300 border-green-500/30',
        warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        danger: 'bg-red-500/20 text-red-300 border-red-500/30',
        info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        primary: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
