// app/admin/event-management/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EventRegistration, UserRole, EventWithRegistrations } from '@/types';
import Image from 'next/image';
import { getChurchNameById } from '@/lib/firebase/churches';
import EventReports from '@/components/Reports/EventReports';
import Charts from '@/components/Reports/Charts';
import EventBadge from '@/components/Events/EventBadge';

// ✅ Usar UserRole importado para definir as roles permitidas
const allowedRoles: UserRole[] = ['pastor', 'secretario_regional', 'secretario_local'];

export default function EventManagementPage() {

    const [userChurchName, setUserChurchName] = useState('');
    const [events, setEvents] = useState<EventWithRegistrations[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventWithRegistrations | null>(null);

    const [filteredRegistrations, setFilteredRegistrations] = useState<EventRegistration[]>([]);

    const [filters, setFilters] = useState({
        paymentStatus: 'all',
        churchName: '',
        pastorName: '',
        registrationStatus: 'all',
    });

    const [showBadgeModal, setShowBadgeModal] = useState<{
        event: EventWithRegistrations;
        registration: EventRegistration;
    } | null>(null);

    const [generatingPayment, setGeneratingPayment] = useState<string | null>(null);
    const [showPixModal, setShowPixModal] = useState<{
        registration: EventRegistration;
        pixData: any;
        event: EventWithRegistrations;
    } | null>(null);

    const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
    const { userData } = useAuth();

    //Exibição do Crachá
    const handleShowBadge = (registration: EventRegistration) => {
        if (selectedEvent) {
            setShowBadgeModal({
                event: selectedEvent,
                registration
            });
        }
    };

    // Carregar eventos e inscrições
    // Mapeamento das inscrições:
    const loadEventsWithRegistrations = useCallback(async () => {
        if (!userData || !allowedRoles.includes(userData.role)) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const eventsSnapshot = await getDocs(collection(db, 'events'));
            const eventsData: EventWithRegistrations[] = [];

            for (const eventDoc of eventsSnapshot.docs) {
                const eventData = eventDoc.data();

                const event: EventWithRegistrations = {
                    id: eventDoc.id,
                    title: eventData.title || 'Evento sem título',
                    description: eventData.description || '',
                    date: eventData.date?.toDate() || new Date(),
                    endDate: eventData.endDate?.toDate(),
                    location: eventData.location || '',
                    maxParticipants: Number(eventData.maxParticipants) || 0,
                    currentParticipants: Number(eventData.currentParticipants) || 0,
                    price: Number(eventData.price) || 0,
                    churchId: eventData.churchId || '',
                    churchName: eventData.churchName || '',
                    status: eventData.status || 'active',
                    createdAt: eventData.createdAt?.toDate() || new Date(),
                    updatedAt: eventData.updatedAt?.toDate() || new Date(),
                    imageURL: eventData.imageURL,
                    createdBy: eventData.createdBy,
                    registrations: [],
                    paidCount: 0,
                    pendingCount: 0
                };

                // Buscar inscrições para este evento
                let registrationsQuery;

                // ✅ FILTRO POR IGREJA: secretario_local só vê da própria igreja
                if (userData.role === 'secretario_local' && userData.churchId) {
                    registrationsQuery = query(
                        collection(db, 'registrations'),
                        where('eventId', '==', eventDoc.id),
                        where('userChurch', '==', userData.churchId)
                    );
                } else {
                    // ✅ secretario_regional e pastor veem todas as igrejas
                    registrationsQuery = query(
                        collection(db, 'registrations'),
                        where('eventId', '==', eventDoc.id)
                    );
                }

                const registrationsSnapshot = await getDocs(registrationsQuery);
                const registrations: EventRegistration[] = [];

                registrationsSnapshot.forEach((regDoc) => {
                    const regData = regDoc.data();
                    registrations.push({
                        id: regDoc.id,
                        eventId: regData.eventId,
                        userId: regData.userId,
                        userName: regData.userName,
                        userEmail: regData.userEmail,
                        userPhone: regData.userPhone,
                        userChurch: regData.userChurch,
                        churchName: regData.churchName,
                        pastorName: regData.pastorName,
                        status: regData.status,
                        paymentStatus: regData.paymentStatus,
                        paymentId: regData.paymentId || '',
                        paymentDate: regData.paymentDate?.toDate(),
                        createdAt: regData.createdAt.toDate(),
                        updatedAt: regData.updatedAt.toDate()
                    } as EventRegistration);
                });

                event.registrations = registrations;
                event.paidCount = registrations.filter(reg => reg.paymentStatus === 'paid').length;
                event.pendingCount = registrations.filter(reg => reg.paymentStatus === 'pending').length;

                eventsData.push(event);
            }

            setEvents(eventsData);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        } finally {
            setLoading(false);
        }
    }, [userData?.role, userData?.uid, userData?.churchId]);

    // ✅ useEffect com dependências corretas
    useEffect(() => {
        loadEventsWithRegistrations();
    }, [loadEventsWithRegistrations]);

    // ✅ useEffect para buscar o nome da igreja
    useEffect(() => {
        const fetchChurchName = async () => {
            if (userData?.churchId) {
                try {
                    const name = await getChurchNameById(userData.churchId);
                    setUserChurchName(name);
                } catch (error) {
                    console.error('Erro ao buscar nome da igreja:', error);
                    setUserChurchName(userData.churchId);
                }
            }
        };

        fetchChurchName();
    }, [userData?.churchId]);


    // Função para atualização otimista do status
    const updateRegistrationStatus = (registrationId: string, newStatus: 'approved' | 'rejected', rejectionReason?: string) => {
        setEvents(prevEvents =>
            prevEvents.map(event => {
                if (event.id === selectedEvent?.id) {
                    const updatedRegistrations = event.registrations.map(reg =>
                        reg.id === registrationId
                            ? {
                                ...reg,
                                status: newStatus,
                                ...(rejectionReason && { rejectionReason })
                            }
                            : reg
                    );

                    return {
                        ...event,
                        registrations: updatedRegistrations
                    };
                }
                return event;
            })
        );

        setFilteredRegistrations(prev =>
            prev.map(reg =>
                reg.id === registrationId
                    ? {
                        ...reg,
                        status: newStatus,
                        ...(rejectionReason && { rejectionReason })
                    }
                    : reg
            )
        );
    };

    const handleGeneratePixPayment = async (registration: EventRegistration) => {
        // Verificar se já existe um pagamento gerado
        if (registration.paymentId) {
            // Buscar dados do pagamento existente usando sua API
            try {
                const response = await fetch(`/api/pix/status?paymentId=${registration.paymentId}&registrationId=${registration.id}`);

                if (response.ok) {
                    const statusData = await response.json();

                    // Buscar dados completos do PIX (precisamos do QR code)
                    const pixResponse = await fetch(`/api/pix/get-payment?paymentId=${registration.paymentId}`);

                    if (pixResponse.ok) {
                        const pixData = await pixResponse.json();
                        setShowPixModal({
                            registration,
                            pixData,
                            event: selectedEvent!
                        });
                    } else {
                        // Se não conseguir os dados completos, mostrar mensagem
                        alert('Pagamento encontrado, mas não foi possível carregar os dados do PIX.');
                    }
                } else {
                    // Se não conseguir verificar status, gerar novo
                    await generateNewPixPayment(registration);
                }
            } catch (error) {
                console.error('Erro ao buscar pagamento:', error);
                await generateNewPixPayment(registration);
            }
        } else {
            // Gerar novo pagamento
            await generateNewPixPayment(registration);
        }
    };

    const generateNewPixPayment = async (registration: EventRegistration) => {
        setGeneratingPayment(registration.id);

        try {
            // Buscar dados do idoso diretamente do Firestore
            const seniorDocRef = doc(db, 'seniors', registration.userId);
            const seniorDoc = await getDoc(seniorDocRef);

            if (!seniorDoc.exists()) {
                alert('Dados do idoso não encontrados');
                return;
            }

            const seniorData = seniorDoc.data();

            // ✅ VALIDAÇÃO CRÍTICA: Usar email do idoso como fallback
            const userEmail = registration.userEmail || seniorData.email;
            if (!userEmail) {
                alert('Email do usuário não encontrado. Por favor, verifique o cadastro do idoso.');
                return;
            }

            // ✅ Formatar o CPF (remover caracteres não numéricos)
            const formattedCpf = seniorData.cpf ? seniorData.cpf.replace(/\D/g, '') : '00000000000';

            const paymentData = {
                transaction_amount: selectedEvent?.price || 0,
                description: `Inscrição: ${selectedEvent?.title} - ${registration.userName}`,
                payer: {
                    email: userEmail,
                    first_name: registration.userName.split(' ')[0],
                    last_name: registration.userName.split(' ').slice(1).join(' '),
                    identification: {
                        type: 'CPF',
                        number: formattedCpf
                    }
                },
                metadata: {
                    registrationId: registration.id,
                    eventId: registration.eventId,
                    seniorId: registration.userId,
                    eventTitle: selectedEvent?.title,
                    userName: registration.userName
                },
                additional_info: {
                    items: [
                        {
                            id: registration.eventId,
                            title: selectedEvent?.title || 'Evento',
                            description: selectedEvent?.description || '',
                            category_id: 'events',
                            quantity: 1,
                            unit_price: selectedEvent?.price || 0
                        }
                    ],
                    payer: {
                        first_name: registration.userName.split(' ')[0],
                        last_name: registration.userName.split(' ').slice(1).join(' ')
                    }
                }
            };

            console.log('Enviando para API PIX:', paymentData);

            const response = await fetch('/api/pix/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });

            if (response.ok) {
                const pixData = await response.json();

                // Atualizar a inscrição com o ID do pagamento
                const registrationRef = doc(db, 'registrations', registration.id);
                await updateDoc(registrationRef, {
                    paymentId: pixData.id,
                    updatedAt: new Date()
                });

                // Atualizar o estado local
                updateRegistrationWithPayment(registration.id, pixData.id);

                setShowPixModal({
                    registration: {
                        ...registration,
                        paymentId: pixData.id
                    },
                    pixData,
                    event: selectedEvent!
                });

            } else {
                const errorData = await response.json();
                alert(`Erro ao gerar PIX: ${errorData.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Erro ao gerar PIX:', error);
            alert('Erro ao gerar PIX');
        } finally {
            setGeneratingPayment(null);
        }
    };

    // Função para atualizar o estado local com o paymentId
    const updateRegistrationWithPayment = (registrationId: string, paymentId: string) => {
        setEvents(prevEvents =>
            prevEvents.map(event => {
                if (event.id === selectedEvent?.id) {
                    const updatedRegistrations = event.registrations.map(reg =>
                        reg.id === registrationId
                            ? { ...reg, paymentId }
                            : reg
                    );
                    return { ...event, registrations: updatedRegistrations };
                }
                return event;
            })
        );

        setFilteredRegistrations(prev =>
            prev.map(reg =>
                reg.id === registrationId
                    ? { ...reg, paymentId }
                    : reg
            )
        );
    };

    // Adicione estas funções para aprovação/rejeição
    const handleApproveRegistration = async (registrationId: string) => {
        setApprovalLoading(registrationId);
        try {
            // Atualização otimista
            updateRegistrationStatus(registrationId, 'approved');

            const registrationRef = doc(db, 'registrations', registrationId);
            await updateDoc(registrationRef, {
                status: 'approved',
                approvedBy: userData?.uid,
                approvedAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Inscrição aprovada com sucesso');

        } catch (error) {
            console.error('❌ Erro ao aprovar inscrição:', error);
            alert('Erro ao aprovar inscrição');

            // Reverte em caso de erro
            loadEventsWithRegistrations();
        } finally {
            setApprovalLoading(null);
        }
    };

    const handleRejectRegistration = async (registrationId: string, reason: string) => {
        if (!reason.trim()) {
            alert('Por favor, informe o motivo da rejeição');
            return;
        }

        setApprovalLoading(registrationId);
        try {
            // Atualização otimista
            updateRegistrationStatus(registrationId, 'rejected', reason);

            const registrationRef = doc(db, 'registrations', registrationId);
            await updateDoc(registrationRef, {
                status: 'rejected',
                rejectedBy: userData?.uid,
                rejectionReason: reason,
                updatedAt: new Date()
            });

            console.log('✅ Inscrição rejeitada com sucesso');

        } catch (error) {
            console.error('❌ Erro ao rejeitar inscrição:', error);
            alert('Erro ao rejeitar inscrição');

            // Reverte em caso de erro
            loadEventsWithRegistrations();
        } finally {
            setApprovalLoading(null);
        }
    };

    // ✅ Verificar permissões - Corrigido
    useEffect(() => {
        if (userData && !allowedRoles.includes(userData.role)) {
            window.location.href = '/';
        }
    }, [userData?.role]);

    // Aplicar filtros
    useEffect(() => {
        if (selectedEvent) {
            let filtered = selectedEvent.registrations;

            // ✅ Para secretários locais, já estamos filtrando por igreja na query
            // então não precisamos filtrar novamente por igreja aqui
            if (filters.paymentStatus !== 'all') {
                filtered = filtered.filter(reg => reg.paymentStatus === filters.paymentStatus);
            }

            if (filters.registrationStatus !== 'all') {
                filtered = filtered.filter(reg => reg.status === filters.registrationStatus);
            }

            if (filters.churchName && userData?.role !== 'secretario_local') {
                filtered = filtered.filter(reg =>
                    reg.churchName.toLowerCase().includes(filters.churchName.toLowerCase())
                );
            }

            if (filters.pastorName) {
                filtered = filtered.filter(reg =>
                    reg.pastorName.toLowerCase().includes(filters.pastorName.toLowerCase())
                );
            }

            setFilteredRegistrations(filtered);
        }
    }, [selectedEvent, filters, userData?.role]);

    // Adicione esta função para calcular estatísticas
    const getStatusStats = () => {
        if (!selectedEvent) return { pending: 0, approved: 0, rejected: 0 };

        return {
            pending: selectedEvent.registrations.filter(reg => reg.status === 'pending').length,
            approved: selectedEvent.registrations.filter(reg => reg.status === 'approved').length,
            rejected: selectedEvent.registrations.filter(reg => reg.status === 'rejected').length
        };
    };

    const handleEventSelect = (event: EventWithRegistrations) => {
        setSelectedEvent(event);
        setFilteredRegistrations(event.registrations);
        setFilters({
            paymentStatus: 'all',
            churchName: '',
            pastorName: '',
            registrationStatus: 'all'
        });
    };

    const handleExportCSV = () => {
        if (!selectedEvent) return;

        const headers = ['Nome', 'Email', 'Telefone', 'Igreja', 'Pastor', 'Status Pagamento', 'Data Inscrição'];
        const csvData = filteredRegistrations.map(reg => [
            reg.userName,
            reg.userEmail,
            reg.userPhone,
            reg.churchName,
            reg.pastorName,
            reg.paymentStatus === 'paid' ? 'Pago' : 'Pendente',
            reg.createdAt.toLocaleDateString('pt-BR')
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `inscritos-${selectedEvent.title}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ✅ Renderização condicional - Corrigida
    if (!userData || !allowedRoles.includes(userData.role)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Acesso Negado</h2>
                    <p>Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Inscrições em Eventos</h1>

                    {/* ✅ Cabeçalho com nome da igreja */}
                    {userData?.role === 'secretario_local' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-blue-800 text-sm">
                                <strong>Modo Secretário Local:</strong> Visualizando apenas inscrições da sua igreja ({userChurchName || userData.churchId})
                            </p>
                        </div>
                    )}

                    {userData?.role === 'secretario_regional' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <p className="text-green-800 text-sm">
                                <strong>Modo Secretário Regional:</strong> Visualizando inscrições de todas as igrejas
                            </p>
                        </div>
                    )}

                    {userData?.role === 'pastor' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                            <p className="text-purple-800 text-sm">
                                <strong>Modo Pastor:</strong> Visualizando inscrições de todas as igrejas
                            </p>
                        </div>
                    )}

                    {!selectedEvent ? (
                        // Lista de eventos (mantido igual)
                        <div className="grid gap-4">
                            <h2 className="text-xl font-semibold mb-4">Selecione um Evento</h2>
                            {events.length === 0 ? (
                                <p className="text-gray-500">Nenhum evento encontrado.</p>
                            ) : (
                                events.map(event => (
                                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                                        <div onClick={() => handleEventSelect(event)}>
                                            <h3 className="font-semibold text-lg">{event.title}</h3>
                                            <p className="text-gray-600">{event.date.toLocaleDateString('pt-BR')}</p>
                                            <p className="text-gray-600">{event.location}</p>
                                            <div className="flex gap-4 mt-2">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                                    {event.paidCount} pagos
                                                </span>
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                                                    {event.pendingCount} pendentes
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                    {event.registrations.length} total
                                                </span>
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                                                    {event.currentParticipants}/{event.maxParticipants} vagas
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Detalhes do evento selecionado
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                                    <p className="text-gray-600">{selectedEvent.date.toLocaleDateString('pt-BR')}</p>
                                    <p className="text-gray-600">{selectedEvent.location}</p>
                                    <p className="text-gray-600">Preço: R$ {selectedEvent.price.toFixed(2)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={loadEventsWithRegistrations}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        🔄 Atualizar
                                    </button>
                                </div>
                            </div>

                            {/* Filtros (mantido igual) */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <h3 className="font-semibold mb-3">Filtros</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status Pagamento</label>
                                        <select
                                            value={filters.paymentStatus}
                                            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="all">Todos</option>
                                            <option value="paid">Pagos</option>
                                            <option value="pending">Pendentes</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status Inscrição</label>
                                        <select
                                            value={filters.registrationStatus}
                                            onChange={(e) => setFilters({ ...filters, registrationStatus: e.target.value })}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="all">Todos</option>
                                            <option value="pending">Pendentes</option>
                                            <option value="approved">Aprovados</option>
                                            <option value="rejected">Rejeitados</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Igreja</label>
                                        {userData?.role === 'secretario_local' ? (
                                            <input
                                                type="text"
                                                value={userData.churchName || 'Minha Igreja'}
                                                disabled
                                                className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="Filtrar por igreja..."
                                                value={filters.churchName}
                                                onChange={(e) => setFilters({ ...filters, churchName: e.target.value })}
                                                className="w-full p-2 border rounded"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pastor</label>
                                        <input
                                            type="text"
                                            placeholder="Filtrar por pastor..."
                                            value={filters.pastorName}
                                            onChange={(e) => setFilters({ ...filters, pastorName: e.target.value })}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <EventReports events={events} selectedEvent={selectedEvent} />

                            {/* Estatísticas (mantido igual) */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-800">{selectedEvent.paidCount}</div>
                                    <div className="text-green-600">Pagas</div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-800">{selectedEvent.pendingCount}</div>
                                    <div className="text-yellow-600">Pendentes Pag.</div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-800">{getStatusStats().approved}</div>
                                    <div className="text-blue-600">Aprovadas</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-orange-800">{getStatusStats().pending}</div>
                                    <div className="text-orange-600">Pendentes Aprov.</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-800">{getStatusStats().rejected}</div>
                                    <div className="text-red-600">Rejeitadas</div>
                                </div>
                            </div>

                            {selectedEvent && (
                                <Charts event={selectedEvent} />
                            )}

                            {/* Botão Exportar (mantido igual) */}
                            <div className="mb-6">
                                <button
                                    onClick={handleExportCSV}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Exportar CSV
                                </button>
                            </div>

                            {/* Lista de inscritos - VERSÃO RESPONSIVA */}
                            <div>
                                <h3 className="font-semibold mb-4">
                                    Inscritos ({filteredRegistrations.length})
                                </h3>

                                {filteredRegistrations.length === 0 ? (
                                    <p className="text-gray-500">Nenhum inscrito encontrado com os filtros aplicados.</p>
                                ) : (
                                    <div>
                                        {/* Vista Desktop - Tabela completa */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-300">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-300 p-2 text-left">Nome</th>
                                                        <th className="border border-gray-300 p-2 text-left">Email</th>
                                                        <th className="border border-gray-300 p-2 text-left">Telefone</th>
                                                        {(userData?.role === 'secretario_regional' || userData?.role === 'pastor') && (
                                                            <th className="border border-gray-300 p-2 text-left">Igreja</th>
                                                        )}
                                                        <th className="border border-gray-300 p-2 text-left">Pastor</th>
                                                        <th className="border border-gray-300 p-2 text-left">Status Inscrição</th>
                                                        <th className="border border-gray-300 p-2 text-left">Status de Pagamento</th>
                                                        <th className="border border-gray-300 p-2 text-left">Data Inscrição</th>
                                                        <th className="border border-gray-300 p-2 text-left">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRegistrations.map(registration => (
                                                        <tr key={registration.id} className="hover:bg-gray-50">
                                                            <td className="border border-gray-300 p-2">{registration.userName}</td>
                                                            <td className="border border-gray-300 p-2">{registration.userEmail}</td>
                                                            <td className="border border-gray-300 p-2">{registration.userPhone}</td>
                                                            {(userData?.role === 'secretario_regional' || userData?.role === 'pastor') && (
                                                                <td className="border border-gray-300 p-2">{registration.churchName}</td>
                                                            )}
                                                            <td className="border border-gray-300 p-2">{registration.pastorName}</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span className={`px-2 py-1 rounded text-xs ${registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                    registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {registration.status === 'approved' ? 'Aprovado' :
                                                                        registration.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                                                </span>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span className={`px-2 py-1 rounded text-xs ${registration.paymentStatus === 'paid'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : registration.paymentStatus === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {registration.paymentStatus === 'paid' ? 'Pago' :
                                                                        registration.paymentStatus === 'pending' ? 'Pendente' : 'Reembolsado'}
                                                                </span>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {registration.createdAt.toLocaleDateString('pt-BR')}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">

                                                                {registration.status === 'pending' && (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleApproveRegistration(registration.id)}
                                                                            disabled={approvalLoading === registration.id}
                                                                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                                                        >
                                                                            {approvalLoading === registration.id ? '...' : '✅ Aprovar'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const reason = prompt('Motivo da rejeição:');
                                                                                if (reason) handleRejectRegistration(registration.id, reason);
                                                                            }}
                                                                            disabled={approvalLoading === registration.id}
                                                                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                                                                        >
                                                                            {approvalLoading === registration.id ? '...' : '❌ Rejeitar'}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {registration.status === 'approved' && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-green-600 text-sm">✓ Aprovado</span>
                                                                        {registration.paymentStatus === 'paid' && (

                                                                            <span className="text-green-600 text-sm">✅ Pago</span>
                                                                        )}
                                                                        {registration.paymentStatus === 'pending' && (
                                                                            <button
                                                                                onClick={() => handleGeneratePixPayment(registration)}
                                                                                disabled={generatingPayment === registration.id}
                                                                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50 mt-1"
                                                                            >
                                                                                {generatingPayment === registration.id
                                                                                    ? 'Gerando PIX...'
                                                                                    : registration.paymentId && registration.paymentId !== ''
                                                                                        ? '🔍 Ver PIX'
                                                                                        : '💰 Gerar PIX'
                                                                                }
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {registration.status === 'rejected' && (
                                                                    <div>
                                                                        <span className="text-red-600 text-sm">✗ Rejeitado</span>
                                                                        {registration.rejectionReason && (
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                Motivo: {registration.rejectionReason}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <button
                                                                    onClick={() => handleShowBadge(registration)}
                                                                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 mt-1"
                                                                    title="Imprimir crachá"
                                                                >
                                                                    🎫 Crachá
                                                                </button>

                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Vista Mobile - Cards */}
                                        <div className="md:hidden space-y-4">
                                            {filteredRegistrations.map(registration => (
                                                <div key={registration.id} className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Nome</p>
                                                            <p className="font-semibold">{registration.userName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Telefone</p>
                                                            <p className="font-semibold">{registration.userPhone}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Email</p>
                                                            <p className="font-semibold text-sm">{registration.userEmail || 'Não informado'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Data</p>
                                                            <p className="font-semibold">{registration.createdAt.toLocaleDateString('pt-BR')}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        {(userData?.role === 'secretario_regional' || userData?.role === 'pastor') && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">Igreja</p>
                                                                <p className="font-semibold text-sm">{registration.churchName}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Pastor</p>
                                                            <p className="font-semibold text-sm">{registration.pastorName}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Status Inscrição</p>
                                                            <span className={`px-2 py-1 rounded text-xs ${registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                {registration.status === 'approved' ? 'Aprovado' :
                                                                    registration.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Status Pagamento</p>
                                                            <span className={`px-2 py-1 rounded text-xs ${registration.paymentStatus === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : registration.paymentStatus === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {registration.paymentStatus === 'paid' ? 'Pago' :
                                                                    registration.paymentStatus === 'pending' ? 'Pendente' : 'Reembolsado'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ações */}
                                                    <div className="border-t pt-3">
                                                        {registration.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleApproveRegistration(registration.id)}
                                                                    disabled={approvalLoading === registration.id}
                                                                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                                                                >
                                                                    {approvalLoading === registration.id ? '...' : '✅ Aprovar'}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const reason = prompt('Motivo da rejeição:');
                                                                        if (reason) handleRejectRegistration(registration.id, reason);
                                                                    }}
                                                                    disabled={approvalLoading === registration.id}
                                                                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                                                                >
                                                                    {approvalLoading === registration.id ? '...' : '❌ Rejeitar'}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {registration.status === 'approved' || registration.paymentStatus === 'paid' && (
                                                            <button
                                                                onClick={() => handleShowBadge(registration)}
                                                                className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 mt-2"
                                                            >
                                                                🎫 Gerar Crachá
                                                            </button>
                                                        )}

                                                        {registration.status === 'rejected' && (
                                                            <div>
                                                                <div className="text-center text-red-600 text-sm">✗ Rejeitado</div>
                                                                {registration.rejectionReason && (
                                                                    <div className="text-xs text-gray-500 mt-1 text-center">
                                                                        Motivo: {registration.rejectionReason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => handleShowBadge(registration)}
                                                            className="w-full m-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                                                        >
                                                            🎫 Gerar Crachá
                                                        </button>

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showPixModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-4 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-3 text-center">
                            PIX para {showPixModal.registration.userName}
                        </h3>

                        <div className="text-center mb-3">
                            {showPixModal.pixData.qr_code_base64 ? (
                                <Image
                                    src={`data:image/png;base64,${showPixModal.pixData.qr_code_base64}`}
                                    alt="QR Code PIX"
                                    width={160}
                                    height={160}
                                    className="mx-auto mb-3"
                                />
                            ) : (
                                <Image
                                    src={showPixModal.pixData.qr_code}
                                    alt="QR Code PIX"
                                    width={160}
                                    height={160}
                                    className="mx-auto mb-3"
                                />
                            )}

                            <p className="text-xl font-bold text-green-600 mb-2">
                                R$ {showPixModal.event.price.toFixed(2)}
                            </p>

                            <p className="text-xs text-gray-600 mb-3">
                                Escaneie o QR Code ou copie o código PIX
                            </p>
                        </div>

                        <div className="bg-gray-100 p-2 rounded-lg mb-3">
                            <p className="text-xs text-gray-500 mb-1">Código PIX:</p>
                            <div className="relative">
                                <p className="text-xs font-mono break-all overflow-hidden max-h-[60px] overflow-y-auto">
                                    {showPixModal.pixData.qr_code}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(showPixModal.pixData.qr_code);
                                        alert('Código PIX copiado!');
                                    }}
                                    className="text-blue-600 text-xs mt-1"
                                >
                                    📋 Copiar código
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(showPixModal.pixData.qr_code);
                                    alert('Código PIX copiado!');
                                }}
                                className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                            >
                                📋 Copiar PIX
                            </button>

                            <a
                                href={showPixModal.pixData.ticket_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-blue-700"
                            >
                                🔗 Ver comprovante
                            </a>
                        </div>

                        <button
                            onClick={() => {
                                loadEventsWithRegistrations();
                                setShowPixModal(null);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm w-full hover:bg-green-700 mb-2"
                        >
                            ✅ Pagamento realizado
                        </button>

                        <button
                            onClick={() => setShowPixModal(null)}
                            className="text-gray-500 text-sm w-full hover:text-gray-700"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {showBadgeModal && (
                <EventBadge
                    event={showBadgeModal.event}
                    registration={showBadgeModal.registration}
                    onClose={() => setShowBadgeModal(null)}
                />
            )}

        </div>

    );
}