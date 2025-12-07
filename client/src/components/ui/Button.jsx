import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    ...props
}) {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg hover:shadow-glow hover:scale-105 active:scale-95',
        secondary: 'glass text-white hover:bg-white/10',
        danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95',
        ghost: 'text-white hover:bg-white/5',
    };

    const sizes = {
        sm: 'py-1.5 px-4 text-sm',
        md: 'py-2 px-6',
        lg: 'py-3 px-8 text-lg',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </>
            ) : children}
        </button>
    );
}
