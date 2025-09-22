'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSonner } from '@/lib/sonner/useSonner';

// Importando as imagens
import splashImage from '@/assets/splash.png';
import logoImage from '@/assets/logo1.png';

/**
 * Componente de Login
 * 
 * Gerencia a autenticação do usuário com formulário para email e senha.
 * Redireciona usuários autenticados e oferece links para recuperação de senha e criação de conta.
 * 
 * @returns {JSX.Element} Página de login com formulário e opções relacionadas
 */
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, currentUser } = useAuth();
    const router = useRouter();
    const { error } = useSonner();

    // Redireciona usuários autenticados
    useEffect(() => {
        if (currentUser) {
            router.push('/');
        }
    }, [currentUser, router]);

    /**
     * Manipula o envio do formulário de login
     * 
     * @param {React.FormEvent} e - Evento de submissão do formulário
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            await login(email, password);
            router.push('/');
        } catch (err: any) {
            error('Falha ao entrar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Loading durante redirecionamento
    if (currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Redirecionando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8">
            {/* Imagem de fundo com overlay - sem zoom */}
            <div className="fixed inset-0 z-0">
                <Image
                    src={splashImage}
                    alt="Background da Igreja"
                    fill
                    className="object-cover"
                    priority
                    placeholder="blur"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 md:bg-opacity-50"></div>
            </div>

            {/* Conteúdo principal - sem blur */}
            <div className="w-full max-w-md z-10 relative bg-white bg-opacity-50 p-6 rounded-2xl shadow-2xl">
                {/* Header com logo circular */}
                <div className="text-center mb-6">
                    <div className="flex flex-col items-center justify-center mb-4">
                        <div className="mb-3 flex justify-center">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-100 shadow-md flex items-center justify-center bg-blue-950">
                                <Image
                                    src={logoImage}
                                    alt="Logo ICM"
                                    width={64}
                                    height={64}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-blue-800">Eventos</h1>
                    </div>

                    <p className="mt-1 text-gray-600 text-xs md:text-sm">
                        Acesse para inscrições e gerenciamento eventos da igreja
                    </p>
                </div>

                {/* Formulário de login */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                            required
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                            required
                            placeholder="Sua senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg disabled:opacity-50 font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md hover:shadow-lg text-sm"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Entrando...
                            </span>
                        ) : 'Entrar'}
                    </button>
                </form>

                {/* Links adicionais */}
                <div className="text-center pt-3 border-t border-gray-200 mt-4">
                    <Link
                        href="/forgot-password"
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs transition duration-200 inline-flex items-center"
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Esqueceu a senha?
                    </Link>
                </div>

                <div className="text-center mt-3">
                    <span className="text-gray-600 text-xs">
                        Não tem uma conta?{' '}
                        <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition duration-200 inline-flex items-center text-xs"
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                            </svg>
                            Cadastre-se
                        </Link>
                    </span>
                </div>
            </div>

            {/* Texto adicional para mobile */}
            <div className="absolute bottom-4 left-0 right-0 text-center z-10 md:hidden">
                <p className="text-white text-xs font-light bg-black bg-opacity-40 inline-block px-3 py-1 rounded-full">
                    Eventos ICM - Maranata o Senhor Jesus vem!
                </p>
            </div>
        </div>
    );
}