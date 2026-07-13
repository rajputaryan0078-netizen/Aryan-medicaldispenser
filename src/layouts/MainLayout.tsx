import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClock } from '../hooks/useClock';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    {
        path: '/app/dashboard',
        label: 'Dashboard',
        icon: (
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm9 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm9 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        path: '/app/medicines',
        label: 'Prescription Registry',
        icon: (
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        path: '/app/dispense',
        label: 'Enroll Patient',
        icon: (
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        path: '/app/inventory',
        label: 'Inventory Control',
        icon: (
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        path: '/app/logs',
        label: 'Audit Ledger',
        icon: (
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
];

const MainLayout: React.FC = () => {
    const clock = useClock();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex">
            {/* Sidebar */}
            <motion.aside
                className="fixed left-0 top-0 bottom-0 z-40 flex flex-col
                   border-r border-[#E2E8F0] bg-white"
                animate={{ width: sidebarOpen ? 220 : 64 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Logo */}
                <div className="flex flex-col justify-center px-4 pt-4 pb-2 border-b border-[#E2E8F0] flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="relative w-7 h-7 flex-shrink-0">
                            <div className="absolute inset-0 bg-[#2563EB]/20 rounded-md blur-sm" />
                            <div className="relative flex items-center justify-center w-7 h-7 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md">
                                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                                    <rect x="2" y="2" width="5" height="5" rx="1.5" fill="#2563EB" opacity="0.9" />
                                    <rect x="9" y="2" width="5" height="5" rx="1.5" fill="#2563EB" opacity="0.6" />
                                    <rect x="2" y="9" width="5" height="5" rx="1.5" fill="#2563EB" opacity="0.6" />
                                    <rect x="9" y="9" width="5" height="5" rx="1.5" fill="#2563EB" opacity="0.4" />
                                </svg>
                            </div>
                        </div>
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.span
                                    className="font-bold text-[#0F172A] text-lg whitespace-nowrap overflow-hidden"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    NexDose
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    {sidebarOpen && (
                        <div className="mt-2 flex flex-col">
                            <span className="text-[10px] text-[#64748B] font-medium leading-tight">Amity University Noida</span>
                            <span className="text-[10px] text-[#94A3B8] leading-tight">B.Tech CSE · IoT Medical Dispenser</span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-hidden">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-[#EFF6FF] text-[#2563EB] font-medium border-l-2 border-[#2563EB]'
                                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className="flex-shrink-0">{item.icon}</span>
                                    <AnimatePresence>
                                        {sidebarOpen && (
                                            <motion.span
                                                className="text-xs font-medium whitespace-nowrap overflow-hidden tracking-wide"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 
                                   bg-[#2563EB] rounded-r-full"
                                            layoutId="activeIndicator"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom status */}
                <div className="flex-shrink-0 border-t border-[#E2E8F0] p-3">
                    <div className="flex items-center gap-2">
                        <div className="relative w-1.5 h-1.5 flex-shrink-0">
                            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </div>
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.span
                                    className="text-[10px] font-mono text-[#64748B] tracking-wider whitespace-nowrap"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Firebase Sync Online
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Toggle button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-16 w-6 h-6 bg-white border border-[#E2E8F0] 
                     rounded-full flex items-center justify-center hover:border-[#2563EB]/40
                     transition-all duration-200 group cursor-pointer shadow-sm"
                >
                    <motion.svg
                        viewBox="0 0 12 12"
                        className="w-3 h-3 text-[#64748B] group-hover:text-[#0F172A]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        animate={{ rotate: sidebarOpen ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                    >
                        <path d="M7 2L3 6l4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                </button>
            </motion.aside>

            {/* Main content */}
            <motion.main
                className="flex-1 min-h-screen"
                animate={{ paddingLeft: sidebarOpen ? 220 : 64 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Top bar */}
                <div className="sticky top-0 z-30 flex items-center justify-between px-6 h-14
                        border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B] font-mono">
                            {location.pathname.split('/').filter(Boolean).join(' / ')}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-2.5 py-0.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            <span>Firebase Sync Online</span>
                        </div>
                        {user && (
                            <div className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0] text-xs">
                                <span className="text-[#64748B] font-mono hidden sm:inline-block">
                                    {user.displayName || user.email}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-[#DC2626] hover:text-[#B91C1C] font-mono transition-colors cursor-pointer"
                                >
                                    [Logout]
                                </button>
                            </div>
                        )}
                        <div className="text-xs font-mono text-[#64748B]">{clock.time}</div>
                    </div>
                </div>

                {/* Page content */}
                <div className="p-6">
                    <Outlet />
                </div>
            </motion.main>
        </div>
    );
};

export default MainLayout;