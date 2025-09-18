//src\components\SecretaryPaymentFlow.tsx
'use client';

import React, { useState, useEffect } from 'react';
import SeniorAutocomplete from './SeniorAutocomplete';
import AddSeniorModal from './AddSeniorModal';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types';
import EventSelector from './events/EventSelector';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface SecretaryPaymentFlowProps {
    events: Event[];
    onComplete: () => void;
}

interface ChurchInfo {
    churchId: string;
    churchName: string;
    pastorName: string;
}

export default function SecretaryPaymentFlow({
    events,
    onComplete
}: SecretaryPaymentFlowProps) {
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedSenior, setSelectedSenior] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null);
    const [loadingChurch, setLoadingChurch] = useState(false);
    const { userData } = useAuth();

    // Buscar informações da igreja
    useEffect(() => {
        const fetchChurchInfo = async () => {
            if (!userData?.churchId) return;

            setLoadingChurch(true);
            try {
                const response = await fetch(`/api/churches/${userData.churchId}`);
                if (response.ok) {
                    const churchData = await response.json();
                    setChurchInfo({
                        churchId: userData.churchId,
                        churchName: churchData.name,
                        pastorName: churchData.pastorName
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar informações da igreja:', error);
            } finally {
                setLoadingChurch(false);
            }
        };

        fetchChurchInfo();
    }, [userData?.churchId]);

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

    const handleRegistration = async () => {
        if (!selectedSenior || !selectedEvent || !userData) return;

        setLoading(true);

        try {
            console.log('📝 Iniciando inscrição direta no Firestore...');

            // 1. Verificar se já existe uma inscrição
            const registrationsRef = collection(db, 'registrations');
            const q = query(
                registrationsRef,
                where('eventId', '==', selectedEvent.id),
                where('userId', '==', selectedSenior.id)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingRegistration = querySnapshot.docs[0].data();
                const statusMessages: { [key: string]: string } = {
                    'pending': '⏳ Esta inscrição está aguardando aprovação.',
                    'approved': '✅ Esta inscrição já foi aprovada e está ativa.',
                    'rejected': '❌ Esta inscrição foi rejeitada.'
                };

                const statusMessage = statusMessages[existingRegistration.status] || 'ℹ️ Esta inscrição já existe.';
                alert(statusMessage);
                setLoading(false);
                return;
            }

            // 2. Criar nova inscrição diretamente no Firestore
            const registrationData = {
                // Dados do evento
                eventId: selectedEvent.id,
                eventName: selectedEvent.title,

                // Dados do participante (idoso)
                userId: selectedSenior.id,
                userName: selectedSenior.name,
                userEmail: selectedSenior.email || '',
                userPhone: selectedSenior.phone,
                userCpf: selectedSenior.cpf,
                userChurch: selectedSenior.churchId || '', // ID da igreja se tiver
                churchName: selectedSenior.church,         // Nome da igreja
                pastorName: selectedSenior.pastor,

                // Status
                status: 'pending',
                paymentStatus: 'pending',

                // Dados do secretário
                secretaryId: userData.uid,
                secretaryName: userData.name,

                // Timestamps
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('💾 Salvando inscrição no Firestore:', registrationData);

            // Salvar diretamente no Firestore
            const docRef = await addDoc(collection(db, 'registrations'), registrationData);

            console.log('✅ Inscrição salva com ID:', docRef.id);

            alert('✅ Inscrição enviada para aprovação! Aguarde a liberação do secretário responsável.');

            // Limpar seleções após sucesso
            setSelectedSenior(null);
            setSelectedEvent(null);

        } catch (error: any) {
            console.error('❌ Erro ao salvar inscrição:', error);
            alert('Erro: ' + (error.message || 'Erro ao salvar inscrição.'));
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
                    A inscrição ficará pendente até aprovação.
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
                                    onClick={handleRegistration}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? '⏳ Enviando...' : '📝 Enviar Inscrição para Aprovação'}
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
                churchId={churchInfo?.churchId || ''}
                churchName={churchInfo?.churchName || ''}
                pastorName={churchInfo?.pastorName || ''}
                loadingChurch={loadingChurch}
            />

            <button
                onClick={onComplete}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
            >
                ← Voltar para Home
            </button>
        </div>
    );
}