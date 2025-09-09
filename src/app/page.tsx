'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEvents, registerForEvent } from '@/lib/firebase/events';
import Link from 'next/link';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { userData, currentUser } = useAuth(); // Adicionei 'user' para verificar autenticação
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log('Buscando eventos...');
        const eventsData = await getAllEvents();
        console.log('Eventos encontrados:', eventsData.length);

        // Filtrar apenas eventos ativos para a página inicial
        const activeEvents = eventsData.filter(event => {
          const isActive = event.status === 'active';
          console.log(`Evento: ${event.title}, Status: ${event.status}, Ativo: ${isActive}`);
          return isActive;
        });

        console.log('Eventos ativos:', activeEvents.length);
        setEvents(activeEvents);
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        setError('Erro ao carregar eventos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Auto-rotate carousel apenas se houver eventos
    if (events.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % events.length);
      }, 9000);

      return () => clearInterval(interval);
    }
  }, [events.length]);

  const handleSubscribe = async (eventId: string) => {
    // Verificar se o usuário está autenticado (user) e tem dados (userData)
    if (!currentUser || !userData) {
      router.push('/login');
      return;
    }

    setRegisteringEventId(eventId);
    try {
      await registerForEvent(eventId, userData.id);
      alert('Inscrição realizada com sucesso!');

      // Atualizar a lista de eventos para refletir a nova inscrição
      const updatedEvents = await getAllEvents();
      const activeEvents = updatedEvents.filter(event => event.status === 'active');
      setEvents(activeEvents);
    } catch (error: any) {
      console.error('Erro na inscrição:', error);
      alert(error.message || 'Erro ao realizar inscrição.');
    } finally {
      setRegisteringEventId(null);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Hero */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Eventos da Igreja
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Participe dos eventos especiais da nossa comunidade e fortaleça sua fé.
          </p>

          {!currentUser ? ( // Alterado para verificar 'user' em vez de 'userData'
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
            <div className="space-x-4">
              <Link
                href="/my-registrations"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200"
              >
                Minhas Inscrições
              </Link>
              {/* Botão para admin se for secretário, pastor ou secretário local */}
              {(userData?.role === 'secretario_regional' ||
                userData?.role === 'pastor' ||
                userData?.role === 'secretario_local') && (
                  <Link
                    href="/admin/events"
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
                  >
                    Gerenciar Eventos
                  </Link>
                )}
            </div>
          )}
        </div>
      </header>

      {/* Eventos em Carrossel */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Eventos em Destaque
        </h2>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg text-center mb-8">
            <p>{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              Nenhum evento disponível no momento.
            </p>
            <p className="text-gray-400">
              Volte em breve para conferir novos eventos!
            </p>
            {/* Mostrar link para admin se for secretário, pastor ou secretário local */}
            {(userData?.role === 'secretario_regional' ||
              userData?.role === 'pastor' ||
              userData?.role === 'secretario_local') && (
                <div className="mt-4">
                  <Link
                    href="/admin/events"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    Cadastrar Primeiro Evento
                  </Link>
                </div>
              )}
          </div>
        ) : (
          <>
            {/* Carrossel */}
            <div className="relative overflow-hidden rounded-lg shadow-xl">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="w-full flex-shrink-0"
                  >
                    <div className="bg-white p-6 md:p-8">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Imagem do Evento */}
                        <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                          {event.imageURL ? (
                            <img
                              src={event.imageURL}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-2xl font-semibold">Evento</span>
                            </div>
                          )}
                        </div>

                        {/* Informações do Evento */}
                        <div className="space-y-4">
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
                            {event.title}
                          </h3>

                          <div className="space-y-2 text-gray-600">
                            <p className="flex items-center">
                              <CalendarIcon />
                              {event.date.toLocaleDateString('pt-BR')} às{' '}
                              {event.date.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="flex items-center">
                              <LocationIcon />
                              {event.location}
                            </p>
                            <p className="text-sm text-gray-500">
                              Inscrições: {event.currentParticipants}
                              {event.maxParticipants ? `/${event.maxParticipants}` : ''}
                            </p>
                          </div>

                          <p className="text-gray-700 leading-relaxed">
                            {event.description}
                          </p>

                          {event.maxParticipants && event.currentParticipants >= event.maxParticipants ? (
                            <div className="bg-red-100 text-red-800 p-3 rounded text-center">
                              <strong>Vagas esgotadas</strong>
                              <p className="text-sm mt-1">Todas as vagas foram preenchidas</p>
                            </div>
                          ) : (
                            <div className="pt-4">
                              {currentUser ? ( // Alterado para verificar 'user' em vez de 'userData'
                                <button
                                  onClick={() => handleSubscribe(event.id)}
                                  disabled={registeringEventId === event.id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full"
                                >
                                  {registeringEventId === event.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Inscrevendo...
                                    </>
                                  ) : (
                                    <>
                                      <TicketIcon />
                                      Inscrever-se
                                    </>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => router.push('/login')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center w-full"
                                >
                                  <LoginIcon />
                                  Fazer Login para Inscrever-se
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles do Carrossel */}
              {events.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition duration-200"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition duration-200"
                  >
                    <ChevronRightIcon />
                  </button>
                </>
              )}
            </div>

            {/* Indicadores do Carrossel */}
            {events.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {events.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition duration-200 ${index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Call to Action */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Participe da Nossa Comunidade
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a nós nos eventos que fortalecem nossa fé e comunidade.
            Há sempre um lugar para você em nossa família espiritual.
          </p>

          {!currentUser ? ( // Alterado para verificar 'user' em vez de 'userData'
            <div className="space-x-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                Criar Minha Conta
              </Link>
              <Link
                href="/login"
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-200"
              >
                Fazer Login
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                href="/my-registrations"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                Minhas Inscrições
              </Link>
              <Link
                href="/profile"
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-200"
              >
                Meu Perfil
              </Link>
              {/* Botão para admin se for secretário, pastor ou secretário local */}
              {(userData?.role === 'secretario_regional' ||
                userData?.role === 'pastor' ||
                userData?.role === 'secretario_local') && (
                  <Link
                    href="/admin/events"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    Gerenciar Eventos
                  </Link>
                )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Ícones auxiliares (mantidos iguais)
const CalendarIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const LoginIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);