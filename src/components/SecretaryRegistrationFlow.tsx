// components/SecretaryRegistrationFlow.tsx
'use client';

import React, { useEffect, useState } from 'react';
import SeniorAutocomplete from './SeniorAutocomplete';
import AddSeniorModal from './AddSeniorModal';
import PaymentModal from './PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/config';



interface SecretaryRegistrationFlowProps {
    event: any;
    onComplete: () => void;
}



export default function SecretaryRegistrationFlow({
    event,
    onComplete
}: SecretaryRegistrationFlowProps) {
    const [selectedSenior, setSelectedSenior] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { userData, currentUser } = useAuth();
    const [currentChurch, setCurrentChurch] = useState(null);

    useEffect(() => {
        const fetchChurchData = async () => {
            if (currentUser?.churchId) {
                const churchDoc = await getDoc(doc(db, 'churches', currentUser.churchId));
                if (churchDoc.exists()) {
                    setCurrentChurch(churchDoc.data());
                }
            }
        };

        fetchChurchData();
    }, [currentUser]);

    const handleSeniorSelect = (senior: any) => {
        setSelectedSenior(senior);
    };

    const handleSeniorAdded = (newSenior: any) => {
        setSelectedSenior(newSenior);
        setShowAddModal(false);
    };

    const handleRegistration = async () => {
        if (!selectedSenior || !userData) return;

        setLoading(true);

        try {
            // 1. Criar pagamento PIX
            const paymentResponse = await fetch('/api/pix/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_amount: event.price,
                    description: `Inscrição: ${event.title} - ${selectedSenior.name}`,
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
                        eventId: event.id,
                        eventName: event.title,
                        secretaryId: userData.uid
                    }
                })
            });

            const paymentResult = await paymentResponse.json();

            if (!paymentResponse.ok) {
                throw new Error(paymentResult.error);
            }

            // 2. Salvar inscrição
            const registrationResponse = await fetch('/api/secretary/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: 'secret-key-123',
                    secretaryId: userData.uid,
                    secretaryName: userData.name,
                    eventId: event.id,
                    eventName: event.title,
                    seniorId: selectedSenior.id,
                    userName: selectedSenior.name,
                    userEmail: selectedSenior.email,
                    userPhone: selectedSenior.phone,
                    userCpf: selectedSenior.cpf,
                    churchName: selectedSenior.church,
                    pastorName: selectedSenior.pastor,
                    paymentId: paymentResult.id
                })
            });

            const registrationResult = await registrationResponse.json();

            if (!registrationResponse.ok) {
                throw new Error(registrationResult.error);
            }

            // 3. Mostrar QR Code do PIX
            setPaymentData({
                ...paymentResult,
                senior: selectedSenior,
                event: event,
                registrationId: registrationResult.registrationId
            });

        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentComplete = () => {
        setPaymentData(null);
        setSelectedSenior(null);
        onComplete();
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Inscrição para Idoso</h3>
                <p className="text-blue-700 text-sm">
                    Busque por um idoso já cadastrado ou cadastre um novo.
                </p>
            </div>

            <SeniorAutocomplete
                onSeniorSelect={handleSeniorSelect}
                selectedSenior={selectedSenior}
                secretaryId={userData?.uid || ''}
            />

            {!selectedSenior && (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                    ＋ Cadastrar Novo Idoso
                </button>
            )}

            {selectedSenior && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-2">Idoso Selecionado</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Nome:</span> {selectedSenior.name}</p>
                        <p><span className="font-medium">Idade:</span> {selectedSenior.age} anos</p>
                        <p><span className="font-medium">Telefone:</span> {selectedSenior.phone}</p>
                        <p><span className="font-medium">Igreja:</span> {selectedSenior.church}</p>
                    </div>

                    <div className="mt-4 bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-800 text-sm font-medium">
                            Valor da Inscrição: R$ {event.price.toFixed(2)}
                        </p>
                    </div>

                    <button
                        onClick={handleRegistration}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 mt-4 transition-colors"
                    >
                        {loading ? 'Processando...' : 'Realizar Inscrição'}
                    </button>
                </div>
            )}

            {showAddModal && (
                <AddSeniorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSeniorAdded={handleSeniorAdded}
                    secretaryId={currentUser.uid} // ID do usuário logado
                    userChurchId={currentUser.churchId} // ID da igreja do usuário
                    userChurchName={currentUser.churchName} // Nome da igreja do usuário
                    pastorName={currentChurch?.pastorName} // Nome do pastor (buscar da coleção churches)
                />
            )}

            {paymentData && (
                <PaymentModal
                    paymentData={paymentData}
                    onClose={handlePaymentComplete}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}
        </div>
    );
}