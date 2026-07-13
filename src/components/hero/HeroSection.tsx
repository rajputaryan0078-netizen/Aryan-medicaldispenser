import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClock } from '../../hooks/useClock';
import { useAuth } from '../../context/AuthContext';
import HeroVisual from './HeroVisual';

const NAV_ITEMS = ['System Architecture', 'Workflow', 'Clinical Data'];

const STATS = [
    { value: '99.9%', label: 'Dispense accuracy', color: 'text-[#185FA5]' },
    { value: '<1.2s', label: 'Sync latency', color: 'text-[#185FA5]' },
    { value: 'HIPAA', label: 'Compliant', color: 'text-[#185FA5]' },
];

const MODULES = ['Analytics', 'Dispensing', 'Inventory', 'Pharmacy'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any },
    },
};

// Navbar
const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e2e5ea]"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
        >
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <motion.div
                    className="flex items-center gap-2.5 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate('/')}
                >
                    <div className="relative w-7 h-7">
                        <div className="absolute inset-0 bg-[#185FA5]/10 rounded-md blur-sm" />
                        <div className="relative flex items-center justify-center w-7 h-7 bg-[#185FA5]/10 border border-[#185FA5]/30 rounded-md">
                            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                                <rect x="2" y="2" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.9" />
                                <rect x="9" y="2" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.6" />
                                <rect x="2" y="9" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.6" />
                                <rect x="9" y="9" width="5" height="5" rx="1.5" fill="#185FA5" opacity="0.4" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-sm font-semibold text-[#1a1d23] tracking-tight">
                        NexDose
                    </span>
                </motion.div>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-6">
                    {NAV_ITEMS.map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-sm text-[#6b7280] hover:text-[#1a1d23] transition-colors duration-200"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* CTA / Session Controls */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[#6b7280] hidden lg:inline-block font-mono bg-[#f8f9fb] px-2.5 py-1 rounded border border-[#e2e5ea]">
                                {user.displayName || user.email}
                            </span>
                            <motion.button
                                onClick={() => navigate('/app/dashboard')}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#185FA5] hover:bg-[#15528f] rounded-lg transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Dashboard
                            </motion.button>
                            <button
                                onClick={logout}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors font-mono cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <motion.button
                            onClick={() => navigate('/login')}
                            className="relative px-4 py-1.5 text-sm font-medium text-[#374151] rounded-lg
                             border border-[#e2e5ea] bg-white hover:bg-[#f8f9fb] hover:text-[#1a1d23]
                             transition-all duration-200 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Launch console
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
};

// Status bar
const StatusBar: React.FC = () => {
    const clock = useClock();

    return (
        <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 mb-6"
        >
            <div className="flex items-center gap-1.5 bg-[#185FA5]/5 border border-[#185FA5]/15 
                      rounded-full px-3 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#639922] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#639922]" />
                </span>
                <span className="text-[10px] font-mono text-[#185FA5] tracking-wider uppercase">
                    IoT-powered · ESP32 + Firebase · HIPAA compliant
                </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#6b7280]/60">
                <span>{clock.time}</span>
                <span>UTC</span>
            </div>
        </motion.div>
    );
};

// Hero content
const HeroContent: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <motion.div
            className="flex flex-col justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <StatusBar />

            {/* Headline */}
            <motion.div variants={itemVariants} className="mb-6">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight">
                    <span className="text-[#1a1d23]">Smart Prescription. </span>
                    <span className="text-[#185FA5]">Accurate Dispensing. </span>
                    <span className="text-[#1a1d23]">Zero Errors.</span>
                </h1>
            </motion.div>

            {/* Description */}
            <motion.p
                variants={itemVariants}
                className="text-[#6b7280] text-sm lg:text-base leading-relaxed max-w-lg mb-8"
            >
                NexDose is an enterprise-grade IoT clinical medication management system. Leveraging ESP32-powered edge devices, Firebase real-time listeners, and barcoded inventory validation, NexDose automates prescription delivery to eliminate manual error.
            </motion.p>

            {/* Stats */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-3 mb-8 max-w-md"
            >
                {STATS.map((stat) => (
                    <motion.div
                        key={stat.label}
                        className="flex flex-col gap-1.5 p-3 rounded-xl border border-[#e2e5ea] 
                       bg-white shadow-sm hover:border-[#185FA5]/30 
                       transition-all duration-300"
                        whileHover={{ y: -2, scale: 1.02 }}
                    >
                        <span className={`text-lg lg:text-xl font-bold ${stat.color} leading-none`}>
                            {stat.value}
                        </span>
                        <span className="text-[9px] font-mono text-[#9ca3af] tracking-wider leading-tight uppercase">
                            {stat.label}
                        </span>
                    </motion.div>
                ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
                <motion.button
                    onClick={() => navigate(user ? '/app/dashboard' : '/login')}
                    className="group relative flex items-center gap-2.5 px-5 py-2.5 
                     bg-[#185FA5] hover:bg-[#15528f] text-white text-sm 
                     font-semibold rounded-xl transition-all duration-200 overflow-hidden cursor-pointer shadow-md"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <span className="relative z-10">
                        {user ? 'Enter Console' : 'See it in action'}
                    </span>
                    <motion.svg
                        viewBox="0 0 16 16"
                        className="w-4 h-4 relative z-10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        initial={false}
                        animate={{ x: 0 }}
                        whileHover={{ x: 2 }}
                    >
                        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                </motion.button>

                <a
                    href="#system-architecture"
                    className="flex items-center gap-2 px-5 py-2.5 text-[#374151] hover:text-[#1a1d23]
                     text-sm font-medium border border-[#e2e5ea]
                     rounded-xl transition-all duration-200 bg-white hover:bg-[#f8f9fb]"
                >
                    <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#374151]" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" />
                        <path d="M8 6v4M8 10h.01" strokeLinecap="round" />
                    </svg>
                    Hardware specs
                </a>
            </motion.div>

            {/* Active modules */}
            <motion.div variants={itemVariants}>
                <p className="text-[10px] font-mono text-[#6b7280] tracking-wider mb-3 uppercase">
                    Active clinical modules
                </p>
                <div className="flex flex-wrap gap-2">
                    {MODULES.map((mod, i) => (
                        <motion.div
                            key={mod}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
                          border transition-all duration-300 ${i === 1
                                     ? 'border-[#185FA5]/30 bg-[#E6F1FB] text-[#185FA5]'
                                     : 'border-[#e2e5ea] bg-[#f8f9fb] text-[#6b7280] hover:bg-[#e2e5ea] hover:text-[#1a1d23]'
                                }`}
                            whileHover={{ scale: 1.04 }}
                        >
                            {i === 1 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#639922]" />
                            )}
                            {mod}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

// Main HeroSection
const HeroSection: React.FC = () => {
    return (
        <section className="relative min-h-screen bg-white overflow-hidden">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.012]"
                style={{
                    backgroundImage:
                        'linear-gradient(#185FA5 1px, transparent 1px), linear-gradient(90deg, #185FA5 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <Navbar />

            {/* Main hero layout */}
            <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 min-h-screen
                      flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
                {/* Left content */}
                <div className="w-full lg:w-1/2 lg:pr-8 z-10">
                    <HeroContent />
                </div>

                {/* Right visual */}
                <div className="w-full lg:w-1/2 h-[480px] lg:h-[680px] flex-shrink-0">
                    <HeroVisual />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
