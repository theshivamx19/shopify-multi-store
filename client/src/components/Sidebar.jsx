import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Package, Settings } from 'lucide-react';

export default function Sidebar() {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/stores', icon: Store, label: 'Stores' },
        { to: '/products', icon: Package, label: 'Products' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 p-6 flex flex-col">
            {/* Logo */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold gradient-text">Shopify Manager</h1>
                <p className="text-sm text-gray-400 mt-1">Multi-Store Platform</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive
                                ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-white border border-primary-500/30 shadow-glow'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="pt-6 border-t border-white/10">
                <div className="text-xs text-gray-500 text-center">
                    <p>© 2025 Shopify Manager</p>
                    <p className="mt-1">v1.0.0</p>
                </div>
            </div>
        </aside>
    );
}
