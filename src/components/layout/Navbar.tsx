'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userData, logout, currentUser } = useAuth();

    const handleLogout = async () => {
        await logout();
        setIsOpen(false);
    };

    const isAdmin = userData?.role === 'secretario_regional' ||
        userData?.role === 'pastor' ||
        userData?.role === 'secretario_local';

    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white fixed top-0 left-0 right-0 z-50 border-b border-blue-700/30">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
                        <div className="bg-white/10 p-2 rounded-lg border border-white/20">
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                ICM
                            </span>
                        </div>
                        <span className="text-white font-bold text-lg hidden sm:block">
                            Eventos
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-2">
                        {currentUser && (
                            <>
                                <NavLink href="/my-registrations" icon="🎫" text="Minhas Inscrições" />
                                <NavLink href="/profile" icon="👤" text="Meu Perfil" />
                            </>
                        )}

                        {isAdmin && (
                            <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-white/20">
                                <NavLink href="/admin/events" icon="📅" text="Eventos" sm />
                                <NavLink href="/admin/churches" icon="⛪" text="Igrejas" sm />
                                <NavLink href="/admin/users" icon="👥" text="Usuários" sm />
                                <NavLink href="/admin/event-management" icon="📋" text="Inscrições" sm />
                            </div>
                        )}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-3">
                        {currentUser ? (
                            <>
                                <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-sm">Olá, {userData?.name?.split(' ')[0] || 'Usuário'}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                    <span>🚪</span>
                                    <span>Sair</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link href="/login" className="px-4 py-1 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                                    Entrar
                                </Link>
                                <Link href="/register" className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                                    Cadastrar
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="w-5 h-5 relative">
                            <span className={`absolute left-0 top-1/2 w-5 h-0.5 bg-white transform transition ${isOpen ? 'rotate-45' : '-translate-y-1'}`}></span>
                            <span className={`absolute left-0 top-1/2 w-5 h-0.5 bg-white transform transition ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                            <span className={`absolute left-0 top-1/2 w-5 h-0.5 bg-white transform transition ${isOpen ? '-rotate-45' : 'translate-y-1'}`}></span>
                        </div>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-2 bg-blue-900 rounded-lg border border-white/20 p-4">

                        {currentUser && (
                            <div className="p-3 bg-white/5 rounded-lg mb-3">
                                <p className="font-semibold">Olá, {userData?.name || 'Usuário'}</p>
                                <p className="text-blue-200 text-sm">{userData?.email}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            {currentUser && (
                                <>
                                    <MobileLink href="/my-registrations" icon="🎫" text="Minhas Inscrições" onClick={closeMenu} />
                                    <MobileLink href="/profile" icon="👤" text="Meu Perfil" onClick={closeMenu} />
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <div className="pt-2 border-t border-white/10">
                                        <p className="px-2 py-1 text-blue-200 text-sm">Administração</p>
                                        <MobileLink href="/admin/events" icon="📅" text="Eventos" onClick={closeMenu} />
                                        <MobileLink href="/admin/churches" icon="⛪" text="Igrejas" onClick={closeMenu} />
                                        <MobileLink href="/admin/users" icon="👥" text="Usuários" onClick={closeMenu} />
                                        <MobileLink href="/admin/event-management" icon="📋" text="Inscrições" onClick={closeMenu} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-white/10">
                            {currentUser ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 p-2 bg-red-500/20 text-red-100 border border-red-400/30 rounded-lg"
                                >
                                    <span>🚪</span>
                                    <span>Sair</span>
                                </button>
                            ) : (
                                <>
                                    <MobileLink href="/login" text="Entrar" onClick={closeMenu} />
                                    <MobileLink href="/register" text="Cadastrar" onClick={closeMenu} primary />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

// Componente para links desktop
const NavLink = ({ href, icon, text, sm = false }: { href: string; icon: string; text: string; sm?: boolean }) => (
    <Link
        href={href}
        className={`px-3 py-1 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors ${sm ? 'text-sm' : ''}`}
    >
        <span className="flex items-center space-x-1">
            <span>{icon}</span>
            <span>{text}</span>
        </span>
    </Link>
);

// Componente para links mobile
const MobileLink = ({ href, icon, text, onClick, primary = false }: { href: string; icon?: string; text: string; onClick: () => void; primary?: boolean }) => (
    <Link
        href={href}
        onClick={onClick}
        className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${primary
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'hover:bg-white/10'
            }`}
    >
        {icon && <span>{icon}</span>}
        <span>{text}</span>
    </Link>
);

export default Navbar;