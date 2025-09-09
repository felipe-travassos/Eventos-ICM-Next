// app/my-registrations/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRegistrations } from '@/lib/firebase/events';
import { EventRegistration } from '@/types';
import Link from 'next/link';

export default function MyRegistrationsPage() {
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const { userData } = useAuth();

    useEffect(() => {
        const fetchRegistrations = async () => {
            if (!userData) return;

            try {
                const userRegistrations = await getUserRegistrations(userData.id);
                setRegistrations(userRegistrations);
            } catch (error) {
                console.error('Erro ao buscar inscrições:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegistrations();
    }, [userData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Minhas Inscrições</h1>

                    {registrations.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">
                                Você ainda não se inscreveu em nenhum evento.
                            </p>
                            <Link
                                href="/"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Ver Eventos Disponíveis
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {registrations.map((registration) => (
                                <div
                                    key={registration.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">Evento ID: {registration.eventId}</h3>
                                            <p className="text-gray-600">Inscrito em: {registration.createdAt.toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${registration.paymentStatus === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : registration.paymentStatus === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {registration.paymentStatus === 'paid' ? 'Pago' :
                                                    registration.paymentStatus === 'pending' ? 'Pendente' : 'Reembolsado'}
                                            </span>
                                            <span
                                                className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${registration.status === 'confirmed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : registration.status === 'pending'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {registration.status === 'confirmed' ? 'Confirmado' :
                                                    registration.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                <strong>Nome:</strong> {registration.userName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Email:</strong> {registration.userEmail}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                <strong>Telefone:</strong> {registration.userPhone || 'Não informado'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Igreja:</strong> {registration.userChurch || 'Não informada'}
                                            </p>
                                        </div>
                                    </div>

                                    {registration.paymentStatus === 'pending' && (
                                        <div className="mt-4">
                                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                                                Realizar Pagamento
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}