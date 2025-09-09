'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventRegistration } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkUserRegistration,
  getAllEvents,
  getEventsWithSync,
  getUserRegistrations,
  registerForEvent
} from '@/lib/firebase/events';
import Link from 'next/link';

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date - Data a ser formatada (pode ser Date, string ou Firebase Timestamp)
 * @returns Data formatada ou mensagem de erro
 */
const formatDateSafe = (date: any): string => {
  if (!date) return 'Data não informada';

  try {
    if (date instanceof Date) {
      return date.toLocaleDateString('pt-BR');
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('pt-BR');
    }
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('pt-BR');
    }
    return 'Data inválida';
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return 'Data inválida';
  }
};

/**
 * Formata o horário para o formato brasileiro (HH:MM)
 * @param date - Data contendo o horário a ser formatado
 * @returns Horário formatado ou string vazia
 */
const formatTimeSafe = (date: any): string => {
  if (!date) return '';

  try {
    if (date instanceof Date) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return '';
  } catch (error) {
    console.error('Erro ao formatar hora:', error, date);
    return '';
  }
};

/**
 * Página principal que exibe eventos e permite inscrições
 * @returns Componente da página inicial
 */
export default function HomePage() {
  // Estados para gerenciamento de dados e UI
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Refs e hooks
  const carouselRef = useRef<HTMLDivElement>(null);
  const { userData, currentUser } = useAuth();
  const router = useRouter();

  /**
   * Verifica se o perfil do usuário está completo
   * Requisitos: CPF (11 dígitos), telefone (10+ dígitos) e igreja preenchidos
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
          const registrations = await getUserRegistrations(currentUser.uid);
          setUserRegistrations(registrations);
        } catch (error) {
          console.error('Erro ao carregar inscrições:', error);
          alert('Erro ao carregar suas inscrições');
        } finally {
          setLoadingRegistrations(false);
        }
      } else {
        setUserRegistrations([]);
      }
    };

    loadUserRegistrations();
  }, [currentUser]);

  /**
   * Carrega todos os eventos ativos do sistema com sincronização automática
   */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log('Buscando eventos com sincronização automática...');

        // Use getEventsWithSync para sincronizar automaticamente
        const eventsData = await getEventsWithSync();

        // Log para debug
        console.log('Eventos carregados:', eventsData.length);
        eventsData.forEach(event => {
          console.log(`📊 ${event.title}: ${event.currentParticipants}/${event.maxParticipants} vagas`);
        });

        const activeEvents = eventsData.filter((event: Event) => event.status === 'active');
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

  /**
   * Configura o auto-rotate do carrossel de eventos
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
   * @param eventId - ID do evento para inscrição
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
      alert(`Complete seu perfil antes de se inscrever:\n${profileErrors.join('\n')}\n\nAcesse "Meu Perfil" para completar seus dados.`);
      router.push('/profile');
      return;
    }

    // Verifica se o evento existe e tem vagas
    const event = events.find(e => e.id === eventId);
    if (!event) {
      alert('Evento não encontrado');
      return;
    }
    if (event.currentParticipants >= event.maxParticipants) {
      alert('Não há vagas disponíveis para este evento');
      return;
    }

    setRegisteringEventId(eventId);
    try {
      // Verifica inscrição duplicada
      const alreadyRegistered = await checkUserRegistration(eventId, currentUser.uid);
      if (alreadyRegistered) {
        alert('Você já está inscrito neste evento');
        return;
      }

      // Processa a inscrição
      const result = await registerForEvent(
        eventId,
        currentUser.uid,
        {
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          church: userData.churchName || userData.churchId || ''
        }
      );

      if (result.success) {
        alert(result.message);
        // Atualiza os dados após inscrição bem-sucedida
        const updatedRegistrations = await getUserRegistrations(currentUser.uid);
        setUserRegistrations(updatedRegistrations);

        // Use getEventsWithSync para buscar eventos atualizados
        const updatedEvents = await getEventsWithSync();
        const activeEvents = updatedEvents.filter((event: Event) => event.status === 'active');
        setEvents(activeEvents);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      console.error('Erro na inscrição:', error);
      alert(error.message || 'Erro ao realizar inscrição.');
    } finally {
      setRegisteringEventId(null);
    }
  };

  /**
   * Avança para o próximo slide do carrossel
   */
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  /**
   * Volta para o slide anterior do carrossel
   */
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  /**
   * Vai para um slide específico do carrossel
   * @param index - Índice do slide desejado
   */
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Estado de carregamento
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
      {/* Header Hero com chamada principal */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Eventos da Igreja</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Participe dos eventos especiais da nossa comunidade e fortaleça sua fé.
          </p>

          {/* Actions para usuários logados e não logados */}
          {!currentUser ? (
            <div className="space-x-4">
              <Link href="/login" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                Fazer Login
              </Link>
              <Link href="/register" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200">
                Criar Conta
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {/* Aviso de perfil incompleto */}
              {!isProfileComplete && (
                <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg border border-yellow-300 text-center">
                  <strong>⚠️ Complete seu perfil</strong>
                  <Link href="/profile" className="block text-blue-600 hover:underline text-sm mt-1">
                    Clique aqui
                  </Link>
                </div>
              )}

              <div className="space-x-4">
                <Link href="/my-registrations" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-200">
                  Minhas Inscrições
                </Link>
                {/* Links para administradores */}
                {(userData?.role === 'secretario_regional' || userData?.role === 'pastor' || userData?.role === 'secretario_local') && (
                  <Link href="/admin/events" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                    Gerenciar Eventos
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Seção de eventos em destaque com carrossel */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Eventos em Destaque</h2>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg text-center mb-8">
            <p>{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Nenhum evento disponível no momento.</p>
            <p className="text-gray-400">Volte em breve para conferir novos eventos!</p>
            {/* Opção para administradores criarem eventos */}
            {(userData?.role === 'secretario_regional' || userData?.role === 'pastor' || userData?.role === 'secretario_local') && (
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
              <div ref={carouselRef} className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUser={currentUser}
                    userRegistrations={userRegistrations}
                    loadingRegistrations={loadingRegistrations}
                    registeringEventId={registeringEventId}
                    isProfileComplete={isProfileComplete}
                    onSubscribe={handleSubscribe}
                    onLogin={() => router.push('/login')}
                  />
                ))}
              </div>

              {/* Controles de navegação do carrossel */}
              {events.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition duration-200">
                    <ChevronLeftIcon />
                  </button>
                  <button onClick={nextSlide} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition duration-200">
                    <ChevronRightIcon />
                  </button>
                </>
              )}
            </div>

            {/* Indicadores de slide */}
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

      {/* Seção de call-to-action final */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Participe da Nossa Comunidade</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a nós nos eventos que fortalecem nossa fé e comunidade.
            Há sempre um lugar para você em nossa família espiritual.
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
              {/* Aviso de perfil incompleto */}
              {!isProfileComplete && (
                <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg border border-yellow-300 text-center w-full max-w-md">
                  <strong>⚠️ Perfil Incompleto</strong>
                  <p className="text-sm mt-1">Complete seu perfil para se inscrever em eventos</p>
                  <Link href="/profile" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Completar Perfil
                  </Link>
                </div>
              )}

              <div className="space-x-4">
                <Link href="/my-registrations" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
                  Minhas Inscrições
                </Link>
                <Link href="/profile" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-200">
                  Meu Perfil
                </Link>
                {/* Links para administradores */}
                {(userData?.role === 'secretario_regional' || userData?.role === 'pastor' || userData?.role === 'secretario_local') && (
                  <Link href="/admin/events" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
                    Gerenciar Eventos
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Componente de card de evento individual
 */
const EventCard = ({
  event,
  currentUser,
  userRegistrations,
  loadingRegistrations,
  registeringEventId,
  isProfileComplete,
  onSubscribe,
  onLogin
}: any) => {
  const isUserRegistered = userRegistrations.some((reg: EventRegistration) =>
    reg.eventId === event.id && reg.status !== 'cancelled'
  );

  return (
    <div className="w-full flex-shrink-0">
      <div className="bg-white p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Imagem do evento */}
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
            {event.imageURL ? (
              <img src={event.imageURL} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-2xl font-semibold">{event.title}</span>
              </div>
            )}
          </div>

          {/* Informações do evento */}
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{event.title}</h3>

            <div className="space-y-2 text-gray-600">
              <p className="flex items-center">
                <CalendarIcon />
                {formatDateSafe(event.date)} {event.date && 'às'} {formatTimeSafe(event.date)}
              </p>
              <p className="flex items-center">
                <LocationIcon />
                {event.location}
              </p>
              <p className="text-sm text-gray-500">
                Vagas: {event.currentParticipants}/{event.maxParticipants}
                {event.price > 0 && ` • Valor: R$ ${event.price.toFixed(2)}`}
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed">{event.description}</p>

            {/* Estados do botão de inscrição */}
            {event.currentParticipants >= event.maxParticipants ? (
              <div className="bg-red-100 text-red-800 p-3 rounded text-center">
                <strong>Vagas esgotadas</strong>
                <p className="text-sm mt-1">Todas as vagas foram preenchidas</p>
              </div>
            ) : (
              <div className="pt-4">
                {currentUser ? (
                  loadingRegistrations ? (
                    <div className="bg-gray-100 text-gray-600 p-3 rounded text-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
                      <p className="text-sm mt-1">Verificando inscrição...</p>
                    </div>
                  ) : isUserRegistered ? (
                    <div className="bg-green-100 text-green-800 p-3 rounded text-center">
                      <strong>✅ Inscrito</strong>
                      <p className="text-sm mt-1">Você já está inscrito neste evento</p>
                      <Link href="/my-registrations" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                        Ver minhas inscrições
                      </Link>
                    </div>
                  ) : !isProfileComplete ? (
                    <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-center">
                      <strong>⚠️ Perfil Incompleto</strong>
                      <p className="text-sm mt-1">Complete seu perfil para se inscrever</p>
                      <Link href="/profile" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                        Completar Perfil
                      </Link>
                    </div>
                  ) : registeringEventId === event.id ? (
                    <button disabled className="bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center w-full opacity-50 cursor-not-allowed">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Inscrevendo...
                    </button>
                  ) : (
                    <button onClick={() => onSubscribe(event.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center w-full">
                      <TicketIcon />
                      Inscrever-se
                    </button>
                  )
                ) : (
                  <button onClick={onLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center w-full">
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
  );
};

// Componentes de ícones (mantidos para referência)
const CalendarIcon = () => (<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const LocationIcon = () => (<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const TicketIcon = () => (<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>);
const LoginIcon = () => (<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>);
const ChevronLeftIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>);
const ChevronRightIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>);