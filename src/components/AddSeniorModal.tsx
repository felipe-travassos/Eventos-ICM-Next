'use client';

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ChurchInfo {
    churchId: string;
    churchName: string;
    pastorName: string;
}

interface AddSeniorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSeniorAdded: (senior: any) => void;
    secretaryId: string;
    churchInfo: ChurchInfo | null;
    loadingChurch?: boolean;
    initialName?: string;
}

export default function AddSeniorModal({
    isOpen,
    onClose,
    onSeniorAdded,
    churchInfo,
    secretaryId,
    loadingChurch = false,
    initialName = ''
}: AddSeniorModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialName,
        email: '',
        phone: '',
        cpf: '',
        birthDate: '',
        address: '',
        healthInfo: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar se temos todas as informações da igreja
        if (!churchInfo || !churchInfo.churchId || !churchInfo.churchName || !churchInfo.pastorName) {
            alert('Erro: Informações da igreja não disponíveis. Tente novamente em alguns instantes.');
            return;
        }

        // Validação básica dos campos obrigatórios
        if (!formData.name.trim() || !formData.phone.trim() || !formData.cpf.trim()) {
            alert('Por favor, preencha todos os campos obrigatórios (Nome, Telefone e CPF).');
            return;
        }

        setLoading(true);

        try {
            // Formatar CPF (remover caracteres não numéricos)
            const formattedCpf = formData.cpf.replace(/\D/g, '');

            // Criar objeto com os dados do idoso
            const seniorData = {
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim(),
                cpf: formattedCpf,
                birthDate: formData.birthDate || null,
                address: formData.address.trim() || null,
                healthInfo: formData.healthInfo.trim() || null,

                // Informações da igreja
                churchId: churchInfo.churchId,
                church: churchInfo.churchName,
                pastor: churchInfo.pastorName,

                // Informações do secretário que cadastrou
                secretaryId: secretaryId,

                // Timestamps
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                // Status
                status: 'active'
            };

            console.log('Salvando idoso no Firestore:', seniorData);

            // Salvar diretamente no Firestore
            const docRef = await addDoc(collection(db, 'seniors'), seniorData);

            // Criar objeto com o ID gerado para retornar
            const newSenior = {
                id: docRef.id,
                ...seniorData,
                createdAt: new Date(), // Usar data local para immediate feedback
                updatedAt: new Date()
            };

            console.log('Idoso cadastrado com ID:', docRef.id);

            // Chamar callback com o novo idoso
            onSeniorAdded(newSenior);

            // Fechar modal e limpar formulário
            onClose();
            setFormData({
                name: '',
                email: '',
                phone: '',
                cpf: '',
                birthDate: '',
                address: '',
                healthInfo: ''
            });

            alert('Idoso cadastrado com sucesso!');

        } catch (error: any) {
            console.error('Erro ao cadastrar idoso:', error);

            // Tratar erros específicos do Firestore
            if (error.code === 'permission-denied') {
                alert('Erro: Você não tem permissão para cadastrar idosos.');
            } else if (error.code === 'unavailable') {
                alert('Erro: Serviço indisponível. Verifique sua conexão com a internet.');
            } else {
                alert('Erro ao cadastrar idoso: ' + (error.message || 'Erro desconhecido'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Limpar formulário ao fechar
        setFormData({
            name: '',
            email: '',
            phone: '',
            cpf: '',
            birthDate: '',
            address: '',
            healthInfo: ''
        });
    };

    // Função para formatar CPF automaticamente
    const formatCpf = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
        if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    };

    // Função para formatar telefone automaticamente
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Cadastrar Novo Idoso</h2>

                {loadingChurch && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                        <p>Carregando informações da igreja...</p>
                    </div>
                )}

                {!loadingChurch && churchInfo && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
                        <p className="font-semibold">Igreja: {churchInfo.churchName}</p>
                        <p>Pastor: {churchInfo.pastorName}</p>
                    </div>
                )}

                {!loadingChurch && (!churchInfo || !churchInfo.churchId) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p>Erro: Informações da igreja não disponíveis. Feche e tente novamente.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Digite o nome completo"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="email@exemplo.com"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Telefone *</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="(11) 99999-9999"
                            maxLength={15}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">CPF *</label>
                        <input
                            type="text"
                            required
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="000.000.000-00"
                            maxLength={14}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                        <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Endereço</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Rua, número, bairro, cidade"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Informações de Saúde</label>
                        <textarea
                            value={formData.healthInfo}
                            onChange={(e) => setFormData({ ...formData, healthInfo: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows={3}
                            placeholder="Alergias, medicamentos, condições médicas..."
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !churchInfo || !churchInfo.churchId}
                            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}