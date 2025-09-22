'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSonner } from '@/lib/sonner/useSonner';

/**
 * Componente de registro de novos usuários
 * Permite a criação de nova conta com nome, email, senha e confirmação de senha
 */
export default function Register() {
    // Estados do componente para controle do formulário e interface
    const [name, setName] = useState('');              // Nome completo do usuário
    const [email, setEmail] = useState('');            // Email para registro e login
    const [password, setPassword] = useState('');      // Senha escolhida pelo usuário
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirmação da senha
    const [loading, setLoading] = useState(false);     // Controla estado de carregamento durante o registro
    const { error } = useSonner();

    // Hooks externos para autenticação e navegação
    const { register } = useAuth();                    // Função de registro do contexto de autenticação
    const router = useRouter();                        // Hook para navegação programática

    // Acesso ao usuário atual para verificação de autenticação
    const { currentUser } = useAuth();

    /**
     * Efeito para redirecionamento automático de usuários já autenticados
     * Evita que usuários logados acessem a página de registro
     */
    useEffect(() => {
        if (currentUser) {
            router.push('/');
        }
    }, [currentUser, router]); // Executa quando currentUser ou router mudam

    /**
     * Renderização condicional: exibe loading durante redirecionamento
     * para usuários já autenticados
     */
    if (currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    {/* Spinner de carregamento durante redirecionamento */}
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Redirecionando...</p>
                </div>
            </div>
        );
    }

    /**
     * Função principal para processamento do formulário de registro
     * @param e - Evento de submissão do formulário
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Previne comportamento padrão do formulário

        // Validação inicial: verifica se as senhas coincidem
        if (password !== confirmPassword) {
            return error('As senhas não coincidem');
        }

        try {
            // Reseta estados antes da tentativa de registro
            setLoading(true);

            // Chama função de registro do contexto de autenticação
            await register(email, password, name);

            // Redireciona para página inicial após registro bem-sucedido
            router.push('/');
        } catch (error: any) {
            // Tratamento de erro genérico com mensagem amigável
            error('Falha ao criar conta: ' + error.message);
        } finally {
            // Garante que o loading seja desativado em ambos os casos (sucesso/erro)
            setLoading(false);
        }
    };

    /**
     * Renderização principal do componente de registro
     */
    return (
        <div className="max-w-md mx-auto mt-8">
            {/* Cabeçalho da página */}
            <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>


            {/* Formulário de registro */}
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
                {/* Campo: Nome completo */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Nome Completo</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)} // Atualiza estado do nome
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Seu nome completo"
                    />
                </div>

                {/* Campo: Email */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} // Atualiza estado do email
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="seu@email.com"
                    />
                </div>

                {/* Campo: Senha */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} // Atualiza estado da senha
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                    />
                </div>

                {/* Campo: Confirmação de senha */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Confirmar Senha</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} // Atualiza estado da confirmação
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Digite a senha novamente"
                        minLength={6}
                    />
                </div>

                {/* Botão de submissão do formulário */}
                <button
                    type="submit"
                    disabled={loading} // Desabilita durante o carregamento
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded disabled:opacity-50 font-medium transition duration-200"
                >
                    {loading ? 'Criando conta...' : 'Criar Conta'}
                </button>
            </form>

            {/* Link para página de login para usuários já cadastrados */}
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