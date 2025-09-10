// app/admin/event-management/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Event, EventRegistration } from '@/types';
import Link from 'next/link';

interface EventWithRegistrations extends Event {
    registrations: EventRegistration[];
    paidCount: number;
    pendingCount: number;
}

export default function EventManagementPage() {
    const [events, setEvents] = useState<EventWithRegistrations[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventWithRegistrations | null>(null);
    const [filteredRegistrations, setFilteredRegistrations] = useState<EventRegistration[]>([]);
    const [filters, setFilters] = useState({
        paymentStatus: 'all',
        churchName: '',
        pastorName: ''
    });
    const { userData } = useAuth();

    // Verificar permissões
    useEffect(() => {
        if (userData && !['pastor', 'secretario_regional'].includes(userData.role)) {
            window.location.href = '/';
        }
    }, [userData]);

    // Carregar eventos e inscrições
    useEffect(() => {
        const loadEventsWithRegistrations = async () => {
            if (!userData || !['pastor', 'secretario_regional'].includes(userData.role)) return;

            try {
                // Buscar todos os eventos
                const eventsSnapshot = await getDocs(collection(db, 'events'));
                const eventsData: EventWithRegistrations[] = [];

                for (const eventDoc of eventsSnapshot.docs) {
                    const eventData = eventDoc.data();

                    // Criar objeto event com todas as propriedades obrigatórias
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
                    const registrationsQuery = query(
                        collection(db, 'registrations'),
                        where('eventId', '==', eventDoc.id)
                    );

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
        };

        loadEventsWithRegistrations();
    }, [userData]);

    // Aplicar filtros
    useEffect(() => {
        if (selectedEvent) {
            let filtered = selectedEvent.registrations;

            if (filters.paymentStatus !== 'all') {
                filtered = filtered.filter(reg => reg.paymentStatus === filters.paymentStatus);
            }

            if (filters.churchName) {
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
    }, [selectedEvent, filters]);

    const handleEventSelect = (event: EventWithRegistrations) => {
        setSelectedEvent(event);
        setFilteredRegistrations(event.registrations);
        setFilters({ paymentStatus: 'all', churchName: '', pastorName: '' });
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

    if (!userData || !['pastor', 'secretario_regional'].includes(userData.role)) {
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

                    {!selectedEvent ? (
                        // Lista de eventos
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
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Voltar
                                </button>
                            </div>

                            {/* Filtros */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <h3 className="font-semibold mb-3">Filtros</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            <option value="refunded">Reembolsados</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Igreja</label>
                                        <input
                                            type="text"
                                            placeholder="Filtrar por igreja..."
                                            value={filters.churchName}
                                            onChange={(e) => setFilters({ ...filters, churchName: e.target.value })}
                                            className="w-full p-2 border rounded"
                                        />
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

                            {/* Estatísticas */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-800">{selectedEvent.paidCount}</div>
                                    <div className="text-green-600">Inscrições Pagas</div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-800">{selectedEvent.pendingCount}</div>
                                    <div className="text-yellow-600">Inscrições Pendentes</div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-800">{selectedEvent.registrations.length}</div>
                                    <div className="text-blue-600">Total de Inscrições</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-800">
                                        {selectedEvent.currentParticipants}/{selectedEvent.maxParticipants}
                                    </div>
                                    <div className="text-purple-600">Vagas Ocupadas/Total</div>
                                </div>
                            </div>

                            {/* Botão Exportar */}
                            <div className="mb-6">
                                <button
                                    onClick={handleExportCSV}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Exportar CSV
                                </button>
                            </div>

                            {/* Lista de inscritos */}
                            <div>
                                <h3 className="font-semibold mb-4">
                                    Inscritos ({filteredRegistrations.length})
                                </h3>

                                {filteredRegistrations.length === 0 ? (
                                    <p className="text-gray-500">Nenhum inscrito encontrado com os filtros aplicados.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 p-2 text-left">Nome</th>
                                                    <th className="border border-gray-300 p-2 text-left">Email</th>
                                                    <th className="border border-gray-300 p-2 text-left">Telefone</th>
                                                    <th className="border border-gray-300 p-2 text-left">Igreja</th>
                                                    <th className="border border-gray-300 p-2 text-left">Pastor</th>
                                                    <th className="border border-gray-300 p-2 text-left">Status</th>
                                                    <th className="border border-gray-300 p-2 text-left">Data Inscrição</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRegistrations.map(registration => (
                                                    <tr key={registration.id} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 p-2">{registration.userName}</td>
                                                        <td className="border border-gray-300 p-2">{registration.userEmail}</td>
                                                        <td className="border border-gray-300 p-2">{registration.userPhone}</td>
                                                        <td className="border border-gray-300 p-2">{registration.churchName}</td>
                                                        <td className="border border-gray-300 p-2">{registration.pastorName}</td>
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}