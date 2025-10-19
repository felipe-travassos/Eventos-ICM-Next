// src/app/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event, EventRegistration } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

import {
  checkUserRegistration,
  getEventsWithSync,
  getUserRegistrations,
  registerForEvent
} from '@/lib/firebase/events';

import EventCard from '@/components/events/EventCard';
import { logger } from '@/lib/utils/logger';
import { useSonner } from '@/lib/sonner/useSonner';
import SecretaryPaymentFlow from '@/components/SecretaryPaymentFlow';

// Componentes de ícones
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

export default function HomePage() {

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([]);

  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  const [showSecretaryFlow, setShowSecretaryFlow] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const { userData, currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { error, warning, success } = useSonner();

  /**
   * Verifica se o perfil do usuário está completo
   */
  const isProfileComplete = userData?.cpf?.length === 11 &&
    userData?.phone?.length >= 10 &&
    (userData?.churchId || userData?.churchName);

  /**
   * Carrega as inscrições do usuário logado
   */
  useEffect(() => {
    const loadUserRegistrations = async () => {
      if (currentUser) {
        setLoadingRegistrations(true);
        try {
          logger.loadingUserRegistrations(currentUser.uid);
          const registrations = await getUserRegistrations(currentUser.uid);
          logger.userRegistrationsLoaded(registrations);
          setUserRegistrations(registrations);
        } catch (error) {
          console.error('❌ Erro ao carregar inscrições:', error);
          setUserRegistrations([]);
        } finally {
          setLoadingRegistrations(false);
        }
      } else {
        logger.userNotLoggedIn();
        setUserRegistrations([]);
        setLoadingRegistrations(false);
      }
    };

    loadUserRegistrations();
  }, [currentUser]);

  /**
   * Carrega todos os eventos ativos do sistema
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isLoading = false;

    const fetchEvents = async () => {
      // Evitar múltiplas chamadas simultâneas
      if (isLoading) return;
      
      try {
        isLoading = true;
        setLoading(true);
        
        logger.loadingEvents();
        const eventsData = await getEventsWithSync();
        logger.eventsLoaded(eventsData.length);
        
        const activeEvents = eventsData.filter((event: Event) => event.status === 'active');
        setEvents(activeEvents);
      } catch (error) {
        logger.error('Erro ao carregar eventos:', error);
        setEvents([]);
      } finally {
        setLoading(false);
        isLoading = false;
      }
    };

    // Carregamento inicial
    fetchEvents();

    // Configurar atualização automática a cada 5 minutos (reduzido de 60 segundos)
    intervalId = setInterval(async () => {
      try {
        logger.autoUpdatingEvents();
        
        const refreshedEvents = await getEventsWithSync();
        const refreshedActiveEvents = refreshedEvents.filter((event: Event) => event.status === 'active');
        setEvents(refreshedActiveEvents);
      } catch (err) {
        console.error('❌ Erro na atualização automática:', err);
      }
    }, 300000); // 5 minutos em vez de 1 minuto

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);


  /**
   * Configura o auto-rotate do carrossel
   */
  useEffect(() => {
    if (events.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % events.length);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [events.length]);

  /**
   * Processa a inscrição do usuário em um evento
   */
  const handleSubscribe = async (eventId: string) => {
    if (!currentUser || !userData) {
      router.push('/login');
      return;
    }

    // Validação do perfil
    const profileErrors = [];
    if (!userData.cpf || userData.cpf.length !== 11) {
      profileErrors.push('CPF não está completo');
    }
    if (!userData.phone || userData.phone.length < 10) {
      profileErrors.push('Número de celular não está completo');
    }
    if (!userData.churchId && !userData.churchName) {
      profileErrors.push('Igreja não foi selecionada');
    }

    if (profileErrors.length > 0) {
      warning(`Complete seu perfil antes de se inscrever:\n${profileErrors.join('\n')}\n\nAcesse "Meu Perfil" para completar seus dados.`);
      router.push('/profile');
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) {
      warning('Evento não encontrado');
      return;
    }
    if (event.currentParticipants >= event.maxParticipants) {
      setRegisteringEventId(null);
      warning('Não há vagas disponíveis para este evento');
      throw new Error('Não há vagas disponíveis para este evento');
    }
    setRegisteringEventId(eventId);

    try {
      const alreadyRegistered = await checkUserRegistration(eventId, currentUser.uid);
      if (alreadyRegistered) {
        warning('Você já está inscrito neste evento');
        return;
      }

      const result = await registerForEvent(
        eventId,
        currentUser.uid,
        {
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          church: userData.churchName || userData.churchId || '',
          cpf: userData.cpf || ''
        },
        userData // Passando dados completos do usuário para validação
      );

      if (result.success) {
        success('✅ Inscrição realizada com sucesso!');

        //Recarrega as inscrições após sucesso
        const updatedRegistrations = await getUserRegistrations(currentUser.uid);
        setUserRegistrations(updatedRegistrations);
        logger.registrationsUpdatedAfterEvent(updatedRegistrations);

        // Atualiza a lista de eventos para refletir o novo participante
        const updatedEvents = await getEventsWithSync();
        const activeEvents = updatedEvents.filter((event: Event) => event.status === 'active');
        setEvents(activeEvents);
      } else {
        error(result.message);
      }
    } catch (err: unknown) {
      console.error('Erro na inscrição:', err);
      const message = err instanceof Error ? err.message : 'Erro ao realizar inscrição.';
      error(message);
    } finally {
      setRegisteringEventId(null);
    }
  };

  /**
   * Carrossel
   */
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Estado de carregamento
  if (authLoading || loading || loadingRegistrations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando eventos e inscrições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* Header Hero */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12 rounded-lg mx-2">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Eventos da Área</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Participe dos próximos seminários
          </p>

          {!currentUser ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 text-center">
                Fazer Login
              </Link>
              <Link href="/register" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200 text-center">
                Criar Conta
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {!isProfileComplete && (
                <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg border border-yellow-300 text-center">
                  <strong>⚠️ Complete seu perfil</strong>
                  <Link href="/profile" className="block text-blue-600 hover:underline text-sm mt-1">
                    Clique aqui
                  </Link>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/my-registrations" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200 text-center">
                  Minhas Inscrições
                </Link>

                {(userData?.role === 'secretario_regional' || userData?.role === 'pastor' || userData?.role === 'secretario_local') && (
                  <>
                    <Link href="/admin/events" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 text-center">
                      Gerenciar Eventos
                    </Link>
                    <button
                      onClick={() => setShowSecretaryFlow(true)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 text-center"
                    >
                      👨‍💼 Área do Secretário
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>


      {/* Seção de eventos */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Eventos em Destaque</h2>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Nenhum evento disponível no momento.</p>
            <p className="text-gray-400">Volte em breve para conferir novos eventos!</p>
            {(userData?.role === 'secretario_regional') && (
              <div className="mt-4">
                <Link href="/admin/events" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
                  Cadastrar Primeiro Evento
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Carrossel de eventos */}
            <div className="relative overflow-hidden rounded-lg shadow-xl">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {events.map((event) => (
                  <div key={event.id} className="w-full flex-shrink-0">
                    <EventCard
                      event={event}
                      onSubscribe={handleSubscribe}
                      isSubscribing={registeringEventId === event.id}
                      userRegistrations={userRegistrations}
                      showRegistration={true}
                    />
                  </div>
                ))}
              </div>

              {events.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/3 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition duration-200"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/3 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition duration-200"
                  >
                    <ChevronRightIcon />
                  </button>
                </>
              )}
            </div>

            {events.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {events.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition duration-200 ${index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Seção final */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Participe da Nossa Comunidade</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Siga nossas redes sociais para acompanhar todos os eventos.
          </p>

          {!currentUser ? (
            <div className="space-x-4">
              <Link href="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
                Criar Minha Conta
              </Link>
              <Link href="/login" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-200">
                Fazer Login
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {!isProfileComplete && (
                <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg border border-yellow-300 text-center w-full max-w-md">
                  <strong>⚠️ Perfil Incompleto</strong>
                  <p className="text-sm mt-1">Complete seu perfil para se inscrever em eventos</p>
                  <Link href="/profile" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Completar Perfil
                  </Link>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/my-registrations" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 text-center">
                  Minhas Inscrições
                </Link>

                <Link href="/profile" className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-200 text-center">
                  Meu Perfil
                </Link>

                {(userData?.role === 'secretario_regional' || userData?.role === 'pastor' || userData?.role === 'secretario_local') && (
                  <Link href="/admin/events" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 text-center">
                    Gerenciar Eventos
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>


      {/* Modal da Área do Secretário */}
      {
        showSecretaryFlow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-800">
                    👨‍💼 Área do Secretário - Inscrição de Idosos
                  </h2>
                  <button
                    onClick={() => setShowSecretaryFlow(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Fechar
                  </button>
                </div>

                <SecretaryPaymentFlow
                  events={events}
                  onComplete={() => setShowSecretaryFlow(false)}
                />
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}