'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUsers, updateUserRole } from '@/lib/firebase/users';
import { UserRole, User } from '@/types';
import { toast } from 'sonner';

export default function AdminUsersPage() {
    const { userData } = useAuth();
    const router = useRouter();
-    const [users, setUsers] = useState<any[]>([]);
+    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

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
-        } catch (error) {
-        console.error('Erro ao carregar usuários:', error);
-        toast.error('Erro ao carregar usuários');
+        } catch (err: unknown) {
+        const message = err instanceof Error ? err.message : 'Erro ao carregar usuários';
+        console.error('Erro ao carregar usuários:', err);
+        toast.error(message);
       } finally {
        setLoading(false);
       }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setUpdating(userId);
            await updateUserRole(userId, newRole);
            toast.success('Função atualizada com sucesso!');

            // Atualizar a lista local
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
-        } catch (error: any) {
-            console.error('Erro ao atualizar função:', error);
-            toast.error('Erro ao atualizar função: ' + error.message);
+        } catch (err: unknown) {
+            const message = err instanceof Error ? err.message : 'Erro ao atualizar função';
+            console.error('Erro ao atualizar função:', err);
+            toast.error('Erro ao atualizar função: ' + message);
        } finally {
            setUpdating(null);
        }
    };

    // Filtrar usuários baseado nos filtros aplicados
    const filteredUsers = users.filter(user => {
        const matchesName = user.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                           user.email.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesName && matchesRole;
    });

    // Função para limpar filtros
    const clearFilters = () => {
        setNameFilter('');
        setRoleFilter('all');
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

            {/* Seção de Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Filtros</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtro por Nome/Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar por Nome ou Email
                        </label>
                        <input
                            type="text"
                            placeholder="Digite o nome ou email..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filtro por Função */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Função
                        </label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todas as Funções</option>
                            <option value="membro">Membro</option>
                            <option value="pastor">Pastor</option>
                            <option value="secretario_local">Secretário Local</option>
                            <option value="secretario_regional">Secretário Regional</option>
                        </select>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>

                {/* Contador de Resultados */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Mostrando <span className="font-semibold">{filteredUsers.length}</span> de{' '}
                        <span className="font-semibold">{users.length}</span> usuários
                        {(nameFilter || roleFilter !== 'all') && (
                            <span className="ml-2 text-blue-600">
                                (filtros aplicados)
                            </span>
                        )}
                    </p>
                </div>
            </div>

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
                            {filteredUsers.map((user) => (
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
                    {filteredUsers.map((user) => (
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

                {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">
                            {nameFilter || roleFilter !== 'all' 
                                ? 'Nenhum usuário encontrado com os filtros aplicados.' 
                                : 'Nenhum usuário encontrado.'
                            }
                        </p>
                        {(nameFilter || roleFilter !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="mt-2 text-blue-600 hover:text-blue-800 underline"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}