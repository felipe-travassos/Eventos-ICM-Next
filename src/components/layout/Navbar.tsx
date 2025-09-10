'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userData, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    const isAdmin = userData?.role === 'secretario_regional' || userData?.role === 'pastor';

    return (
        <nav className="bg-blue-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                    Eventos ICM
                </Link>

                <div className="hidden md:flex space-x-4">
                    <Link href="/" className="hover:underline">
                        Início
                    </Link>
                    <Link href="/my-registrations" className="hover:underline">
                        Minhas Inscrições
                    </Link>
                    <Link href="/profile" className="hover:underline">
                        Meu Perfil
                    </Link>

                    {isAdmin && (
                        <>
                            <Link href="/admin/events" className="hover:underline">
                                Eventos
                            </Link>
                            <Link href="/admin/churches" className="hover:underline">
                                Gestão de Igrejas
                            </Link>
                            <Link href="/admin/users" className="hover:underline">
                                Gestão de Usuários
                            </Link>
                            <Link href="/admin/event-management" className="hover:underline">
                                Gestão de Inscrições em Eventos
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {userData ? (
                        <>
                            <span>APDSJ, {userData.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hover:underline">
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                            >
                                Cadastrar
                            </Link>
                        </>
                    )}
                </div>

                {/* Menu mobile */}
                <button
                    className="md:hidden"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    ☰
                </button>
            </div>

            {/* Menu mobile expandido */}
            {isOpen && (
                <div className="md:hidden mt-2">
                    <div className="flex flex-col space-y-2">
                        <Link href="/" className="hover:underline p-2">
                            Início
                        </Link>
                        {/* <Link href="/events" className="hover:underline p-2">
                            Eventos
                        </Link> */}
                        <Link href="/my-registrations" className="hover:underline p-2">
                            Minhas Inscrições
                        </Link>
                        <Link href="/profile" className="hover:underline p-2">
                            Meu Perfil
                        </Link>

                        {isAdmin && (
                            <>
                                <Link href="/admin/events" className="hover:underline p-2">
                                    Gerenciar Eventos
                                </Link>
                                <Link href="/admin/churches" className="hover:underline p-2">
                                    Gerenciar Igrejas
                                </Link>
                                <Link href="/admin/users" className="hover:underline p-2">
                                    Gerenciar Usuários
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;