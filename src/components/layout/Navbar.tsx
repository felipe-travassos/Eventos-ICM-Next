'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

import logoImage from '@/assets/logo1.png';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { userData, logout, currentUser } = useAuth();

    // Detectar scroll para adicionar efeito de blur
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsOpen(false);
    };

    const isAdmin = userData?.role === 'secretario_regional';

    const isSecretary = userData?.role === 'pastor' || userData?.role === 'secretario_local';

    const closeMenu = () => setIsOpen(false);

    return (
        <nav className={`bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white fixed top-0 left-0 right-0 z-50 border-b border-blue-500/20 shadow-lg transition-all duration-500 ${scrolled ? 'backdrop-blur-xl bg-slate-900/80' : 'backdrop-blur-sm'}`}>
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex justify-between items-center h-16 lg:h-18">

                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group" onClick={closeMenu}>
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-400/30 flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-950 group-hover:border-blue-400/50 transition-all duration-300 shadow-lg">
                            <Image
                                src={logoImage}
                                alt="Logo ICM"
                                width={36}
                                height={36}
                                className="object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-white font-bold text-xl tracking-wide">
                                Eventos
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
                        {currentUser && (
                            <>
                                <NavLink href="/my-registrations" icon="🎫" text="Minhas Inscrições" />
                                <NavLink href="/profile" icon="👤" text="Meu Perfil" />
                            </>
                        )}

                        {isAdmin && (
                            <div className="flex items-center space-x-1 lg:space-x-2 ml-3 pl-3 border-l border-blue-400/30">
                                <span className="text-blue-200 text-xs font-medium hidden lg:block mr-2">Admin</span>
                                <NavLink href="/admin/events" icon="📅" text="Eventos" sm />
                                <NavLink href="/admin/churches" icon="⛪" text="Igrejas" sm />
                                <NavLink href="/admin/users" icon="👥" text="Usuários" sm />
                                <NavLink href="/admin/event-management" icon="📋" text="Inscrições" sm />
                            </div>
                        )}

                        {isSecretary && (
                            <div className="flex items-center space-x-1 lg:space-x-2 ml-3 pl-3 border-l border-blue-400/30">
                                <span className="text-blue-200 text-xs font-medium hidden lg:block mr-2">Secretaria</span>
                                <NavLink href="/admin/event-management" icon="📋" text="Inscrições" sm />
                            </div>
                        )}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                        {currentUser ? (
                            <>
                                <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-800/30 to-blue-700/30 px-4 py-2 rounded-full border border-blue-400/20 backdrop-blur-sm">
                                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                                    <div className="text-sm">
                                        <span className="text-blue-100 font-medium">Olá, </span>
                                        <span className="text-white font-semibold">{userData?.name?.split(' ')[0] || 'Usuário'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-100 border border-red-400/30 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:shadow-lg hover:shadow-red-500/10"
                                >
                                    <span className="text-lg">🚪</span>
                                    <span className="font-medium">Sair</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href="/login" className="px-5 py-2 rounded-lg border border-blue-400/30 hover:bg-blue-800/30 hover:border-blue-400/50 transition-all duration-300 font-medium backdrop-blur-sm">
                                    Entrar
                                </Link>
                                <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-green-500/20">
                                    Cadastrar
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2.5 rounded-xl bg-gradient-to-r from-blue-800/30 to-blue-700/30 border border-blue-400/30 hover:from-blue-700/40 hover:to-blue-600/40 hover:border-blue-400/50 transition-all duration-300 backdrop-blur-sm shadow-lg"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="w-6 h-6 relative">
                            <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'rotate-45' : '-translate-y-2'}`}></span>
                            <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}></span>
                            <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? '-rotate-45' : 'translate-y-2'}`}></span>
                        </div>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 rounded-2xl border border-blue-400/20 p-6 backdrop-blur-md shadow-2xl animate-in slide-in-from-top-2 duration-300">

                        {currentUser && (
                            <div className="p-4 bg-gradient-to-r from-blue-800/20 to-blue-700/20 rounded-xl mb-4 border border-blue-400/10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-lg">{userData?.name || 'Usuário'}</p>
                                        <p className="text-blue-200 text-sm">{userData?.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            {currentUser && (
                                <>
                                    <div className="px-3 py-2 text-blue-300 text-sm font-medium border-b border-blue-400/20 mb-3">
                                        Navegação
                                    </div>
                                    <MobileLink href="/my-registrations" icon="🎫" text="Minhas Inscrições" onClick={closeMenu} />
                                    <MobileLink href="/profile" icon="👤" text="Meu Perfil" onClick={closeMenu} />
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <div className="pt-4 border-t border-blue-400/20 mt-4">
                                        <div className="px-3 py-2 text-blue-300 text-sm font-medium mb-2">
                                            Administração
                                        </div>
                                        <MobileLink href="/admin/events" icon="📅" text="Eventos" onClick={closeMenu} />
                                        <MobileLink href="/admin/churches" icon="⛪" text="Igrejas" onClick={closeMenu} />
                                        <MobileLink href="/admin/users" icon="👥" text="Usuários" onClick={closeMenu} />
                                        <MobileLink href="/admin/event-management" icon="📋" text="Inscrições" onClick={closeMenu} />
                                    </div>
                                </>
                            )}

                            {isSecretary && (
                                <div className="pt-4 border-t border-blue-400/20 mt-4">
                                    <div className="px-3 py-2 text-blue-300 text-sm font-medium mb-2">
                                        Secretaria
                                    </div>
                                    <MobileLink href="/admin/event-management" icon="📋" text="Inscrições" onClick={closeMenu} />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-blue-400/20">
                            {currentUser ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-100 border border-red-400/30 rounded-xl transition-all duration-300 font-medium"
                                >
                                    <span className="text-xl">🚪</span>
                                    <span>Sair da Conta</span>
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <MobileLink href="/login" text="Entrar na Conta" onClick={closeMenu} />
                                    <MobileLink href="/register" text="Criar Conta" onClick={closeMenu} primary />
                                </div>
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
        className={`px-4 py-2 rounded-xl hover:bg-blue-800/30 border border-transparent hover:border-blue-400/30 transition-all duration-300 backdrop-blur-sm group ${sm ? 'text-sm lg:px-3 lg:py-1.5' : 'font-medium'}`}
    >
        <span className="flex items-center space-x-2">
            <span className="group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <span>{text}</span>
        </span>
    </Link>
);

// Componente para links mobile
const MobileLink = ({ href, icon, text, onClick, primary = false }: { href: string; icon?: string; text: string; onClick: () => void; primary?: boolean }) => (
    <Link
        href={href}
        onClick={onClick}
        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 font-medium ${primary
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
            : 'hover:bg-blue-800/30 border border-transparent hover:border-blue-400/20'
            }`}
    >
        {icon && <span className="text-lg">{icon}</span>}
        <span>{text}</span>
    </Link>
);

export default Navbar;