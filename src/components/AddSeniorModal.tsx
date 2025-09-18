// components/AddSeniorModal.tsx
'use client';

import React, { useState } from 'react';

interface AddSeniorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSeniorAdded: (senior: any) => void;
    secretaryId: string;
    churchId: string;
    churchName: string;
    pastorName: string;
    loadingChurch?: boolean;
    initialName?: string;
}

export default function AddSeniorModal({
    isOpen,
    onClose,
    onSeniorAdded,
    secretaryId,
    churchId,
    churchName,
    pastorName,
    loadingChurch = false
}: AddSeniorModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
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
        if (!churchId || !churchName || !pastorName) {
            alert('Erro: Informações da igreja não disponíveis. Tente novamente em alguns instantes.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/seniors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    churchId: churchId,
                    secretaryId: secretaryId,
                    church: churchName,
                    pastor: pastorName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao cadastrar idoso');
            }

            const newSenior = await response.json();
            onSeniorAdded(newSenior);
            onClose();

        } catch (error: any) {
            alert('Erro ao cadastrar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Cadastrar Novo Idoso</h2>

                {loadingChurch && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                        <p>Carregando informações da igreja...</p>
                    </div>
                )}

                {!loadingChurch && (!churchId || !churchName || !pastorName) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p>Erro: Informações da igreja não disponíveis. Feche e tente novamente.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Digite o nome completo"
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
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Telefone *</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="(11) 99999-9999"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">CPF *</label>
                        <input
                            type="text"
                            required
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="000.000.000-00"
                            maxLength={14}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                        <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
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
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 bg-gray-500 text-white py-2 rounded"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !churchId}
                            className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}