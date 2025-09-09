'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { registerForEvent } from '@/lib/firebase/events';

interface EventCardProps {
    event: Event;
    showRegistration: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, showRegistration }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [imageError, setImageError] = useState(false); // Novo estado para erro de imagem
    const { userData } = useAuth();

    const handleRegistration = async () => {
        if (!userData) return;

        setIsRegistering(true);
        setRegistrationStatus('idle');

        try {
            await registerForEvent(event.id, userData.id);
            setRegistrationStatus('success');
        } catch (error: any) {
            console.error('Erro ao se inscrever no evento:', error);
            setRegistrationStatus('error');
        } finally {
            setIsRegistering(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Função para tratar erro no carregamento da imagem
    const handleImageError = () => {
        console.error('Erro ao carregar imagem:', event.imageURL);
        setImageError(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            {event.imageURL && !imageError ? (
                <div className="relative h-48 w-full">
                    <Image
                        src={event.imageURL}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={handleImageError} // Adicionar handler de erro
                        priority={false}
                    />
                </div>
            ) : (
                <div className="relative h-48 w-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <div className="p-4">
                <h2 className="text-xl font-bold mb-2 text-gray-800">{event.title}</h2>

                <div className="space-y-2 mb-4">
                    <p className="text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.date)}
                    </p>

                    <p className="text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                    </p>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{event.description}</p>

                {showRegistration && (
                    <div className="mt-4">
                        {registrationStatus === 'success' ? (
                            <div className="bg-green-100 text-green-800 p-2 rounded text-center">
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Inscrição realizada com sucesso!
                            </div>
                        ) : registrationStatus === 'error' ? (
                            <div className="bg-red-100 text-red-800 p-2 rounded text-center">
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Erro ao realizar inscrição. Tente novamente.
                            </div>
                        ) : (
                            <button
                                onClick={handleRegistration}
                                disabled={isRegistering}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center justify-center"
                            >
                                {isRegistering ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Inscrevendo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Inscrever-se
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCard;