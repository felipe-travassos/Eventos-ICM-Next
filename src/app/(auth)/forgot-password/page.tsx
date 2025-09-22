'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSonner } from '@/lib/sonner/useSonner';

/**
 * Componente para redefinição de senha via email
 * Permite que usuários solicitem um link de redefinição de senha
 */
export default function ForgotPassword() {
    // Estados do componente
    const [email, setEmail] = useState('');        // Email informado pelo usuário
    const { error, promise } = useSonner();
    const [loading, setLoading] = useState(false); // Controla estado de carregamento durante a requisição

    // Hooks externos
    const { resetPassword, currentUser } = useAuth(); // Função de reset e estado do usuário atual
    const router = useRouter(); // Hook para navegação programática

    // Efeito para redirecionar usuários já autenticados
    useEffect(() => {
        /**
         * Se o usuário já estiver logado, redireciona para a página inicial
         * Evita acesso desnecessário à página de redefinição
         */
        if (currentUser) {
            router.push('/');
        }
    }, [currentUser, router]); // Dependências: executa quando currentUser ou router mudam

    /**
     * Função principal para submeter o formulário de redefinição
     * @param e - Evento do formulário
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Previne comportamento padrão do formulário

        // Validação client-side antes de enviar
        if (!email.trim()) {
            error('Campo obrigatório', 'Por favor, insira seu email');
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            error('Email inválido', 'Por favor, insira um email válido');
            return;
        }

        try {
            // Reseta estados antes da requisição
            // setMessage('');
            // setError('');
            setLoading(true); // Ativa estado de carregamento

            // Chama função de redefinição de senha do contexto de autenticação
            await promise(
                resetPassword(email.trim()), // Remove espaços extras
                {
                    loading: 'Enviando email de redefinição...',
                    success: 'Email enviado! Verifique sua caixa de entrada.',
                    error: (err) => {
                        // Mensagens mais amigáveis para o usuário
                        if (err.message.includes('user-not-found')) {
                            return 'Nenhuma conta encontrada com este email. Verifique o endereço.';
                        }
                        if (err.message.includes('invalid-email')) {
                            return 'Email inválido. Verifique o formato.';
                        }
                        return `Erro: ${err.message}`;
                    }
                }
            );

        } catch (error: any) {
            // Tratamento de erro genérico
            console.error('Erro inesperado:', error);
        } finally {
            // Desativa loading independente de sucesso ou erro
            setLoading(false);
        }
    };

    /**
     * Renderização condicional: exibe loading se usuário estiver autenticado
     * Durante o redirecionamento para a página inicial
     */
    if (currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    {/* Spinner de carregamento */}
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Redirecionando...</p>
                </div>
            </div>
        );
    }

    /**
     * Renderização principal do componente
     * Formulário de redefinição de senha
     */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl">
                {/* Cabeçalho informativo */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-blue-800">Redefinir Senha</h1>
                    <p className="mt-2 text-gray-600 text-sm">
                        Digite seu email para receber instruções de redefinição de senha
                    </p>
                </div>

                {/* Formulário de redefinição de senha */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo de email */}
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} // Atualiza estado do email
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                            required
                            placeholder="seu@email.com"
                        />
                    </div>

                    {/* Botão de submissão com estados de loading */}
                    <button
                        type="submit"
                        disabled={loading} // Desabilita durante o carregamento
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg disabled:opacity-50 font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md hover:shadow-lg text-sm"
                    >
                        {loading ? (
                            // Estado de carregamento: exibe spinner
                            <span className="flex items-center justify-center">
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Enviando...
                            </span>
                        ) : (
                            // Estado normal: texto padrão
                            'Redefinir Senha'
                        )}
                    </button>
                </form>

                {/* Link para voltar à página de login */}
                <div className="text-center mt-4">
                    <Link
                        href="/login"
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm transition duration-200 inline-flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    );
}