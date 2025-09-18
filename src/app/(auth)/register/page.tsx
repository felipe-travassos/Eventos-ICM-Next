'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    // Adicione no início do componente (após as declarações de estado)
    const { currentUser } = useAuth();

    // Redirecionar se já estiver logado
    useEffect(() => {
        if (currentUser) {
            router.push('/');
        }
    }, [currentUser, router]);

    // E adicione esta verificação antes do return
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('As senhas não coincidem');
        }

        try {
            setError('');
            setLoading(true);
            await register(email, password, name);
            router.push('/');
        } catch (error: any) {
            setError('Falha ao criar conta: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>

            {error && (
                <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Nome Completo</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Seu nome completo"
                    />
                </div>

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
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Confirmar Senha</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Digite a senha novamente"
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded disabled:opacity-50 font-medium transition duration-200"
                >
                    {loading ? 'Criando conta...' : 'Criar Conta'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <span className="text-gray-600 text-sm">
                    Já tem uma conta?{' '}
                    <Link
                        href="/login"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Entrar
                    </Link>
                </span>
            </div>
        </div>
    );
}