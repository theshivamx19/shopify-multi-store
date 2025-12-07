import React from 'react';

export default function Card({ children, className = '', hover = false, ...props }) {
    const baseStyles = 'glass rounded-xl p-6 transition-smooth';
    const hoverStyles = hover ? 'glass-hover cursor-pointer' : '';

    return (
        <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
            {children}
        </div>
    );
}
