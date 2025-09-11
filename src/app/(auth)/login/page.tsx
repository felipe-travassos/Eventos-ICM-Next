'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const {
        login,
        currentUser
    } = useAuth();

    const router = useRouter();

    // Redirecionar se já estiver logado
    useEffect(() => {
        if (currentUser) {
            router.push('/');
        }
    }, [currentUser, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            router.push('/');
        } catch (error: any) {
            setError('Falha ao entrar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Se já estiver logado, mostrar loading enquanto redireciona
    if (currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Redirecionando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-center text-gray-900">Eventos Igreja</h1>
                    <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
                        Entre na sua conta
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <label className="block text-gray-700 mb-2 font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2 font-medium">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Sua senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded disabled:opacity-50 font-medium transition duration-200"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="text-center">
                    <Link
                        href="/forgot-password"
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Esqueceu a senha?
                    </Link>
                </div>

                <div className="text-center">
                    <span className="text-gray-600 text-sm">
                        Não tem uma conta?{' '}
                        <Link
                            href="/register"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Cadastre-se
                        </Link>
                    </span>
                </div>
            </div>
        </div>
    );
}