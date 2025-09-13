// app/event/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SecretaryPaymentFlow from '@/components/SecretaryPaymentFlow';
import { getEventById } from '@/lib/firebase/events';
import { Event } from '@/types';

export default function EventPage({ params }: { params: { id: string } }) {
  const [showSecretaryFlow, setShowSecretaryFlow] = useState(false);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  // Buscar dados do evento
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const event = await getEventById(params.id);
        setEventData(event);
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id]); // ✅ Agora params.id é usado

  // Verificar se usuário é secretário (corrigindo a comparação)
  const isSecretary = userData?.role === 'secretario_local';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Evento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Conteúdo principal do evento */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{eventData.title}</h1>
        <p className="text-gray-600 mb-4">{eventData.description}</p>
        <p className="text-lg font-semibold text-green-600">
          R$ {eventData.price?.toFixed(2) || '0,00'}
        </p>
        {/* ... mais detalhes do evento ... */}
      </div>
      
      {/* Área do Secretário */}
      {isSecretary && (
        <div className="mt-8 p-6 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Área do Secretário</h3>
          
          {!showSecretaryFlow ? (
            <button
              onClick={() => setShowSecretaryFlow(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              📝 Fazer Inscrição para Idoso
            </button>
          ) : (
            <SecretaryPaymentFlow
              event={eventData} // ✅ Agora eventData está definido
              onRegistrationComplete={() => setShowSecretaryFlow(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}