'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    uploadEventImage,
    deleteImage,
    extractImagePathFromURL
} from '@/lib/firebase/storage';

export default function AdminEvents() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active');
    const { userData } = useAuth();
    const router = useRouter();

    // Verificar permissões
    useEffect(() => {
        if (userData && !['pastor', 'secretario_regional', 'secretario_local'].includes(userData.role)) {
            router.push('/');
        }
    }, [userData, router]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'events'));
                const eventsData: Event[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    eventsData.push({
                        id: doc.id,
                        ...data,
                        date: data.date.toDate(),
                        createdAt: data.createdAt.toDate(),
                        currentParticipants: data.currentParticipants || 0,
                        status: data.status || 'active'
                    } as Event);
                });

                setEvents(eventsData);
            } catch (error) {
                console.error('Erro ao buscar eventos:', error);
            }
        };

        if (userData?.role && ['pastor', 'secretario_regional', 'secretario_local'].includes(userData.role)) {
            fetchEvents();
        }
    }, [userData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;

        setLoading(true);
        try {
            let imageURL = '';

            if (image) {
                try {
                    // Use a função do storage.ts
                    imageURL = await uploadEventImage(image, userData.id);
                    console.log('Imagem salva com URL:', imageURL);
                } catch (error: any) {
                    console.error('Erro no upload da imagem:', error);
                    alert('Erro ao fazer upload da imagem: ' + error.message);
                    setLoading(false);
                    return;
                }
            }

            const eventDateTime = new Date(`${date}T${time}`);

            if (editingEvent) {
                await updateDoc(doc(db, 'events', editingEvent.id), {
                    title,
                    description,
                    date: eventDateTime,
                    location,
                    maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
                    price: price ? parseFloat(price) : 0,
                    imageURL: imageURL || editingEvent.imageURL
                });

                setEditingEvent(null);
                alert('Evento atualizado com sucesso!');
            } else {
                await addDoc(collection(db, 'events'), {
                    title,
                    description,
                    date: eventDateTime,
                    location,
                    maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
                    price: price ? parseFloat(price) : 0,
                    currentParticipants: 0,
                    status: 'active',
                    imageURL,
                    createdAt: new Date(),
                    createdBy: userData.id
                });

                alert('Evento cadastrado com sucesso!');
            }

            resetForm();
            const querySnapshot = await getDocs(collection(db, 'events'));
            const eventsData: Event[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                eventsData.push({
                    id: doc.id,
                    ...data,
                    date: data.date.toDate(),
                    createdAt: data.createdAt.toDate(),
                    currentParticipants: data.currentParticipants || 0,
                    status: data.status || 'active'
                } as Event);
            });

            setEvents(eventsData);

        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            alert('Erro ao salvar evento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleEndEvent = async (eventId: string) => {
        if (!confirm('Tem certeza que deseja encerrar este evento?')) return;

        try {
            await updateDoc(doc(db, 'events', eventId), {
                status: 'ended',
                endedAt: new Date()
            });

            setEvents(events.map(event =>
                event.id === eventId
                    ? { ...event, status: 'canceled' as const }
                    : event
            ));

            alert('Evento encerrado com sucesso!');
        } catch (error) {
            console.error('Erro ao encerrar evento:', error);
            alert('Erro ao encerrar evento. Tente novamente.');
        }
    };

    const handleReactivateEvent = async (eventId: string) => {
        try {
            await updateDoc(doc(db, 'events', eventId), {
                status: 'active',
                endedAt: null
            });

            setEvents(events.map(event =>
                event.id === eventId
                    ? { ...event, status: 'active' as const }
                    : event
            ));

            alert('Evento reativado com sucesso!');
        } catch (error) {
            console.error('Erro ao reativar evento:', error);
            alert('Erro ao reativar evento. Tente novamente.');
        }
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description);
        setDate(event.date.toISOString().split('T')[0]);
        setTime(event.date.toTimeString().substring(0, 5));
        setLocation(event.location);
        setMaxParticipants(event.maxParticipants?.toString() || '');
        setPrice(event.price?.toString() || '0');
        setImage(null);
        setShowForm(true);
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;

        try {
            // Primeiro, buscar o evento para obter a URL da imagem
            const eventToDelete = events.find(event => event.id === eventId);

            if (eventToDelete?.imageURL) {
                try {
                    // Extrair o path da imagem da URL usando a função do storage.ts
                    const imagePath = extractImagePathFromURL(eventToDelete.imageURL);
                    if (imagePath) {
                        // Deletar a imagem do Storage usando a função do storage.ts
                        await deleteImage(imagePath);
                        console.log('Imagem excluída do Storage:', imagePath);
                    }
                } catch (storageError) {
                    console.error('Erro ao excluir imagem do Storage:', storageError);
                    // Não impedir a exclusão do evento mesmo se falhar a exclusão da imagem
                }
            }

            // Deletar o evento do Firestore
            await deleteDoc(doc(db, 'events', eventId));

            // Remover das inscrições relacionadas (opcional, mas recomendado)
            try {
                await deleteEventRegistrations(eventId);
            } catch (regError) {
                console.error('Erro ao excluir inscrições do evento:', regError);
            }

            // Atualizar lista local
            setEvents(events.filter(event => event.id !== eventId));
            alert('Evento excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            alert('Erro ao excluir evento. Tente novamente.');
        }
    };

    // Função para deletar todas as inscrições do evento
    const deleteEventRegistrations = async (eventId: string) => {
        try {
            const registrationsQuery = query(
                collection(db, 'eventRegistrations'),
                where('eventId', '==', eventId)
            );

            const querySnapshot = await getDocs(registrationsQuery);
            const deletePromises: Promise<void>[] = [];

            querySnapshot.forEach((registrationDoc) => {
                deletePromises.push(deleteDoc(registrationDoc.ref));
            });

            await Promise.all(deletePromises);
            console.log(`Inscrições do evento ${eventId} excluídas`);
        } catch (error) {
            console.error('Erro ao excluir inscrições:', error);
            throw error;
        }
    };

    const resetForm = () => {
        setEditingEvent(null);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setLocation('');
        setMaxParticipants('');
        setPrice('');
        setImage(null);
        setShowForm(false);
    };

    const cancelEdit = () => {
        resetForm();
    };

    const handleNewEvent = () => {
        resetForm();
        setShowForm(true);
    };

    const activeEvents = events.filter(event => event.status === 'active');
    const endedEvents = events.filter(event => event.status === 'canceled');

    if (!userData || !['pastor', 'secretario_regional', 'secretario_local'].includes(userData.role)) {
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
                <h1 className="text-2xl font-bold">Gerenciar Eventos</h1>

                {!showForm && (
                    <button
                        onClick={handleNewEvent}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                        Cadastrar Novo Evento
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingEvent ? 'Editar Evento' : 'Cadastrar Novo Evento'}
                    </h2>

                    <form onSubmit={handleSubmit} className="max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Título do Evento *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                    Local *
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição *
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Data *
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                                    Hora *
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                Valor da Inscrição (R$)
                            </label>
                            <input
                                type="number"
                                id="price"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                                Limite de Participantes (opcional)
                            </label>
                            <input
                                type="number"
                                id="maxParticipants"
                                value={maxParticipants}
                                onChange={(e) => setMaxParticipants(e.target.value)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Deixe em branco para ilimitado"
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                                Imagem do Evento (opcional)
                            </label>
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            {editingEvent?.imageURL && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">Imagem atual:</p>
                                    <div className="relative h-20 w-20 mt-1">
                                        <Image
                                            src={editingEvent.imageURL}
                                            alt="Imagem atual do evento"
                                            fill
                                            className="object-contain rounded"
                                        />
                                    </div>
                                    {/* <img
                                        src={editingEvent.imageURL}
                                        alt="Imagem atual do evento"
                                        className="h-20 object-cover rounded mt-1"
                                    /> */}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {loading ? 'Salvando...' : editingEvent ? 'Atualizar Evento' : 'Cadastrar Evento'}
                            </button>

                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabs para eventos ativos e encerrados */}
            <div className="mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 font-medium ${activeTab === 'active'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Eventos Ativos ({activeEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('ended')}
                        className={`px-4 py-2 font-medium ${activeTab === 'ended'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Eventos Encerrados ({endedEvents.length})
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">
                    {activeTab === 'active' ? 'Eventos Ativos' : 'Eventos Encerrados'}
                </h2>

                {(activeTab === 'active' ? activeEvents : endedEvents).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                            {activeTab === 'active'
                                ? 'Nenhum evento ativo no momento.'
                                : 'Nenhum evento encerrado.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(activeTab === 'active' ? activeEvents : endedEvents).map((event) => (
                            <div key={event.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                {event.imageURL && (
                                    <div className="relative w-full h-40 rounded-md mb-3 overflow-hidden">
                                        <Image
                                            src={event.imageURL}
                                            alt={event.title}
                                            fill
                                            priority={false}
                                            unoptimized={true}
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {event.status === 'active' ? 'Ativo' : 'Encerrado'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-3">
                                    <p><strong>Data:</strong> {event.date.toLocaleDateString('pt-BR')}</p>
                                    <p><strong>Hora:</strong> {event.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p><strong>Local:</strong> {event.location}</p>
                                    <p><strong>Taxa de Inscrição:</strong> {`R$ ${event?.price}`}</p>
                                    <p><strong>Inscrições:</strong> {event.currentParticipants}{event.maxParticipants ? `/${event.maxParticipants}` : ''}</p>

                                    {event.maxParticipants && (
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(event.currentParticipants / event.maxParticipants) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {event.status === 'active' ? (
                                        <>
                                            <button
                                                onClick={() => handleEdit(event)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleEndEvent(event.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Encerrar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivateEvent(event.id)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Reativar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}