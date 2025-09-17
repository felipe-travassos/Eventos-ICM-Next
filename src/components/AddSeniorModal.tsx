// components/AddSeniorModal.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface AddSeniorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSeniorAdded: (senior: any) => void;
    secretaryId: string;
    initialName?: string;
    userChurchId: string; 
    userChurchName: string; 
    pastorName: string;
}

export default function AddSeniorModal({
    isOpen,
    onClose,
    onSeniorAdded,
    secretaryId,
    initialName = '',
    userChurchId,
    userChurchName,
    pastorName
}: AddSeniorModalProps) {
    const [formData, setFormData] = useState({
        name: initialName,
        email: '',
        phone: '',
        cpf: '',
        birthDate: '',
        church: userChurchName, // Preenche automaticamente
        pastor: pastorName, // Preenche automaticamente
        address: '',
        healthInfo: ''
    });
    const [loading, setLoading] = useState(false);

    // Atualiza os campos quando as props mudarem
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            church: userChurchName,
            pastor: pastorName
        }));
    }, [userChurchName, pastorName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/seniors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    churchId: userChurchId, // Adiciona o ID da igreja
                    secretaryId: secretaryId,
                    secret: 'secret-key-123' // mesma chave do .env
                })
            });

            if (response.ok) {
                const newSenior = await response.json();
                onSeniorAdded(newSenior);
                onClose();
            } else {
                throw new Error('Erro ao cadastrar');
            }
        } catch (error) {
            alert('Erro ao cadastrar idoso');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Cadastrar Novo Idoso</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
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
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Igreja *</label>
                        <input
                            type="text"
                            required
                            value={formData.church}
                            readOnly // Torna o campo somente leitura
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Pastor *</label>
                        <input
                            type="text"
                            required
                            value={formData.pastor}
                            readOnly // Torna o campo somente leitura
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Endereço</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Informações de Saúde</label>
                        <textarea
                            value={formData.healthInfo}
                            onChange={(e) => setFormData({ ...formData, healthInfo: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-500 text-white py-2 rounded"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
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