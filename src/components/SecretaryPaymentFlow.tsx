//src\components\SecretaryPaymentFlow.tsx
'use client';

import React, { useState } from 'react';
import SeniorAutocomplete from './SeniorAutocomplete';
import AddSeniorModal from './AddSeniorModal';
import PaymentModal from './PaymentModal';
import EventSelector from './events/EventSelector';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types';

interface SecretaryPaymentFlowProps {
    events: Event[];
    onComplete: () => void;
}

export default function SecretaryPaymentFlow({
    events,
    onComplete
}: SecretaryPaymentFlowProps) {
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedSenior, setSelectedSenior] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const { userData } = useAuth();

    const handleEventSelect = (event: Event) => {
        setSelectedEvent(event);
        setSelectedSenior(null);
    };

    const handleSeniorSelect = (senior: any) => {
        setSelectedSenior(senior);
    };

    const handleSeniorAdded = (newSenior: any) => {
        setSelectedSenior(newSenior);
        setShowAddModal(false);
    };

    const handlePayment = async () => {
        if (!selectedSenior || !selectedEvent || !userData) return;

        setLoading(true);

        try {
            // 1. Primeiro verificar se já existe uma inscrição
            const checkResponse = await fetch(`/api/registrations/check?eventId=${selectedEvent.id}&seniorId=${selectedSenior.id}`);

            let existingRegistration = null;

            if (checkResponse.ok) {
                const data = await checkResponse.json();
                existingRegistration = data || null; // ✅ Garante null se vazio
            }

            // 2. Se existir inscrição e não estiver aprovada, bloquear
            if (existingRegistration && existingRegistration.status !== 'approved') {
                alert('⏳ Esta inscrição ainda não foi aprovada. Aguarde a liberação do secretário responsável.');
                setLoading(false);
                return;
            }

            // 3. Se não existir inscrição, criar uma como pendente
            if (!existingRegistration) {
                const registrationResponse = await fetch('/api/secretary/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        secret: 'apdsj123456',
                        secretaryId: userData.uid,
                        secretaryName: userData.name,
                        eventId: selectedEvent.id,
                        eventName: selectedEvent.title,
                        seniorId: selectedSenior.id,
                        userName: selectedSenior.name,
                        userEmail: selectedSenior.email,
                        userPhone: selectedSenior.phone,
                        userCpf: selectedSenior.cpf,
                        churchName: selectedSenior.church,
                        pastorName: selectedSenior.pastor,
                        status: 'pending',
                        paymentStatus: 'pending'
                    })
                });

                if (!registrationResponse.ok) {
                    const errorData = await registrationResponse.json();
                    throw new Error(errorData.error || 'Erro ao criar inscrição');
                }

                alert('✅ Inscrição enviada para aprovação! Aguarde a liberação antes de realizar o pagamento.');
                setLoading(false);
                return;
            }

            // 4. Só criar pagamento se a inscrição estiver aprovada
            if (existingRegistration.status === 'approved') {
                // ✅ Seu código de pagamento PIX aqui (mantido igual)
                const paymentResponse = await fetch('/api/pix/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transaction_amount: selectedEvent.price,
                        description: `Inscrição: ${selectedEvent.title} - ${selectedSenior.name}`,
                        payment_method_id: 'pix',
                        payer: {
                            email: selectedSenior.email || 'idoso@igreja.com',
                            first_name: selectedSenior.name.split(' ')[0],
                            last_name: selectedSenior.name.split(' ').slice(1).join(' ') || '',
                        },
                        metadata: {
                            registrationType: 'senior',
                            seniorId: selectedSenior.id,
                            seniorName: selectedSenior.name,
                            eventId: selectedEvent.id,
                            eventName: selectedEvent.title,
                            secretaryId: userData.uid
                        }
                    })
                });

                const paymentResult = await paymentResponse.json();

                if (!paymentResponse.ok) {
                    throw new Error(paymentResult.error || 'Erro ao criar pagamento');
                }

                // ✅ Atualizar a inscrição existente com o ID do pagamento
                const updateResponse = await fetch('/api/secretary/update-registration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        registrationId: existingRegistration.id,
                        paymentId: paymentResult.id,
                        paymentStatus: 'pending'
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error('Erro ao atualizar inscrição');
                }

                // ✅ Mostrar modal de pagamento
                setPaymentData({
                    ...paymentResult,
                    senior: selectedSenior,
                    event: selectedEvent,
                    registrationId: existingRegistration.id
                });
                setShowPaymentModal(true);
            }

        } catch (error: any) {
            console.error('Erro no processo:', error);
            alert('Erro: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const availableEvents = events.filter(event =>
        event.status === 'active' &&
        (event.currentParticipants || 0) < (event.maxParticipants || Infinity)
    );

    return (
        <div className="space-y-6">
            <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 text-lg">👨‍💼 Inscrição de Idoso por Secretário</h3>
                <p className="text-blue-700 text-sm">
                    Selecione um evento disponível e depois escolha ou cadastre um idoso para realizar a inscrição.
                </p>
            </div>

            <EventSelector
                events={availableEvents}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
            />

            {selectedEvent && (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-3">Selecionar Idoso:</h4>

                        <SeniorAutocomplete
                            onSeniorSelect={handleSeniorSelect}
                            selectedSenior={selectedSenior}
                            secretaryId={userData?.uid || ''}
                        />

                        {!selectedSenior ? (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold mt-3"
                            >
                                ＋ Cadastrar Novo Idoso
                            </button>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-medium text-gray-800 mb-2">Idoso Selecionado:</h5>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Nome:</strong> {selectedSenior.name}</p>
                                        <p><strong>Telefone:</strong> {selectedSenior.phone}</p>
                                        <p><strong>CPF:</strong> {selectedSenior.cpf}</p>
                                        <p><strong>Igreja:</strong> {selectedSenior.church}</p>
                                        <p><strong>Pastor:</strong> {selectedSenior.pastor}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? '⏳ Processando...' : `💰 Realizar Inscrição - R$ ${selectedEvent.price?.toFixed(2) || '0,00'}`}
                                </button>

                                <button
                                    onClick={() => setSelectedSenior(null)}
                                    className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                                >
                                    🔄 Selecionar Outro Idoso
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setSelectedEvent(null)}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                        🔄 Selecionar Outro Evento
                    </button>
                </div>
            )}

            <AddSeniorModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSeniorAdded={handleSeniorAdded}
                secretaryId={userData?.uid || ''}
            />

            {showPaymentModal && paymentData && (
                <PaymentModal
                    paymentData={paymentData}
                    onClose={() => {
                        setShowPaymentModal(false);
                        onComplete();
                    }}
                    onCopyPix={() => {
                        navigator.clipboard.writeText(paymentData.qr_code);
                        alert('Código PIX copiado!');
                    }}
                    onCheckStatus={async () => {
                        try {
                            const response = await fetch(
                                `/api/pix/status?paymentId=${paymentData.paymentId}&registrationId=${paymentData.registrationId}`
                            );
                            const status = await response.json();

                            if (status.status === 'approved') {
                                alert('✅ Pagamento confirmado! Inscrição ativada.');
                                setShowPaymentModal(false);
                                onComplete();
                            } else {
                                alert('⏳ Pagamento ainda não confirmado. Tente novamente em alguns instantes.');
                            }
                        } catch (error) {
                            alert('Erro ao verificar status do pagamento.');
                        }
                    }}
                />
            )}

            <button
                onClick={onComplete}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
            >
                ← Voltar para Home
            </button>
        </div>
    );
}