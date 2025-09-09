'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Church } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminChurches() {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [region, setRegion] = useState('');
    const [pastorId, setPastorId] = useState('');
    const [churches, setChurches] = useState<Church[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingChurch, setEditingChurch] = useState<Church | null>(null);
    const [showForm, setShowForm] = useState(false);
    const { userData } = useAuth();
    const router = useRouter();

    // Verificar permissões
    useEffect(() => {
        if (userData && !['pastor', 'secretario_regional'].includes(userData.role)) {
            router.push('/');
        }
    }, [userData, router]);

    useEffect(() => {
        const fetchChurches = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'churches'));
                const churchesData: Church[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    churchesData.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt.toDate()
                    } as Church);
                });

                setChurches(churchesData);
            } catch (error) {
                console.error('Erro ao buscar igrejas:', error);
            }
        };

        const fetchPastors = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const pastorsData: any[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.role === 'pastor') {
                        pastorsData.push({
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt.toDate()
                        });
                    }
                });

                setUsers(pastorsData);
            } catch (error) {
                console.error('Erro ao buscar pastores:', error);
            }
        };

        if (userData?.role && ['pastor', 'secretario_regional'].includes(userData.role)) {
            fetchChurches();
            fetchPastors();
        }
    }, [userData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;

        setLoading(true);
        try {
            if (editingChurch) {
                // Atualizar igreja existente
                await updateDoc(doc(db, 'churches', editingChurch.id), {
                    name,
                    address,
                    region,
                    pastorId: pastorId || null
                });

                setEditingChurch(null);
                alert('Igreja atualizada com sucesso!');
            } else {
                // Salvar nova igreja no Firestore
                await addDoc(collection(db, 'churches'), {
                    name,
                    address,
                    region,
                    pastorId: pastorId || null,
                    createdAt: new Date()
                });

                alert('Igreja cadastrada com sucesso!');
            }

            // Limpar formulário e esconder
            resetForm();

            // Recarregar igrejas
            const querySnapshot = await getDocs(collection(db, 'churches'));
            const churchesData: Church[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                churchesData.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt.toDate()
                } as Church);
            });

            setChurches(churchesData);

        } catch (error) {
            console.error('Erro ao salvar igreja:', error);
            alert('Erro ao salvar igreja. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (church: Church) => {
        setEditingChurch(church);
        setName(church.name);
        setAddress(church.address);
        setRegion(church.region);
        setPastorId(church.pastorId || '');
        setShowForm(true);
    };

    const handleDelete = async (churchId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta igreja?')) return;

        try {
            await deleteDoc(doc(db, 'churches', churchId));

            // Atualizar lista de igrejas
            setChurches(churches.filter(church => church.id !== churchId));
            alert('Igreja excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir igreja:', error);
            alert('Erro ao excluir igreja. Tente novamente.');
        }
    };

    const resetForm = () => {
        setEditingChurch(null);
        setName('');
        setAddress('');
        setRegion('');
        setPastorId('');
        setShowForm(false);
    };

    const cancelEdit = () => {
        resetForm();
    };

    const handleNewChurch = () => {
        resetForm();
        setShowForm(true);
    };

    if (!userData || !['pastor', 'secretario_regional'].includes(userData.role)) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 text-red-800 p-4 rounded">
                    <p>Você não tem permissão para acessar esta página.</p>
                    <Link href="/" className="text-blue-600 hover:underline">Voltar para a página inicial</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Igrejas</h1>

                {!showForm && churches.length > 0 && (
                    <button
                        onClick={handleNewChurch}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                        Cadastrar Nova Igreja
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingChurch ? 'Editar Igreja' : 'Cadastrar Nova Igreja'}
                    </h2>

                    <form onSubmit={handleSubmit} className="max-w-2xl">
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Nome da Igreja *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Endereço *</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Região *</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                                placeholder="Ex: Zona Norte, Centro, etc."
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Pastor (opcional)</label>
                            <select
                                value={pastorId}
                                onChange={(e) => setPastorId(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Selecione um pastor</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} - {user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
                            >
                                {loading ? 'Salvando...' : editingChurch ? 'Atualizar' : 'Cadastrar'}
                            </button>

                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Igrejas Cadastradas</h2>

                {churches.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-4">Nenhuma igreja cadastrada.</p>
                        <button
                            onClick={handleNewChurch}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        >
                            Cadastrar Primeira Igreja
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {churches.map((church) => {
                                const pastor = users.find(user => user.id === church.pastorId);

                                return (
                                    <div key={church.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800">{church.name}</h3>
                                        <p className="text-gray-600 mt-1">
                                            <strong>Endereço:</strong> {church.address}
                                        </p>
                                        <p className="text-gray-600">
                                            <strong>Região:</strong> {church.region}
                                        </p>
                                        {pastor && (
                                            <p className="text-gray-600">
                                                <strong>Pastor:</strong> {pastor.name}
                                            </p>
                                        )}

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(church)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(church.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Botão no final da lista quando há igrejas */}
                        {!showForm && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={handleNewChurch}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                >
                                    Cadastrar Nova Igreja
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}