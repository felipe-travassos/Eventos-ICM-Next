// app/admin/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUsers, updateUserRole } from '@/lib/firebase/users';
import { UserRole } from '@/types';

export default function AdminUsersPage() {
    const { userData } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        // Verificar permissões
        if (userData?.role !== 'secretario_regional') {
            router.push('/');
            return;
        }

        loadUsers();
    }, [userData, router]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersData = await getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setUpdating(userId);
            await updateUserRole(userId, newRole);
            alert('Função atualizada com sucesso!');

            // Atualizar a lista local
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error: any) {
            console.error('Erro ao atualizar função:', error);
            alert('Erro ao atualizar função: ' + error.message);
        } finally {
            setUpdating(null);
        }
    };

    if (userData?.role !== 'secretario_regional') {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 text-red-800 p-4 rounded">
                    <p>Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando usuários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Gerenciar Usuários</h1>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full min-w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-3">Nome</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Função Atual</th>
                            <th className="text-left p-3">Alterar Função</th>
                            <th className="text-left p-3">Data de Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{user.name}</td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'pastor' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'secretario_local' ? 'bg-blue-100 text-blue-800' :
                                            user.role === 'secretario_regional' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        disabled={updating === user.id}
                                        className="border rounded px-2 py-1 disabled:opacity-50"
                                    >
                                        <option value="membro">Membro</option>
                                        <option value="pastor">Pastor</option>
                                        <option value="secretario_local">Secretário Local</option>
                                        <option value="secretario_regional">Secretário Regional</option>
                                    </select>
                                    {updating === user.id && (
                                        <span className="ml-2 text-sm text-gray-500">Atualizando...</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {user.createdAt.toLocaleDateString('pt-BR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Nenhum usuário encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}