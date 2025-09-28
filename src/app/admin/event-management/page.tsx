'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EventRegistration, UserRole, EventWithRegistrations } from '@/types';
import Image from 'next/image';
import { getChurchNameById } from '@/lib/firebase/churches';
import EventReports from '@/components/Reports/EventReports';
import Charts from '@/components/Reports/Charts';
import EventBadge from '@/components/events/EventBadge';

const allowedRoles: UserRole[] = ['pastor', 'secretario_regional', 'secretario_local'];

export default function EventManagementPage() {
    const { userData } = useAuth();
    const [userChurchName, setUserChurchName] = useState('');
    const [events, setEvents] = useState<EventWithRegistrations[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventWithRegistrations | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active');
    const [selectedEventTab, setSelectedEventTab] = useState<'registrations' | 'statistics' | 'reports'>('registrations');

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

    const handleShowBadge = (registration: EventRegistration) => {
        if (selectedEvent) {
            setShowBadgeModal({
                event: selectedEvent,
                registration
            });
        }
    };

    const loadEventsWithRegistrations = useCallback(async () => {
        if (!userData || !allowedRoles.includes(userData.role)) {
            setLoading(false);
            return;
        }

        try {
            const eventsRef = collection(db, 'events');
            const eventsSnapshot = await getDocs(eventsRef);

            const eventsWithRegistrations: EventWithRegistrations[] = [];

            for (const eventDoc of eventsSnapshot.docs) {
                const eventData = eventDoc.data();

                let registrationsQuery;

                if (userData.role === 'secretario_local') {
                    registrationsQuery = query(
                        collection(db, 'registrations'),
                        where('eventId', '==', eventDoc.id),
                        where('userChurch', '==', userData.churchId)
                    );
                } else {
                    registrationsQuery = query(
                        collection(db, 'registrations'),
                        where('eventId', '==', eventDoc.id)
                    );
                }

                const registrationsSnapshot = await getDocs(registrationsQuery);
                const registrations: EventRegistration[] = [];

                for (const regDoc of registrationsSnapshot.docs) {
                    const regData = regDoc.data();

                    // Usar o churchName que já vem dos dados ou buscar pelo ID se necessário
                    let churchName = regData.churchName || 'N/A';
                    if (!regData.churchName && regData.userChurch) {
                        try {
                            churchName = await getChurchNameById(regData.userChurch);
                        } catch (error) {
                            console.error('Erro ao buscar nome da igreja:', error);
                        }
                    }

                    registrations.push({
                        id: regDoc.id,
                        eventId: regData.eventId,
                        userId: regData.userId,
                        userName: regData.userName,
                        userEmail: regData.userEmail,
                        userPhone: regData.userPhone,
                        userChurch: regData.userChurch,
                        churchName: churchName,
                        pastorName: regData.pastorName,
                        userCpf: regData.userCpf || '',
                        status: regData.status,
                        paymentStatus: regData.paymentStatus,
                        paymentId: regData.paymentId || '',
                        paymentDate: regData.paymentDate?.toDate(),
                        approvedBy: regData.approvedBy,
                        approvedAt: regData.approvedAt?.toDate(),
                        rejectionReason: regData.rejectionReason,
                        rejectedBy: regData.rejectedBy,
                        createdAt: regData.createdAt?.toDate() || new Date(),
                        updatedAt: regData.updatedAt?.toDate() || new Date(),
                    } as EventRegistration);
                }

                const paidCount = registrations.filter(reg => reg.paymentStatus === 'paid').length;
                const pendingCount = registrations.filter(reg => reg.paymentStatus === 'pending').length;
                const currentParticipants = registrations.filter(reg => reg.status === 'approved').length;

                eventsWithRegistrations.push({
                    id: eventDoc.id,
                    ...eventData,
                    date: eventData.date?.toDate() || new Date(),
                    registrations,
                    paidCount,
                    pendingCount,
                    currentParticipants,
                } as EventWithRegistrations);
            }

            setEvents(eventsWithRegistrations);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        } finally {
            setLoading(false);
        }
    }, [userData?.role, userData?.uid, userData?.churchId]);

    useEffect(() => {
        loadEventsWithRegistrations();
    }, [loadEventsWithRegistrations]);

    useEffect(() => {
        const loadUserChurchName = async () => {
            if (userData?.churchId) {
                try {
                    const churchName = await getChurchNameById(userData.churchId);
                    setUserChurchName(churchName);
                } catch (error) {
                    console.error('Erro ao carregar nome da igreja:', error);
                }
            }
        };

        loadUserChurchName();
    }, [userData?.churchId]);

    const updateRegistrationStatus = (registrationId: string, newStatus: 'approved' | 'rejected', rejectionReason?: string) => {
        setEvents(prevEvents =>
            prevEvents.map(event => ({
                ...event,
                registrations: event.registrations.map(reg =>
                    reg.id === registrationId
                        ? {
                            ...reg,
                            status: newStatus,
                            rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined
                        }
                        : reg
                )
            }))
        );

        if (selectedEvent) {
            setSelectedEvent(prevEvent => ({
                ...prevEvent!,
                registrations: prevEvent!.registrations.map(reg =>
                    reg.id === registrationId
                        ? {
                            ...reg,
                            status: newStatus,
                            rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined
                        }
                        : reg
                )
            }));
        }
    };

    const handleGeneratePixPayment = async (registration: EventRegistration) => {
        if (!selectedEvent) return;

        if (registration.paymentId && registration.paymentId !== '') {
            try {
                const response = await fetch('/api/payments/get-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentId: registration.paymentId
                    }),
                });

                if (response.ok) {
                    const pixData = await response.json();
                    setShowPixModal({
                        registration,
                        pixData,
                        event: selectedEvent
                    });
                } else {
                    console.error('Erro ao buscar dados do PIX');
                }
            } catch (error) {
                console.error('Erro ao buscar PIX:', error);
            }
        } else {
            await generateNewPixPayment(registration);
        }
    };

    const generateNewPixPayment = async (registration: EventRegistration) => {
        if (!selectedEvent) return;

        setGeneratingPayment(registration.id);

        try {
            const response = await fetch('/api/payments/create-pix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: selectedEvent.price,
                    description: `Inscrição para ${selectedEvent.title}`,
                    payerName: registration.userName,
                    payerEmail: registration.userEmail,
                    payerDocument: registration.userDocument || '',
                    eventId: selectedEvent.id,
                    registrationId: registration.id,
                }),
            });

            if (response.ok) {
                const pixData = await response.json();

                updateRegistrationWithPayment(registration.id, pixData.id);

                setShowPixModal({
                    registration: {
                        ...registration,
                        paymentId: pixData.id
                    },
                    pixData,
                    event: selectedEvent
                });
            } else {
                const errorData = await response.json();
                console.error('Erro ao gerar PIX:', errorData);
                alert('Erro ao gerar PIX. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao gerar PIX:', error);
            alert('Erro ao gerar PIX. Tente novamente.');
        } finally {
            setGeneratingPayment(null);
        }
    };

    const updateRegistrationWithPayment = (registrationId: string, paymentId: string) => {
        setEvents(prevEvents =>
            prevEvents.map(event => ({
                ...event,
                registrations: event.registrations.map(reg =>
                    reg.id === registrationId
                        ? { ...reg, paymentId }
                        : reg
                )
            }))
        );

        if (selectedEvent) {
            setSelectedEvent(prevEvent => ({
                ...prevEvent!,
                registrations: prevEvent!.registrations.map(reg =>
                    reg.id === registrationId
                        ? { ...reg, paymentId }
                        : reg
                )
            }));
        }
    };

    const handleApproveRegistration = async (registrationId: string) => {
        setApprovalLoading(registrationId);

        try {
            const registrationRef = doc(db, 'eventRegistrations', registrationId);
            await updateDoc(registrationRef, {
                status: 'approved'
            });

            updateRegistrationStatus(registrationId, 'approved');
        } catch (error) {
            console.error('Erro ao aprovar inscrição:', error);
            alert('Erro ao aprovar inscrição. Tente novamente.');
        } finally {
            setApprovalLoading(null);
        }
    };

    const handleRejectRegistration = async (registrationId: string, reason: string) => {
        setApprovalLoading(registrationId);

        try {
            const registrationRef = doc(db, 'eventRegistrations', registrationId);
            await updateDoc(registrationRef, {
                status: 'rejected',
                rejectionReason: reason
            });

            updateRegistrationStatus(registrationId, 'rejected', reason);
        } catch (error) {
            console.error('Erro ao rejeitar inscrição:', error);
            alert('Erro ao rejeitar inscrição. Tente novamente.');
        } finally {
            setApprovalLoading(null);
        }
    };

    useEffect(() => {
        if (!userData || !allowedRoles.includes(userData.role)) {
            return;
        }
    }, [userData?.role]);

    useEffect(() => {
        if (!selectedEvent) {
            setFilteredRegistrations([]);
            return;
        }

        let filtered = selectedEvent.registrations;

        if (filters.paymentStatus !== 'all') {
            filtered = filtered.filter(reg => reg.paymentStatus === filters.paymentStatus);
        }

        if (filters.registrationStatus !== 'all') {
            filtered = filtered.filter(reg => reg.status === filters.registrationStatus);
        }

        if (filters.churchName) {
            filtered = filtered.filter(reg =>
                reg.churchName?.toLowerCase().includes(filters.churchName.toLowerCase())
            );
        }

        if (filters.pastorName) {
            filtered = filtered.filter(reg =>
                reg.pastorName?.toLowerCase().includes(filters.pastorName.toLowerCase())
            );
        }

        setFilteredRegistrations(filtered);
    }, [selectedEvent, filters, userData?.role]);

    const getStatusStats = () => {
        if (!selectedEvent) return { approved: 0, pending: 0, rejected: 0 };

        const approved = selectedEvent.registrations.filter(reg => reg.status === 'approved').length;
        const pending = selectedEvent.registrations.filter(reg => reg.status === 'pending').length;
        const rejected = selectedEvent.registrations.filter(reg => reg.status === 'rejected').length;

        return { approved, pending, rejected };
    };

    const handleEventSelect = (event: EventWithRegistrations) => {
        setSelectedEvent(event);
        setSelectedEventTab('registrations');
        setFilters({
            paymentStatus: 'all',
            churchName: '',
            pastorName: '',
            registrationStatus: 'all',
        });
    };

    const clearFilters = () => {
        setFilters({
            paymentStatus: 'all',
            churchName: '',
            pastorName: '',
            registrationStatus: 'all',
        });
    };

    const handleExportCSV = () => {
        if (!selectedEvent) return;

        const csvData = filteredRegistrations.map(reg => ({
            Nome: reg.userName,
            Email: reg.userEmail,
            Telefone: reg.userPhone || 'N/A',
            Igreja: reg.churchName || 'N/A',
            Pastor: reg.pastorName || 'N/A',
            Status: reg.status === 'approved' ? 'Aprovado' :
                reg.status === 'pending' ? 'Pendente' : 'Rejeitado',
            Pagamento: reg.paymentStatus === 'paid' ? 'Pago' : 'Pendente',
            'Data de Inscrição': reg.createdAt.toLocaleDateString('pt-BR')
        }));

        const csvContent = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inscricoes_${selectedEvent.title.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!userData || !allowedRoles.includes(userData.role)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Acesso Negado</h1>
                    <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Inscrições em Eventos</h1>

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
                        <div>
                            <div className="mb-6">
                                <div className="flex border-b">
                                    <button
                                        onClick={() => setActiveTab('active')}
                                        className={`px-4 py-2 font-medium ${activeTab === 'active'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Eventos Ativos ({events.filter(event => event.status === 'active').length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('ended')}
                                        className={`px-4 py-2 font-medium ${activeTab === 'ended'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Eventos Encerrados ({events.filter(event => event.status === 'ended').length})
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <h2 className="text-xl font-semibold mb-4">
                                    {activeTab === 'active' ? 'Eventos Ativos' : 'Eventos Encerrados'}
                                </h2>
                                {events.filter(event => event.status === activeTab).length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">
                                            {activeTab === 'active'
                                                ? 'Nenhum evento ativo no momento.'
                                                : 'Nenhum evento encerrado.'
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    events.filter(event => event.status === activeTab).map(event => (
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
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                                    <p className="text-gray-600">{selectedEvent.date.toLocaleDateString('pt-BR')}</p>
                                    <p className="text-gray-600">{selectedEvent.location}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    ← Voltar
                                </button>
                            </div>

                            {/* Abas do evento selecionado */}
                            <div className="mb-6">
                                <div className="flex border-b">
                                    <button
                                        onClick={() => setSelectedEventTab('registrations')}
                                        className={`px-4 py-2 font-medium ${selectedEventTab === 'registrations'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        📋 Inscrições ({selectedEvent.registrations.length})
                                    </button>
                                    <button
                                        onClick={() => setSelectedEventTab('statistics')}
                                        className={`px-4 py-2 font-medium ${selectedEventTab === 'statistics'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        📊 Estatísticas
                                    </button>
                                    <button
                                        onClick={() => setSelectedEventTab('reports')}
                                        className={`px-4 py-2 font-medium ${selectedEventTab === 'reports'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        📋 Relatórios
                                    </button>
                                </div>
                            </div>

                            {/* Conteúdo da aba Inscrições */}
                            {selectedEventTab === 'registrations' && (
                                <div>
                                    {/* Filtros aprimorados */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        <h3 className="font-semibold mb-4 text-gray-800">🔍 Filtros de Busca</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Status do Pagamento</label>
                                                <select
                                                    value={filters.paymentStatus}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="paid">Pagos</option>
                                                    <option value="pending">Pendentes</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Status da Inscrição</label>
                                                <select
                                                    value={filters.registrationStatus}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, registrationStatus: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="approved">Aprovados</option>
                                                    <option value="pending">Pendentes</option>
                                                    <option value="rejected">Rejeitados</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Igreja</label>
                                                <input
                                                    type="text"
                                                    value={filters.churchName}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, churchName: e.target.value }))}
                                                    placeholder="Filtrar por igreja..."
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pastor</label>
                                                <input
                                                    type="text"
                                                    value={filters.pastorName}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, pastorName: e.target.value }))}
                                                    placeholder="Filtrar por pastor..."
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={clearFilters}
                                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                                            >
                                                🗑️ Limpar Filtros
                                            </button>
                                        </div>
                                    </div>

                                    {/* Resumo rápido das inscrições */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-800">{selectedEvent.paidCount}</div>
                                            <div className="text-green-600 text-sm">💰 Pagos</div>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-yellow-800">{selectedEvent.pendingCount}</div>
                                            <div className="text-yellow-600 text-sm">⏳ Pendentes Pag.</div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-800">{getStatusStats().approved}</div>
                                            <div className="text-blue-600 text-sm">✅ Aprovados</div>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-orange-800">{getStatusStats().pending}</div>
                                            <div className="text-orange-600 text-sm">⏳ Pendentes Aprov.</div>
                                        </div>
                                    </div>

                                    {/* Ações em lote */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-3">
                                        <button
                                            onClick={handleExportCSV}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                            📊 Exportar CSV
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            🖨️ Imprimir Lista
                                        </button>
                                    </div>

                                    {/* Vista Desktop - Tabela */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Nome</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Igreja</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Pastor</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Pagamento</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRegistrations.map(registration => (
                                                    <tr key={registration.id} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <div>
                                                                <div className="font-medium">{registration.userName}</div>
                                                                <div className="text-sm text-gray-500">{registration.userEmail}</div>
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {registration.churchName || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {registration.pastorName || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                    registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {registration.status === 'approved' ? '✅ Aprovado' :
                                                                    registration.status === 'pending' ? '⏳ Pendente' :
                                                                        '❌ Rejeitado'}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${registration.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {registration.paymentStatus === 'paid' ? '💰 Pago' : '⏳ Pendente'}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <div className="space-y-2">
                                                                {registration.status === 'pending' && (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleApproveRegistration(registration.id)}
                                                                            disabled={approvalLoading === registration.id}
                                                                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                                                        >
                                                                            {approvalLoading === registration.id ? '...' : '✅ Aprovar'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const reason = prompt('Motivo da rejeição:');
                                                                                if (reason) handleRejectRegistration(registration.id, reason);
                                                                            }}
                                                                            disabled={approvalLoading === registration.id}
                                                                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                                                                        >
                                                                            {approvalLoading === registration.id ? '...' : '❌ Rejeitar'}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {registration.status === 'approved' && (
                                                                    <div className="space-y-1">
                                                                        {registration.paymentStatus === 'pending' && (
                                                                            <button
                                                                                onClick={() => handleGeneratePixPayment(registration)}
                                                                                disabled={generatingPayment === registration.id}
                                                                                className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                                                                            >
                                                                                {generatingPayment === registration.id
                                                                                    ? 'Gerando PIX...'
                                                                                    : registration.paymentId && registration.paymentId !== ''
                                                                                        ? '🔍 Ver PIX'
                                                                                        : '💰 Gerar PIX'
                                                                                }
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            onClick={() => handleShowBadge(registration)}
                                                                            className="w-full bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                                                                        >
                                                                            🎫 Gerar Crachá
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {registration.status === 'rejected' && registration.rejectionReason && (
                                                                    <div className="text-xs text-gray-500">
                                                                        Motivo: {registration.rejectionReason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Vista Mobile - Cards */}
                                    <div className="md:hidden space-y-4">
                                        <div className="text-sm text-gray-600 mb-4">
                                            Mostrando {filteredRegistrations.length} de {selectedEvent.registrations.length} inscrições
                                        </div>

                                        <div className="space-y-4">
                                            {filteredRegistrations.map(registration => (
                                                <div key={registration.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{registration.userName}</h4>
                                                            <p className="text-sm text-gray-500">{registration.userPhone}</p>
                                                            <p className="text-sm text-gray-500">{registration.userEmail}</p>
                                                        </div>
                                                        <div className="text-right text-xs text-gray-500">
                                                            {registration.createdAt.toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Igreja:</span>
                                                            <div className="font-medium">{registration.churchName || 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Pastor:</span>
                                                            <div className="font-medium">{registration.pastorName || 'N/A'}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 mb-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {registration.status === 'approved' ? '✅ Aprovado' :
                                                                registration.status === 'pending' ? '⏳ Pendente' :
                                                                    '❌ Rejeitado'}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${registration.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {registration.paymentStatus === 'paid' ? '💰 Pago' : '⏳ Pendente'}
                                                        </span>
                                                    </div>

                                                    {registration.status === 'pending' && (
                                                        <div className="flex gap-2 mb-2">
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

                                                    {registration.status === 'approved' && (
                                                        <div className="space-y-2">

                                                            {registration.paymentStatus === 'paid' && (
                                                                <div className="text-center text-green-600 text-sm">✅ Pago</div>
                                                            )}

                                                            {registration.paymentStatus === 'pending' && (
                                                                <button
                                                                    onClick={() => handleGeneratePixPayment(registration)}
                                                                    disabled={generatingPayment === registration.id}
                                                                    className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                                                                >
                                                                    {generatingPayment === registration.id
                                                                        ? 'Gerando PIX...'
                                                                        : registration.paymentId && registration.paymentId !== ''
                                                                            ? '🔍 Ver PIX'
                                                                            : '💰 Gerar PIX'
                                                                    }
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleShowBadge(registration)}
                                                                className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                                                            >
                                                                🎫 Gerar Crachá
                                                            </button>
                                                        </div>
                                                    )}

                                                    {registration.status === 'rejected' && (
                                                        <div>
                                                            <div className="text-center text-red-600 text-sm">✗ Rejeitado</div>
                                                            {registration.rejectionReason && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Motivo: {registration.rejectionReason}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => handleShowBadge(registration)}
                                                                className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 mt-2"
                                                            >
                                                                🎫 Gerar Crachá
                                                            </button>
                                                        </div>
                                                    )}

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Conteúdo da aba Estatísticas */}
                            {selectedEventTab === 'statistics' && (
                                <div className="space-y-6">
                                    {/* Cards de estatísticas de pagamento e aprovação */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-800">{selectedEvent.paidCount}</div>
                                            <div className="text-green-600 text-sm">💰 Pagos</div>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-yellow-800">{selectedEvent.pendingCount}</div>
                                            <div className="text-yellow-600 text-sm">⏳ Pendentes Pag.</div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-800">{selectedEvent.registrations.length}</div>
                                            <div className="text-blue-600 text-sm">📋 Total</div>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-purple-800">{selectedEvent.currentParticipants}/{selectedEvent.maxParticipants}</div>
                                            <div className="text-purple-600 text-sm">👥 Vagas</div>
                                        </div>
                                    </div>

                                    {/* Estatísticas detalhadas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border rounded-lg p-6">
                                            <h4 className="font-semibold mb-4 text-gray-800">📊 Status das Inscrições</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-600">✅ Aprovadas</span>
                                                    <span className="font-semibold">{getStatusStats().approved}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-yellow-600">⏳ Pendentes</span>
                                                    <span className="font-semibold">{getStatusStats().pending}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-red-600">❌ Rejeitadas</span>
                                                    <span className="font-semibold">{getStatusStats().rejected}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border rounded-lg p-6">
                                            <h4 className="font-semibold mb-4 text-gray-800">💰 Receita do Evento</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-600">Arrecadado</span>
                                                    <span className="font-semibold text-green-600">
                                                        R$ {(selectedEvent.paidCount * selectedEvent.price).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-yellow-600">Pendente</span>
                                                    <span className="font-semibold text-yellow-600">
                                                        R$ {(selectedEvent.pendingCount * selectedEvent.price).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center border-t pt-2">
                                                    <span className="text-blue-600 font-semibold">Total Potencial</span>
                                                    <span className="font-bold text-blue-600">
                                                        R$ {(selectedEvent.registrations.length * selectedEvent.price).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gráficos */}
                                    <div className="bg-white border rounded-lg p-6">
                                        <h4 className="font-semibold mb-4 text-gray-800">📈 Gráficos e Análises</h4>
                                        <Charts event={selectedEvent} />
                                    </div>
                                </div>
                            )}

                            {/* Conteúdo da aba Relatórios */}
                            {selectedEventTab === 'reports' && (
                                <div className="space-y-6">
                                    <div className="bg-white border rounded-lg p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-semibold text-gray-800">📋 Relatórios Detalhados</h4>
                                            <button
                                                onClick={handleExportCSV}
                                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                                            >
                                                📊 Exportar CSV
                                            </button>
                                        </div>
                                        <EventReports events={events} selectedEvent={selectedEvent} />
                                    </div>
                                </div>
                            )}
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
                                updateRegistrationWithPayment(showPixModal.registration.id, showPixModal.pixData.id);
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