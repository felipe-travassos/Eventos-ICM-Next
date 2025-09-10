// app/my-registrations/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRegistrations, deleteEventRegistration, getEventById, getChurchById } from '@/lib/firebase/events';
import { EventRegistration, Event } from '@/types';
import Link from 'next/link';

/**
 * Interface estendida para incluir detalhes adicionais das inscrições
 * Combina dados da inscrição com informações do evento e da igreja do usuário
 */
interface RegistrationWithDetails extends EventRegistration {
    event?: Event;
}

/**
 * Página principal que exibe as inscrições do usuário
 * Permite visualizar e gerenciar inscrições em eventos
 */
export default function MyRegistrationsPage() {
    // Estado para armazenar as inscrições com detalhes
    const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);

    // Estado para controlar o carregamento dos dados
    const [loading, setLoading] = useState(true);

    // Estado para controlar qual inscrição está sendo excluída
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Dados de autenticação do usuário
    const { userData, currentUser } = useAuth();

    // Estado para armazenar informações da igreja do usuário
    const [userChurch, setUserChurch] = useState<{ id: string; name: string; pastor: string; pastorId: string } | null>(null);

    /**
     * Efeito para carregar os dados da igreja do usuário
     * Executa quando userData é atualizado
     */
    useEffect(() => {
        const loadUserChurch = async () => {
            // Verifica se o usuário tem uma igreja associada
            if (userData?.churchId) {
                try {
                    // Busca os dados da igreja no Firestore
                    const church = await getChurchById(userData.churchId);
                    if (church) {
                        setUserChurch(church);
                    }
                } catch (error) {
                    console.error('Erro ao carregar igreja:', error);
                }
            }
        };

        loadUserChurch();
    }, [userData]);

    /**
     * Efeito para carregar as inscrições do usuário com detalhes completos
     * Executa quando o currentUser é atualizado
     */
    useEffect(() => {
        const fetchRegistrationsWithDetails = async () => {
            if (!currentUser) return;

            try {
                const userRegistrations = await getUserRegistrations(currentUser.uid);

                const registrationsWithDetails = await Promise.all(
                    userRegistrations.map(async (registration) => {
                        // userChurch já é string conforme a interface EventRegistration
                        const registrationWithDetails: RegistrationWithDetails = {
                            ...registration // Mantém todas as propriedades originais
                        };

                        // Buscar detalhes do evento
                        if (registration.eventId) {
                            const event = await getEventById(registration.eventId);
                            if (event) {
                                registrationWithDetails.event = event;
                            }
                        }

                        // Buscar detalhes da igreja (se userChurch for um ID válido)
                        if (registration.userChurch && registration.userChurch !== 'Não informada') {
                            try {
                                const church = await getChurchById(registration.userChurch);
                                if (church) {
                                    registrationWithDetails.churchDetails = church;
                                }
                            } catch (error) {
                                console.error('Erro ao buscar detalhes da igreja:', error);
                            }
                        }

                        return registrationWithDetails;
                    })
                );

                setRegistrations(registrationsWithDetails);
            } catch (error) {
                console.error('Erro ao buscar inscrições:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegistrationsWithDetails();
    }, [currentUser]);

    /**
     * Função para excluir permanentemente uma inscrição
     * @param registrationId - ID da inscrição a ser excluída
     * @param eventId - ID do evento relacionado à inscrição
     */
    const handleDeleteRegistration = async (registrationId: string, eventId: string) => {
        // Confirmação de exclusão
        if (!confirm('Tem certeza que deseja excluir esta inscrição? Esta ação não pode ser desfeita.')) {
            return;
        }

        setDeletingId(registrationId);
        try {
            // Chama a função de exclusão no Firestore
            const result = await deleteEventRegistration(registrationId, eventId);

            if (result.success) {
                alert(result.message);
                // Remove a inscrição do estado local
                setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Erro ao excluir inscrição:', error);
            alert('Erro ao excluir inscrição');
        } finally {
            setDeletingId(null);
        }
    };

    // Exibe spinner de carregamento enquanto os dados são buscados
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Verifica se o usuário está autenticado
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">Acesso Restrito</h1>
                        <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
                        <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            Fazer Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Renderização principal da página
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Minhas Inscrições</h1>

                    {/* Mensagem de alerta se a igreja não for encontrada */}
                    {!userChurch && userData?.churchId && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Igreja não encontrada</h2>
                            <p className="text-sm text-yellow-700">
                                A igreja com ID {userData.churchId} não foi encontrada no sistema.
                            </p>
                        </div>
                    )}

                    {/* Mensagem para quando não há inscrições */}
                    {registrations.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">Você ainda não se inscreveu em nenhum evento.</p>
                            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                                Ver Eventos Disponíveis
                            </Link>
                        </div>
                    ) : (
                        // Lista de inscrições
                        <div className="grid gap-6">
                            {registrations.map((registration) => (
                                <div key={registration.id} className="border rounded-lg p-6 hover:shadow-md transition">
                                    {/* Cabeçalho com informações do evento */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-gray-800 mb-2">
                                                {registration.event?.title || `Evento #${registration.eventId}`}
                                            </h3>
                                            {registration.event && (
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p>
                                                        <strong>Data:</strong> {registration.event.date.toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <p>
                                                        <strong>Local:</strong> {registration.event.location}
                                                    </p>
                                                    <p>
                                                        <strong>Descrição:</strong> {registration.event.description}
                                                    </p>
                                                    <p>
                                                        <strong>Vagas:</strong> {registration.event.currentParticipants}/{registration.event.maxParticipants}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right space-y-2 ml-4">
                                            {/* Badge de status do pagamento */}
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${registration.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                registration.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {registration.paymentStatus === 'paid' ? 'Pago' :
                                                    registration.paymentStatus === 'pending' ? 'Pendente' : 'Reembolsado'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Informações detalhadas da inscrição */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-2">Dados da Inscrição</h4>
                                            <p className="text-sm text-gray-600">
                                                <strong>Nº Inscrição:</strong> {registration.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Data da inscrição:</strong> {registration.createdAt.toLocaleDateString('pt-BR')}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Status:</strong> {registration.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Nome na inscrição:</strong> {registration.userName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Email:</strong> {registration.userEmail}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Telefone:</strong> {registration.userPhone || 'Não informado'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Igreja:</strong> {registration.churchName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Pastor:</strong> {registration.pastorName}
                                            </p>

                                        </div>
                                    </div>

                                    {/* Área de ações para cada inscrição */}
                                    <div className="flex justify-between items-center pt-4 border-t">
                                        {registration.paymentStatus === 'pending' && (
                                            <div className="space-x-3">
                                                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm">
                                                    Realizar Pagamento
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRegistration(registration.id, registration.eventId)}
                                                    disabled={deletingId === registration.id}
                                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingId === registration.id ? 'Excluindo...' : 'Excluir Inscrição'}
                                                </button>
                                            </div>
                                        )}

                                        {registration.paymentStatus === 'paid' && (
                                            <span className="text-green-600 text-sm font-medium">
                                                ✅ Pagamento realizado - Entre em contato para cancelamento
                                            </span>
                                        )}

                                        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Ver mais eventos →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}