'use client';

import React from 'react';
import { Event } from '@/types';
import EventCard from './EventCard';

interface EventSelectorProps {
    events: Event[];
    selectedEvent: Event | null;
    onEventSelect: (event: Event) => void;
}

export default function EventSelector({ events, selectedEvent, onEventSelect }: EventSelectorProps) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">Selecione o Evento para Inscrição</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                {events.map((event) => (
                    <div
                        key={event.id}
                        onClick={() => onEventSelect(event)}
                        className={`cursor-pointer transition-all transform hover:scale-105 ${selectedEvent?.id === event.id
                                ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                    >
                        <EventCard
                            event={event}
                            showRegistration={false}
                        />

                        {selectedEvent?.id === event.id && (
                            <div className="mt-2 text-center">
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                    ✅ Selecionado
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {events.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">Nenhum evento disponível</p>
                </div>
            )}
        </div>
    );
}