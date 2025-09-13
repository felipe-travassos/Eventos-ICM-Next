// app/my-registrations/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getUserRegistrations,
    deleteEventRegistration,
    getEventById,
    getChurchById,
} from '@/lib/firebase/events';
import PaymentModal from '@/components/PaymentModal';

import { EventRegistration, Event, Church } from '@/types';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

// Interface para dados de pagamento
interface PaymentData {
    registrationId: string;
    eventId: string;
    amount: number;
    description: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    paymentId?: string;
    externalReference: string;
}

/**
 * Interface estendida para incluir detalhes adicionais das inscrições
 */
interface RegistrationWithDetails extends EventRegistration {
    event?: Event;
    churchDetails?: Church;
}

export default function MyRegistrationsPage() {
    const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { userData, currentUser } = useAuth();
    const [userChurch, setUserChurch] = useState<{ id: string; name: string; pastor: string; pastorId: string } | null>(null);

    // Estados do Mercado Pago
    const [processingPayment, setProcessingPayment] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        const loadUserChurch = async () => {
            if (userData?.churchId) {
                try {
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

    useEffect(() => {
        const fetchRegistrationsWithDetails = async () => {
            if (!currentUser) return;

            try {
                const userRegistrations = await getUserRegistrations(currentUser.uid);
                const registrationsWithDetails = await Promise.all(
                    userRegistrations.map(async (registration) => {
                        const registrationWithDetails: RegistrationWithDetails = {
                            ...registration
                        };

                        if (registration.eventId) {
                            const event = await getEventById(registration.eventId);
                            if (event) {
                                registrationWithDetails.event = event;
                            }
                        }

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

    // Função createPixPayment atualizada para lidar com errors
    const createPixPayment = async (paymentRequest: any) => {
        try {
            const res = await fetch('/api/pix/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentRequest),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP error! status: ${res.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro na criação do PIX:', error);
            throw error;
        }
    }

    const getPaymentStatus = async (paymentId: string, registrationId: string) => {
        try {
            const res = await fetch(`/api/pix/status?paymentId=${paymentId}&registrationId=${registrationId}`)
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
            }
            return await res.json()
        } catch (error) {
            console.error('Erro ao verificar status:', error)
            throw error
        }
    }

    const updatePaymentStatus = async (registrationId: string, status: string): Promise<void> => {
        try {
            const registrationRef = doc(db, 'registrations', registrationId)
            await updateDoc(registrationRef, {
                paymentStatus: status,
                updatedAt: serverTimestamp()
            })
            console.log('Status atualizado com sucesso:', registrationId, status)
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            throw error
        }
    }

    // Função para formatar telefone (remover caracteres não numéricos)
    const formatPhoneNumber = (phone: string | undefined): string => {
        if (!phone) return '000000000';
        return phone.replace(/\D/g, '').slice(-9); // Pega os últimos 9 dígitos
    }

    // Função para extrair área code do telefone
    const getAreaCode = (phone: string | undefined): string => {
        if (!phone) return '55';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.slice(0, 2);
        }
        return '55'; // Default Brazil code
    }


    const handlePayment = async (registration: RegistrationWithDetails) => {
        console.log('Iniciando pagamento para:', registration.id)
        if (!registration.event) return;

        setProcessingPayment(registration.id);

        try {
            const amount = registration.event.price || 50;
            const firstName = registration.userName.split(' ')[0];
            const lastName = registration.userName.split(' ').slice(1).join(' ') || '';

            const paymentRequest = {
                transaction_amount: amount,
                description: `Inscrição: ${registration.event.title}`,

                // Dados do pagador
                payer: {
                    email: registration.userEmail,
                    first_name: firstName,
                    last_name: lastName,
                    identification: {
                        type: 'CPF',
                        number: registration.userCpf || '00000000000'
                    },
                    phone: {
                        area_code: getAreaCode(registration.userPhone),
                        number: formatPhoneNumber(registration.userPhone)
                    }
                },

                // Informações adicionais
                additional_info: {
                    items: [
                        {
                            id: registration.eventId,
                            title: registration.event.title,
                            description: `Inscrição para ${registration.event.title} - ${registration.event.location}`,
                            category_id: 'events',
                            quantity: 1,
                            unit_price: amount
                        }
                    ],
                    payer: {
                        first_name: firstName,
                        last_name: lastName,
                        phone: {
                            area_code: getAreaCode(registration.userPhone),
                            number: formatPhoneNumber(registration.userPhone)
                        }
                    }
                },

                // Metadados com external_reference
                metadata: {
                    registrationId: registration.id, // ← external_reference será este ID
                    eventId: registration.eventId,
                    userId: currentUser!.uid,
                    eventName: registration.event.title,
                    userName: registration.userName,
                    userEmail: registration.userEmail,
                    userChurch: registration.churchName,
                    pastorName: registration.pastorName
                },
            };

            // DEBUG: Mostra os dados que serão enviados
            console.log('📤 Dados sendo enviados para Mercado Pago:', JSON.stringify(paymentRequest, null, 2));

            const paymentResult = await createPixPayment(paymentRequest);

            console.log('✅ Resultado do pagamento:', {
                id: paymentResult.id,
                external_reference: paymentResult.external_reference,
                qr_code: paymentResult.qr_code ? '✅ Gerado' : '❌ Falhou',
                error: paymentResult.error
            });

            if (paymentResult.id && paymentResult.qr_code) {
                setPaymentData({
                    registrationId: registration.id,
                    eventId: registration.eventId,
                    amount,
                    description: paymentRequest.description,
                    qrCode: paymentResult.qr_code,
                    qrCodeBase64: paymentResult.qr_code_base64,
                    ticketUrl: paymentResult.ticket_url,
                    paymentId: paymentResult.id,
                    externalReference: paymentResult.external_reference // ← Guarda o external_reference
                });
                setShowPaymentModal(true);

                // Atualiza localmente com o paymentId
                setRegistrations(prev => prev.map(reg =>
                    reg.id === registration.id
                        ? { ...reg, paymentId: paymentResult.id }
                        : reg
                ));
            } else {
                console.error('❌ Erro no resultado do pagamento:', paymentResult);

                let errorMessage = 'Erro ao processar pagamento. Tente novamente.';
                if (paymentResult.error) {
                    errorMessage += ` Detalhes: ${paymentResult.error}`;
                    if (paymentResult.details) {
                        errorMessage += ` - ${paymentResult.details}`;
                    }
                }

                alert(errorMessage);
            }
        } catch (error: any) {
            console.error('❌ Erro no processo de pagamento:', {
                message: error.message,
                stack: error.stack
            });

            let errorMessage = 'Erro ao processar pagamento';
            if (error.message.includes('Network')) {
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Tempo limite excedido. Tente novamente.';
            }

            alert(errorMessage);
        } finally {
            setProcessingPayment(null);
        }
    };

    const checkPaymentStatus = async () => {
        console.log('Verificando status:', paymentData);

        if (!paymentData) {
            alert('Nenhum dado de pagamento disponível');
            return;
        }

        try {
            // Prepara os parâmetros de busca
            const params = new URLSearchParams();

            // Prioridade: external_reference > paymentId
            if (paymentData.externalReference) {
                params.append('externalReference', paymentData.externalReference);
                console.log('Usando external_reference para busca:', paymentData.externalReference);
            } else if (paymentData.paymentId) {
                params.append('paymentId', paymentData.paymentId);
                console.log('Usando paymentId para busca:', paymentData.paymentId);
            } else {
                throw new Error('Nenhum identificador de pagamento disponível');
            }

            params.append('registrationId', paymentData.registrationId);

            const res = await fetch(`/api/pix/status?${params.toString()}`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro HTTP: ${res.status}`);
            }

            const statusResult = await res.json();
            console.log('Status do pagamento:', statusResult);

            if (statusResult.status === 'approved') {
                await updatePaymentStatus(paymentData.registrationId, 'paid');

                setRegistrations(prev => prev.map(reg =>
                    reg.id === paymentData.registrationId
                        ? { ...reg, paymentStatus: 'paid' }
                        : reg
                ));

                alert('✅ Pagamento confirmado! Inscrição ativada.');
                setShowPaymentModal(false);
            } else {
                alert(`⚠️ Pagamento ainda não confirmado. Status: ${statusResult.status}. Tente novamente em alguns instantes.`);
            }
        } catch (error: any) {
            console.error('Erro ao verificar status:', error);
            alert(`Erro ao verificar status: ${error.message}`);
        }
    };

    const copyPixCode = () => {
        if (paymentData?.qrCode) {
            navigator.clipboard.writeText(paymentData.qrCode)
                .then(() => alert('Código PIX copiado!'))
                .catch(() => alert('Erro ao copiar código'));
        }
    };

    //Deletando e excluindo o pagamento PIX
    // Função para cancelar pagamento no Mercado Pago
    const cancelMercadoPagoPayment = async (paymentId: string, registrationId: string) => {
        try {
            const res = await fetch('/api/pix/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, registrationId }),
            });

            if (!res.ok) {
                throw new Error(`Erro HTTP: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error('Erro ao cancelar pagamento:', error);
            throw error;
        }
    };

    // Verifica se o PIX pode ser cancelado
    const canCancelPayment = (registration: RegistrationWithDetails) => {
        return registration.paymentId && registration.paymentStatus === 'pending';
    };


    // Modifique a função de exclusão
    const handleDeleteRegistration = async (registration: RegistrationWithDetails) => {
        const hasPayment = registration.paymentId && registration.paymentStatus === 'pending';

        const message = hasPayment
            ? 'Tem certeza que deseja excluir esta inscrição? O PIX será cancelado e esta ação não pode ser desfeita.'
            : 'Tem certeza que deseja excluir esta inscrição? Esta ação não pode ser desfeita.';

        if (!confirm(message)) {
            return;
        }

        setDeletingId(registration.id);
        try {
            // Se tiver PIX pendente, cancela primeiro
            if (hasPayment) {
                try {
                    const cancelResult = await cancelMercadoPagoPayment(
                        registration.paymentId!,
                        registration.id
                    );

                    if (!cancelResult.success) {
                        alert(`Atenção: ${cancelResult.message}. A inscrição será excluída mesmo assim.`);
                    }
                } catch (cancelError) {
                    console.warn('Não foi possível cancelar o PIX, continuando com exclusão...', cancelError);
                    alert('Não foi possível cancelar o PIX automaticamente. A inscrição será excluída mesmo assim.');
                }
            }

            // Depois exclui a inscrição
            const result = await deleteEventRegistration(registration.id, registration.eventId);

            if (result.success) {
                alert(hasPayment
                    ? 'Inscrição excluída e PIX cancelado com sucesso!'
                    : 'Inscrição excluída com sucesso!'
                );
                setRegistrations(prev => prev.filter(reg => reg.id !== registration.id));
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">Minhas Inscrições</h1>

                    {!userChurch && userData?.churchId && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                            <h2 className="font-semibold text-yellow-800 mb-1">Igreja não encontrada</h2>
                            <p className="text-yellow-700">
                                A igreja com ID {userData.churchId} não foi encontrada no sistema.
                            </p>
                        </div>
                    )}

                    {registrations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">Você ainda não se inscreveu em nenhum evento.</p>
                            <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                                Ver Eventos Disponíveis
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {registrations.map((registration) => (
                                <div key={registration.id} className="border rounded-lg p-4 hover:shadow-md transition">
                                    {/* Cabeçalho do evento */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                                                {registration.event?.title || `Evento #${registration.eventId}`}
                                            </h3>
                                            {registration.event && (
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Data:</span>
                                                        <span>{registration.event.date.toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Local:</span>
                                                        <span>{registration.event.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Valor:</span>
                                                        <span className="text-green-600 font-semibold">
                                                            R$ {registration.event.price?.toFixed(2) || '0,00'}
                                                        </span>
                                                    </div>
                                                    {registration.event.description && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-medium">Descrição:</span>
                                                            <span className="flex-1">{registration.event.description}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="self-start">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${registration.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                registration.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {registration.paymentStatus === 'paid' ? 'Pago' :
                                                    registration.paymentStatus === 'pending' ? 'Pendente' : 'Reembolsado'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Grid organizado com duas colunas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Coluna 1 - Dados da inscrição */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-gray-700 border-b pb-1 text-sm">Dados da Inscrição</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Nº Inscrição:</span>
                                                    <span className="text-gray-800">{registration.id.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Data:</span>
                                                    <span className="text-gray-800">{registration.createdAt.toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Status:</span>
                                                    <span className="text-gray-800">{registration.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coluna 2 - Dados pessoais */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-gray-700 border-b pb-1 text-sm">Dados Pessoais</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Nome:</span>
                                                    <span className="text-gray-800">{registration.userName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Email:</span>
                                                    <span className="text-gray-800">{registration.userEmail}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Telefone:</span>
                                                    <span className="text-gray-800">{registration.userPhone || 'Não informado'}</span>
                                                </div>
                                                {registration.userCpf && (
                                                    <div className="flex justify-between">
                                                        <span className="font-medium text-gray-600">CPF:</span>
                                                        <span className="text-gray-800">{registration.userCpf}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Igreja:</span>
                                                    <span className="text-gray-800">{registration.churchName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Pastor:</span>
                                                    <span className="text-gray-800">{registration.pastorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Área de ações */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {registration.paymentStatus === 'pending' && (
                                                <>
                                                    <button
                                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm disabled:opacity-50"
                                                        onClick={() => handlePayment(registration)}
                                                        disabled={processingPayment === registration.id}
                                                    >
                                                        {processingPayment === registration.id ? 'Processando...' : 'Realizar Pagamento'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRegistration(registration)}
                                                        disabled={deletingId === registration.id}
                                                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm disabled:opacity-50"
                                                    >
                                                        {deletingId === registration.id
                                                            ? 'Excluindo...'
                                                            : canCancelPayment(registration)
                                                                ? 'Cancelar e Excluir'
                                                                : 'Excluir Inscrição'
                                                        }
                                                    </button>
                                                </>
                                            )}
                                            {registration.paymentStatus === 'paid' && (
                                                <span className="text-green-600 text-sm font-medium">
                                                    ✅ Pagamento realizado - Entre em contato para cancelamento
                                                </span>
                                            )}
                                        </div>

                                        <Link
                                            href="/"
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
                                        >
                                            Ver mais eventos →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showPaymentModal && paymentData && (
                <PaymentModal
                    paymentData={paymentData}
                    onClose={() => setShowPaymentModal(false)}
                    onCopyPix={copyPixCode}
                    onCheckStatus={checkPaymentStatus}
                />
            )}
        </div>
    );
}