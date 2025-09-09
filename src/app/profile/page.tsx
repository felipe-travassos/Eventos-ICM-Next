// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfileData, getChurches } from '@/lib/firebase/users';
import { Church } from '@/types';
import { linkPastorToChurch } from '@/lib/firebase/churches';

export default function ProfilePage() {
    const { userData, currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingChurches, setLoadingChurches] = useState(true);
    const [churches, setChurches] = useState<Church[]>([]);
    const [formData, setFormData] = useState({
        cpf: '',
        phone: '',
        churchId: ''
    });
    const [displayCpf, setDisplayCpf] = useState(''); // Estado separado para exibição no input

    // Função para aplicar máscara de CPF
    const formatCPF = (cpf: string) => {
        if (!cpf) return '';

        // Remove caracteres não numéricos
        const numericCPF = cpf.replace(/\D/g, '');

        // Aplica a máscara: 000.000.000-00
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

    // Função para mostrar CPF com asteriscos (apenas visualização)
    const displayMaskedCPF = (cpf: string) => {
        if (!cpf || cpf.length < 11) return cpf;

        const numericCPF = cpf.replace(/\D/g, '');
        if (numericCPF.length !== 11) return cpf;

        // Mostra os 3 primeiros e os 2 últimos dígitos, resto com asteriscos
        return `${numericCPF.substring(0, 3)}.***.***-${numericCPF.substring(9)}`;
    };

    // Função para aplicar máscara de telefone
    const formatPhone = (phone: string) => {
        if (!phone) return '';

        // Remove caracteres não numéricos
        const numericPhone = phone.replace(/\D/g, '');

        // Aplica a máscara: (00) 00000-0000
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

    useEffect(() => {
        const loadChurches = async () => {
            try {
                setLoadingChurches(true);
                const churchesData = await getChurches();
                console.log('Igrejas carregadas:', churchesData);
                setChurches(churchesData);
            } catch (error) {
                console.error('Erro ao carregar igrejas:', error);
            } finally {
                setLoadingChurches(false);
            }
        };

        loadChurches();

        if (userData) {
            setFormData({
                cpf: userData.cpf || '',
                phone: userData.phone || '',
                churchId: userData.churchId || ''
            });
            // Inicializa o display com CPF mascarado
            setDisplayCpf(userData.cpf ? displayMaskedCPF(userData.cpf) : '');
        }
    }, [userData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        try {
            // Remove máscaras antes de salvar
            const dataToSave = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ''),
                phone: formData.phone.replace(/\D/g, '')
            };

            await updateProfileData(currentUser.uid, dataToSave);

            if (formData.churchId) {
                await linkPastorToChurch(currentUser.uid, formData.churchId);
            }

            // Atualiza o display após salvar
            setDisplayCpf(dataToSave.cpf ? displayMaskedCPF(dataToSave.cpf) : '');

            alert('Perfil atualizado com sucesso!');

        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Se o campo estiver vazio ou com menos de 11 dígitos, mostra normalmente
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length < 11) {
            const formattedValue = formatCPF(value);
            setFormData({ ...formData, cpf: formattedValue });
            setDisplayCpf(formattedValue);
        } else {
            // Quando tem 11 dígitos, mostra com asteriscos mas mantém o valor real
            const formattedValue = formatCPF(value);
            setFormData({ ...formData, cpf: formattedValue });
            setDisplayCpf(displayMaskedCPF(formattedValue));
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedValue = formatPhone(value);
        setFormData({ ...formData, phone: formattedValue });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCpfFocus = () => {
        // Quando o campo ganha foco, mostra o CPF completo
        if (formData.cpf) {
            setDisplayCpf(formData.cpf);
        }
    };

    const handleCpfBlur = () => {
        // Quando o campo perde foco, mostra com asteriscos novamente
        if (formData.cpf) {
            setDisplayCpf(displayMaskedCPF(formData.cpf));
        }
    };

    if (!userData) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 text-red-800 p-4 rounded">
                    <p>Você precisa estar logado para acessar esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                            CPF
                        </label>
                        <input
                            type="text"
                            id="cpf"
                            name="cpf"
                            value={displayCpf} // Usa o estado de display
                            onChange={handleCpfChange}
                            onFocus={handleCpfFocus}
                            onBlur={handleCpfBlur}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="000.000.000-00"
                            maxLength={14}
                        />
                        {userData.cpf && formData.cpf === userData.cpf && (
                            <p className="text-xs text-gray-500 mt-1">
                                CPF atual: {displayMaskedCPF(userData.cpf)}
                            </p>
                        )}
                    </div>

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
                            maxLength={15}
                        />
                        {userData.phone && formData.phone === userData.phone && (
                            <p className="text-xs text-gray-500 mt-1">
                                Celular atual: {formatPhone(userData.phone)}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="churchId" className="block text-sm font-medium text-gray-700">
                            Igreja
                        </label>

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
                                    required={userData.role === 'pastor'}
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Atualizar Perfil'}
                    </button>
                </form>
            </div>
        </div>
    );
}