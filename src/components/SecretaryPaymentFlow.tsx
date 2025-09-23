'use client';

import React, { useState, useEffect } from 'react';
import PersonAutocomplete from './PersonAutocomplete';
import AddSeniorModal from './AddSeniorModal';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types';
import EventSelector from './events/EventSelector';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

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
    const [loadingChurch, setLoadingChurch] = useState(true);
    const [churchInfoError, setChurchInfoError] = useState<string | null>(null);
    const { userData } = useAuth();

    // Buscar informações da igreja diretamente no Firestore
    useEffect(() => {
        const fetchChurchInfo = async () => {
            if (!userData?.churchId) {
                setChurchInfoError('ID da igreja não encontrado');
                setLoadingChurch(false);
                return;
            }

            setLoadingChurch(true);
            setChurchInfoError(null);

            try {
                console.log('Buscando igreja no Firestore com ID:', userData.churchId);

                // Buscar documento da igreja diretamente no Firestore
                const churchDocRef = doc(db, 'churches', userData.churchId);
                const churchDoc = await getDoc(churchDocRef);

                if (!churchDoc.exists()) {
                    throw new Error('Igreja não encontrada no banco de dados');
                }

                const churchData = churchDoc.data();
                console.log('Dados da igreja encontrados:', churchData);

                setChurchInfo({
                    churchId: userData.churchId,
                    churchName: churchData.name || churchData.churchName || 'Igreja não informada',
                    pastorName: churchData.pastorName || churchData.pastor || 'Pastor não informado'
                });

            } catch (error: any) {
                console.error('Erro ao buscar informações da igreja no Firestore:', error);
                setChurchInfoError(error.message || 'Erro ao carregar informações da igreja');

                // Fallback para dados básicos se disponível no userData
                if (userData.churchName) {
                    setChurchInfo({
                        churchId: userData.churchId,
                        churchName: userData.churchName,
                        pastorName: userData.pastorName || 'Pastor não informado'
                    });
                    setChurchInfoError(null);
                }
            } finally {
                setLoadingChurch(false);
            }
        };

        if (userData?.churchId) {
            fetchChurchInfo();
        } else {
            setLoadingChurch(false);
        }
    }, [userData?.churchId]);

    const handleOpenAddModal = () => {
        if (loadingChurch) {
            toast.info('Aguarde, carregando informações da igreja...');
            return;
        }

        // Permite abrir o modal mesmo se houver erro, desde que tenha churchId
        if (!userData?.churchId) {
            toast.error('ID da igreja não disponível. Não é possível cadastrar idoso.');
            return;
        }

        setShowAddModal(true);
    };

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
        if (!selectedSenior || !selectedSenior.id || !selectedEvent || !selectedEvent.id || !userData) {
            toast.warning('Por favor, selecione um evento e um idoso válidos.');
            setLoading(false);
            return;
        }

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
                toast.info(statusMessage);
                setLoading(false);
                return;
            }

            // 1.5. Verificar se CPF já está inscrito no evento
            const cpfQuery = query(
                registrationsRef,
                where('eventId', '==', selectedEvent.id),
                where('userCpf', '==', selectedSenior.cpf)
            );

            const cpfQuerySnapshot = await getDocs(cpfQuery);

            if (!cpfQuerySnapshot.empty) {
                toast.error('❌ Este CPF já possui uma inscrição neste evento.');
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
                userChurch: selectedSenior.churchId || churchInfo?.churchId || userData.churchId,
                churchName: selectedSenior.church || churchInfo?.churchName || userData.churchName || '',
                pastorName: selectedSenior.pastor || churchInfo?.pastorName || userData.pastorName || '',

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

            toast.success('✅ Inscrição enviada para aprovação! Aguarde a liberação do secretário responsável.');

            // Limpar seleções após sucesso
            setSelectedSenior(null);
            setSelectedEvent(null);

        } catch (error: any) {
            console.error('❌ Erro ao salvar inscrição:', error);
            toast.error('Erro: ' + (error.message || 'Erro ao salvar inscrição.'));
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
                <h3 className="font-semibold text-blue-800 mb-2 text-lg">👨‍💼 Inscrição Avulsa por Secretário</h3>
                <p className="text-blue-700 text-sm">
                    Selecione um evento disponível e depois escolha ou cadastre uma pessoa para realizar a inscrição.
                    A inscrição ficará pendente até aprovação.
                </p>
            </div>

            {/* Mostrar status do carregamento da igreja */}
            {loadingChurch && (
                <div className="bg-yellow-100 p-3 rounded-lg">
                    <p className="text-yellow-800">Carregando informações da igreja...</p>
                </div>
            )}

            {churchInfoError && (
                <div className="bg-red-100 p-3 rounded-lg">
                    <p className="text-red-800">⚠️ {churchInfoError}</p>
                    {userData?.churchName && (
                        <p className="text-red-700 text-sm mt-1">
                            Usando informações básicas: {userData.churchName}
                        </p>
                    )}
                </div>
            )}

            <EventSelector
                events={availableEvents}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
            />

            {selectedEvent && (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-800 mb-3">Selecionar Pessoa:</h4>

                        <PersonAutocomplete
                            onPersonSelect={handleSeniorSelect}
                            selectedPerson={selectedSenior || null}
                            secretaryId={userData?.id || ''}
                        />

                        {!selectedSenior ? (
                            <button
                                onClick={handleOpenAddModal}
                                disabled={loadingChurch || !userData?.churchId}
                                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingChurch ? 'Carregando...' :
                                    !userData?.churchId ? 'Sem ID da igreja' :
                                        '＋ Cadastrar Nova Pessoa'}
                            </button>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-medium text-gray-800 mb-2">Pessoa Selecionada:</h5>
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
                                    🔄 Selecionar Outra Pessoa
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
                churchInfo={churchInfo}
                secretaryId={userData?.uid || ''}
                churchId={userData?.churchId || ''}
                churchName={churchInfo?.churchName || userData?.churchName || ''}
                pastorName={churchInfo?.pastorName || userData?.pastorName || ''}
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