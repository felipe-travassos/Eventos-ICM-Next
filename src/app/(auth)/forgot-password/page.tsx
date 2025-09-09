'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    // Adicione no início do componente (após as declarações de estado)
    const { currentUser } = useAuth();
    const router = useRouter();

    // Redirecionar se já estiver logado
    useEffect(() => {
        if (currentUser) {
            router.push('/events');
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

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(email);
            setMessage('Verifique sua caixa de entrada para instruções de recuperação de senha');
        } catch (error: any) {
            setError('Falha ao resetar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Recuperar Senha</h1>

            {message && (
                <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                    {message}
                </div>
            )}

            {error && (
                <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded disabled:opacity-50 font-medium transition duration-200"
                >
                    {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="text-blue-600 hover:underline text-sm"
                >
                    Voltar para login
                </Link>
            </div>
        </div>
    );
}