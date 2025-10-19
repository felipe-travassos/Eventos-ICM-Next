// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfileData, getChurches } from '@/lib/firebase/users';
import { Church } from '@/types';
import { linkPastorToChurch } from '@/lib/firebase/churches';
import { toast } from 'sonner';

export default function ProfilePage() {
    // Contexto de autenticação para obter dados do usuário
    const { userData, currentUser } = useAuth();

    // Estados do componente
    const [loading, setLoading] = useState(false); // Controla estado de carregamento durante atualizações
    const [loadingChurches, setLoadingChurches] = useState(true); // Controla carregamento da lista de igrejas
    const [churches, setChurches] = useState<Church[]>([]); // Armazena a lista de igrejas
    const [formData, setFormData] = useState({
        cpf: '',
        phone: '',
        churchId: ''
    }); // Dados do formulário para edição
    const [displayCpf, setDisplayCpf] = useState(''); // CPF formatado para exibição (com máscara de segurança)

    /**
     * Formata um CPF aplicando a máscara padrão: 000.000.000-00
     * @param cpf - String contendo o CPF (com ou sem formatação)
     * @returns CPF formatado com pontos e traço
     */
    const formatCPF = (cpf: string) => {
        if (!cpf) return '';

        // Remove todos os caracteres não numéricos
        const numericCPF = cpf.replace(/\D/g, '');

        // Aplica a formatação progressiva baseada no tamanho
        if (numericCPF.length <= 3) {
            return numericCPF;
        } else if (numericCPF.length <= 6) {
            return numericCPF.replace(/(\d{3})(\d+)/, '$1.$2');
        } else if (numericCPF.length <= 9) {
            return numericCPF.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        } else {
            return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
        }
    };

    /**
     * Ofusca parte do CPF para exibição segura, mostrando apenas 
     * os primeiros 3 e últimos 2 dígitos
     * @param cpf - String contendo o CPF
     * @returns CPF com parte dos dígitos substituídos por asteriscos
     */
    const displayMaskedCPF = (cpf: string) => {
        // Retorna vazio se CPF não existir ou for muito curto
        if (!cpf || cpf.length < 11) return cpf;

        // Remove caracteres não numéricos
        const numericCPF = cpf.replace(/\D/g, '');

        // Retorna original se não tiver 11 dígitos
        if (numericCPF.length !== 11) return cpf;

        // Mantém os 3 primeiros e 2 últimos dígitos visíveis, ocultando os demais
        return `${numericCPF.substring(0, 3)}.***.***-${numericCPF.substring(9)}`;
    };

    /**
     * Formata um número de telefone aplicando a máscara padrão: (00) 00000-0000
     * @param phone - String contendo o telefone (com ou sem formatação)
     * @returns Telefone formatado com parênteses, espaço e traço
     */
    const formatPhone = (phone: string) => {
        if (!phone) return '';

        // Remove todos os caracteres não numéricos
        const numericPhone = phone.replace(/\D/g, '');

        // Aplica a formatação progressiva baseada no tamanho
        if (numericPhone.length <= 2) {
            return numericPhone;
        } else if (numericPhone.length <= 6) {
            return numericPhone.replace(/(\d{2})(\d+)/, '($1) $2');
        } else if (numericPhone.length <= 10) {
            return numericPhone.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
        } else {
            return numericPhone.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
        }
    };

    // Efeito para carregar dados iniciais quando o componente é montado
    useEffect(() => {
        /**
         * Função assíncrona para carregar a lista de igrejas do Firebase
         */
        const loadChurches = async () => {
            try {
                setLoadingChurches(true); // Ativa indicador de carregamento
                const churchesData = await getChurches(); // Busca igrejas
                console.log('Igrejas carregadas:', churchesData);
                setChurches(churchesData); // Atualiza estado com as igrejas
            } catch (error) {
                console.error('Erro ao carregar igrejas:', error);
            } finally {
                setLoadingChurches(false); // Desativa indicador de carregamento
            }
        };

        loadChurches(); // Executa o carregamento das igrejas

        // Preenche o formulário com os dados do usuário, se disponíveis
        if (userData) {
            setFormData({
                cpf: userData.cpf || '',
                phone: userData.phone || '',
                churchId: userData.churchId || ''
            });
            // Inicializa a exibição do CPF com máscara de segurança
            setDisplayCpf(userData.cpf ? displayMaskedCPF(userData.cpf) : '');
        }
    }, [userData]); // Executa quando userData muda

    /**
     * Manipula o envio do formulário de atualização de perfil
     * @param e - Evento de submissão do formulário
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Previne comportamento padrão do formulário

        // Não prossegue se não houver usuário autenticado
        if (!currentUser) return;

        setLoading(true); // Ativa estado de carregamento
        try {
            // Prepara dados para salvar removendo formatações
            const dataToSave = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ''), // Remove não numéricos do CPF
                phone: formData.phone.replace(/\D/g, '') // Remove não numéricos do telefone
                
            };

            // Atualiza os dados do perfil no Firebase
            await updateProfileData(currentUser.uid, dataToSave);

            // Se uma igreja foi selecionada, vincula o pastor a ela
            // if (formData.churchId) {
            //     await linkPastorToChurch(currentUser.uid, formData.churchId);
            // }

            // Atualiza a exibição do CPF com a máscara de segurança
            setDisplayCpf(dataToSave.cpf ? displayMaskedCPF(dataToSave.cpf) : '');

            toast.success('Perfil atualizado com sucesso!'); // Feedback de sucesso

        } catch (err: unknown) {
            console.error('Erro ao atualizar perfil:', err);
            const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
            toast.error('Erro ao atualizar perfil: ' + message); // Feedback de erro
        } finally {
            setLoading(false); // Desativa estado de carregamento
        }
    };

    /**
     * Manipula mudanças no campo CPF, aplicando formatação e máscara de segurança
     * @param e - Evento de change do input
     */
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = value.replace(/\D/g, ''); // Remove não numéricos

        // Para CPFs incompletos (<11 dígitos), mostra formatação normal
        if (numericValue.length < 11) {
            const formattedValue = formatCPF(value);
            setFormData({ ...formData, cpf: formattedValue });
            setDisplayCpf(formattedValue);
        } else {
            // Para CPFs completos, aplica máscara de segurança mas mantém valor real
            const formattedValue = formatCPF(value);
            setFormData({ ...formData, cpf: formattedValue });
            setDisplayCpf(displayMaskedCPF(formattedValue));
        }
    };

    /**
     * Manipula mudanças no campo telefone, aplicando formatação
     * @param e - Evento de change do input
     */
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedValue = formatPhone(value); // Aplica formatação
        setFormData({ ...formData, phone: formattedValue });
    };

    /**
     * Manipula mudanças no select de igrejas
     * @param e - Evento de change do select
     */
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value // Atualiza dinamicamente o campo pelo nome
        });
    };

    /**
     * Manipula o evento de foco no campo CPF, mostrando o valor completo
     */
    const handleCpfFocus = () => {
        if (formData.cpf) {
            setDisplayCpf(formData.cpf); // Mostra CPF completo durante edição
        }
    };

    /**
     * Manipula o evento de blur no campo CPF, aplicando máscara de segurança
     */
    const handleCpfBlur = () => {
        if (formData.cpf) {
            setDisplayCpf(displayMaskedCPF(formData.cpf)); // Aplica máscara ao sair do campo
        }
    };

    // Renderiza mensagem de erro se não houver dados do usuário
    if (!userData) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 text-red-800 p-4 rounded">
                    <p>Você precisa estar logado para acessar esta página.</p>
                </div>
            </div>
        );
    }

    // Renderização principal do componente
    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                {/* Seção de visualização de dados (somente leitura) */}
                <div className="mb-4">
                    <p><strong>Nome:</strong> {userData.name}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Função:</strong> {userData.role}</p>
                    {userData.cpf && (
                        <p><strong>CPF:</strong> {displayMaskedCPF(userData.cpf)}</p>
                    )}
                    {userData.phone && (
                        <p><strong>Celular:</strong> {formatPhone(userData.phone)}</p>
                    )}
                </div>

                {/* Formulário de edição */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo CPF com máscara dinâmica */}
                    <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                            CPF
                        </label>
                        <input
                            type="text"
                            id="cpf"
                            name="cpf"
                            value={displayCpf} // Usa o estado de display com máscara
                            onChange={handleCpfChange}
                            onFocus={handleCpfFocus}
                            onBlur={handleCpfBlur}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="000.000.000-00"
                            maxLength={14} // Limite considerando caracteres de formatação
                        />
                        {/* Mostra valor atual se não foi modificado */}
                        {userData.cpf && formData.cpf === userData.cpf && (
                            <p className="text-xs text-gray-500 mt-1">
                                CPF atual: {displayMaskedCPF(userData.cpf)}
                            </p>
                        )}
                    </div>

                    {/* Campo telefone com formatação */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Celular
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="(11) 99999-9999"
                            maxLength={15} // Limite considerando caracteres de formatação
                        />
                        {/* Mostra valor atual se não foi modificado */}
                        {userData.phone && formData.phone === userData.phone && (
                            <p className="text-xs text-gray-500 mt-1">
                                Celular atual: {formatPhone(userData.phone)}
                            </p>
                        )}
                    </div>

                    {/* Seletor de igreja */}
                    <div>
                        <label htmlFor="churchId" className="block text-sm font-medium text-gray-700">
                            Igreja
                        </label>

                        {/* Estados de carregamento e empty state */}
                        {loadingChurches ? (
                            <div className="text-sm text-gray-500">Carregando igrejas...</div>
                        ) : churches.length === 0 ? (
                            <div className="text-sm text-red-500">Nenhuma igreja cadastrada</div>
                        ) : (
                            <>
                                <select
                                    id="churchId"
                                    name="churchId"
                                    value={formData.churchId}
                                    onChange={handleSelectChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required={userData.role === 'pastor'} // Obrigatório para pastores
                                >
                                    <option value="">Selecione uma igreja</option>
                                    {churches.map((church) => (
                                        <option key={church.id} value={church.id}>
                                            {church.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-sm text-gray-500 mt-1">
                                    Você deve estar vinculado a uma igreja.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Botão de submissão */}
                    <button
                        type="submit"
                        disabled={loading} // Desabilita durante o carregamento
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Atualizar Perfil'}
                    </button>
                </form>
            </div>
        </div>
    );
}