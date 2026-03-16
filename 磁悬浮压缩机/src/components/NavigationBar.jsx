import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NavigationBar = ({ sections, activeSection, onSectionChange }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-magnetic-500/10'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => onSectionChange('hero')}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl magnetic-gradient flex items-center justify-center shadow-lg shadow-magnetic-500/30">
                                <span className="text-2xl">🧲</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                        </div>
                        <div>
                            <div className="font-bold text-lg leading-tight">磁悬浮压缩机</div>
                            <div className="text-xs text-slate-400 font-mono">TURBOCOR TECH</div>
                        </div>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        {sections.map((section) => (
                            <motion.button
                                key={section.id}
                                onClick={() => onSectionChange(section.id)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeSection === section.id
                                        ? 'bg-magnetic-500 text-white shadow-lg shadow-magnetic-500/30'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {section.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-300 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 space-y-2"
                    >
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    onSectionChange(section.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${activeSection === section.id
                                        ? 'bg-magnetic-500 text-white'
                                        : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
};

export default NavigationBar;
