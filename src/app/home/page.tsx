'use client';

//src/app/home/page.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEvents } from '@/lib/firebase/events';
import Link from 'next/link';

export default function HomePage() {

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
    const { userData } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsData = await getAllEvents();
                setEvents(eventsData);

                // Eventos em destaque (próximos 7 dias)
                const now = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(now.getDate() + 7);

                const featured = eventsData.filter(event =>
                    event.date >= now && event.date <= nextWeek
                ).slice(0, 3); // Limita a 3 eventos em destaque

                setFeaturedEvents(featured);
            } catch (error) {
                console.error('Erro ao buscar eventos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleSubscribe = (eventId: string) => {
        if (!userData) {
            router.push('/login');
            return;
        }
        // Redireciona para a página de eventos onde pode se inscrever
        router.push(`/events#event-${eventId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Carregando eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Eventos ICM
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                        Participe dos Cultos e seminários especiais.
                        Cresça na fé e fortaleça na comunhão com os irmãos.
                    </p>

                    {!userData ? (
                        <div className="space-x-4">
                            <Link
                                href="/login"
                                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
                            >
                                Fazer Login
                            </Link>
                            <Link
                                href="/register"
                                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200"
                            >
                                Criar Conta
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/events"
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 inline-block"
                        >
                            Ver Todos os Eventos
                        </Link>
                    )}
                </div>
            </section>

            {/* Eventos em Destaque */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Eventos em Destaque
                    </h2>

                    {featuredEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">
                                Nenhum evento em destaque no momento.
                            </p>
                            {userData && (
                                <Link
                                    href="/events"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                                >
                                    Ver Todos os Eventos
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredEvents.map((event) => (
                                <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    {event.imageURL ? (
                                        <div className="relative h-48">
                                            <img
                                                src={event.imageURL}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                            <span className="text-white text-lg font-semibold">Evento</span>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {event.title}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <p className="text-gray-600 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {event.date.toLocaleDateString('pt-BR')}
                                            </p>

                                            <p className="text-gray-600 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {event.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>

                                            <p className="text-gray-600 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                {event.location}
                                            </p>
                                        </div>

                                        <p className="text-gray-700 mb-4 line-clamp-3">
                                            {event.description}
                                        </p>

                                        <button
                                            onClick={() => handleSubscribe(event.id)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200 font-semibold"
                                        >
                                            {userData ? 'Inscrever-se' : 'Fazer Login para Inscrever-se'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {events.length}
                            </div>
                            <div className="text-gray-600 font-semibold">
                                Eventos Ativos
                            </div>
                        </div>

                        <div>
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                {events.filter(e => e.date >= new Date()).length}
                            </div>
                            <div className="text-gray-600 font-semibold">
                                Próximos Eventos
                            </div>
                        </div>

                        <div>
                            <div className="text-4xl font-bold text-purple-600 mb-2">
                                {featuredEvents.length}
                            </div>
                            <div className="text-gray-600 font-semibold">
                                Em Destaque
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">
                        Você está convidado a participar dos nossos cultos
                    </h2>

                    {!userData ? (
                        <div className="space-x-4">
                            <Link
                                href="/register"
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                            >
                                Criar Minha Conta
                            </Link>
                            <Link
                                href="/events"
                                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-200"
                            >
                                Ver Eventos
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/events"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 inline-block"
                        >
                            Explorar Todos os Eventos
                        </Link>
                    )}
                </div>
            </section>
        </div>
    );
}