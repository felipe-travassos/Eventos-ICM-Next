'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSonner } from '@/lib/sonner/useSonner';
import { getChurches } from '@/lib/firebase/users';
import { Church } from '@/types';
import { isValidCpf, isValidPhone, isValidEmail } from '@/lib/validation/userValidation';

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
    const [cpf, setCpf] = useState('');                // CPF do usuário
    const [phone, setPhone] = useState('');            // Telefone do usuário
    const [churchId, setChurchId] = useState('');      // ID da igreja selecionada
    const [churches, setChurches] = useState<Church[]>([]); // Lista de igrejas disponíveis
    const [loading, setLoading] = useState(false);     // Controla estado de carregamento durante o registro
    const [loadingChurches, setLoadingChurches] = useState(true); // Controla carregamento das igrejas
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
     * Efeito para carregar a lista de igrejas disponíveis
     */
    useEffect(() => {
        const loadChurches = async () => {
            try {
                const churchesList = await getChurches();
                setChurches(churchesList);
            } catch (error) {
                console.error('Erro ao carregar igrejas:', error);
            } finally {
                setLoadingChurches(false);
            }
        };

        loadChurches();
    }, []);

    /**
     * Função para formatar CPF durante a digitação
     */
    const formatCpf = (value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length <= 11) {
            return cleanValue
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return cpf;
    };

    /**
     * Função para formatar telefone durante a digitação
     */
    const formatPhone = (value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length <= 11) {
            return cleanValue
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
        return phone;
    };

    /**
     * Função para validar CPF
     */
    const isValidCpfLocal = (cpf: string): boolean => {
        return isValidCpf(cpf);
    };

    /**
     * Função para validar telefone
     */
    const isValidPhoneLocal = (phone: string): boolean => {
        return isValidPhone(phone);
    };

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

        // Validações dos campos obrigatórios
        if (!name.trim()) {
            return error('Nome é obrigatório');
        }

        if (!email.trim()) {
            return error('Email é obrigatório');
        }

        if (!cpf.trim()) {
            return error('CPF é obrigatório');
        }

        if (!isValidCpfLocal(cpf)) {
            return error('CPF inválido');
        }

        if (!phone.trim()) {
            return error('Telefone é obrigatório');
        }

        if (!isValidPhoneLocal(phone)) {
            return error('Telefone deve ter entre 10 e 11 dígitos');
        }

        if (!isValidEmail(email)) {
            return error('Email inválido');
        }

        if (!churchId) {
            return error('Selecione uma igreja');
        }

        // Validação inicial: verifica se as senhas coincidem
        if (password !== confirmPassword) {
            return error('As senhas não coincidem');
        }

        if (password.length < 6) {
            return error('A senha deve ter pelo menos 6 caracteres');
        }

        try {
            // Reseta estados antes da tentativa de registro
            setLoading(true);

            // Chama função de registro do contexto de autenticação
            await register(email, password, name, cpf, phone, churchId);

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

                {/* Campo: CPF */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">CPF</label>
                    <input
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(formatCpf(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="000.000.000-00"
                        maxLength={14}
                    />
                </div>

                {/* Campo: Telefone */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Telefone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                    />
                </div>

                {/* Campo: Igreja */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Igreja</label>
                    {loadingChurches ? (
                        <div className="w-full p-3 border border-gray-300 rounded bg-gray-50">
                            Carregando igrejas...
                        </div>
                    ) : (
                        <select
                            value={churchId}
                            onChange={(e) => setChurchId(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Selecione uma igreja</option>
                            {churches.map((church) => (
                                <option key={church.id} value={church.id}>
                                    {church.name}
                                </option>
                            ))}
                        </select>
                    )}
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