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

    return (
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-2xl fixed top-0 left-0 right-0 z-50 border-b border-blue-700/30">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center space-x-2 group"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                ICM
                            </span>
                        </div>
                        <span className="text-white font-bold text-lg hidden sm:block">
                            Eventos
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        {currentUser && (
                            <>
                                <Link
                                    href="/my-registrations"
                                    className="px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 group"
                                >
                                    <span className="flex items-center space-x-2">
                                        <span className="text-sm">🎫</span>
                                        <span>Minhas Inscrições</span>
                                    </span>
                                </Link>
                                <Link
                                    href="/profile"
                                    className="px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 group"
                                >
                                    <span className="flex items-center space-x-2">
                                        <span className="text-sm">👤</span>
                                        <span>Meu Perfil</span>
                                    </span>
                                </Link>
                            </>
                        )}

                        {isAdmin && (
                            <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-white/20">
                                <Link
                                    href="/admin/events"
                                    className="px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 text-sm"
                                >
                                    📅 Eventos
                                </Link>
                                <Link
                                    href="/admin/churches"
                                    className="px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 text-sm"
                                >
                                    ⛪ Igrejas
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 text-sm"
                                >
                                    👥 Usuários
                                </Link>
                                <Link
                                    href="/admin/event-management"
                                    className="px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 text-sm"
                                >
                                    📋 Inscrições
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* User Actions Desktop */}
                    <div className="hidden md:flex items-center space-x-3">
                        {currentUser ? (
                            <>
                                <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Olá, {userData?.name?.split(' ')[0] || 'Usuário'}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm flex items-center space-x-2"
                                >
                                    <span>🚪</span>
                                    <span>Sair</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link
                                    href="/login"
                                    className="px-6 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm border border-white/20 hover:border-white/40"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-500/25 border border-green-400/30"
                                >
                                    Cadastrar
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Menu mobile"
                    >
                        <div className="w-6 h-6 relative">
                            <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-white transform transition duration-200 ${isOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'}`}></span>
                            <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-white transform transition duration-200 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                            <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-white transform transition duration-200 ${isOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'}`}></span>
                        </div>
                    </button>
                </div>

                {/* Mobile Menu Expandido */}
                {isOpen && (
                    <div className="md:hidden mt-4 bg-gradient-to-b from-blue-900 to-blue-800 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-lg p-4">
                        {/* User Info */}
                        {currentUser && (
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    <div>
                                        <p className="font-semibold">Olá, {userData?.name || 'Usuário'}</p>
                                        <p className="text-blue-200 text-sm">{userData?.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Menu Links */}
                        <div className="space-y-2">
                            {currentUser && (
                                <>
                                    <Link
                                        href="/my-registrations"
                                        className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="text-lg">🎫</span>
                                        <span>Minhas Inscrições</span>
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="text-lg">👤</span>
                                        <span>Meu Perfil</span>
                                    </Link>
                                </>
                            )}

                            {isAdmin && (
                                <div className="pt-2 border-t border-white/10">
                                    <p className="px-4 py-2 text-blue-200 text-sm font-semibold">Administração</p>
                                    <Link
                                        href="/admin/events"
                                        className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="text-lg">📅</span>
                                        <span>Gerenciar Eventos</span>
                                    </Link>
                                    <Link
                                        href="/admin/churches"
                                        className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="text-lg">⛪</span>
                                        <span>Gerenciar Igrejas</span>
                                    </Link>
                                    <Link
                                        href="/admin/users"
                                        className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="text-lg">👥</span>
                                        <span>Gerenciar Usuários</span>
                                    </Link>
                                    <Link
                                        href="/admin/event-management"
                                        className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="text-lg">📋</span>
                                        <span>Gerenciar Inscrições</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                            {currentUser ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30 rounded-xl transition-all duration-200 active:scale-95"
                                >
                                    <span>🚪</span>
                                    <span>Sair da Conta</span>
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="block w-full text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 active:scale-95"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block w-full text-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 active:scale-95 border border-green-400/30"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Criar Conta
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;