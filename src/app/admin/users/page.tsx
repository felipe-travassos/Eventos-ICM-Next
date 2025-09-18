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

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'pastor':
                return 'bg-purple-100 text-purple-800';
            case 'secretario_local':
                return 'bg-blue-100 text-blue-800';
            case 'secretario_regional':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'pastor':
                return 'Pastor';
            case 'secretario_local':
                return 'Secretário Local';
            case 'secretario_regional':
                return 'Secretário Regional';
            default:
                return 'Membro';
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

            <div className="bg-white p-6 rounded-lg shadow-md">
                {/* Tabela para desktop */}
                <div className="hidden md:block overflow-x-auto">
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            disabled={updating === user.id}
                                            className="border rounded px-2 py-1 disabled:opacity-50 text-sm"
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
                                    <td className="p-3 text-sm">
                                        {user.createdAt.toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Cards para mobile */}
                <div className="md:hidden space-y-4">
                    {users.map((user) => (
                        <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Função:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Cadastro:</span>
                                    <span className="text-sm text-gray-800">
                                        {user.createdAt.toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alterar Função:
                                    </label>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        disabled={updating === user.id}
                                        className="w-full border rounded px-3 py-2 text-sm disabled:opacity-50"
                                    >
                                        <option value="membro">Membro</option>
                                        <option value="pastor">Pastor</option>
                                        <option value="secretario_local">Secretário Local</option>
                                        <option value="secretario_regional">Secretário Regional</option>
                                    </select>
                                    {updating === user.id && (
                                        <span className="text-xs text-gray-500 mt-1 block">Atualizando...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {users.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Nenhum usuário encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}