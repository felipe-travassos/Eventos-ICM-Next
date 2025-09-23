'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Event, EventRegistration } from '@/types';
import QrScanner from 'qr-scanner';
import { toast } from 'sonner';

interface CheckInStats {
    total: number;
    checkedIn: number;
    pending: number;
    approved: number;
    paid: number;
}

export default function CheckInPage() {
    const params = useParams();
    const router = useRouter();
    const { userData } = useAuth();
    const eventId = params.eventId as string;

    // Estados
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [stats, setStats] = useState<CheckInStats>({
        total: 0,
        checkedIn: 0,
        pending: 0,
        approved: 0,
        paid: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showManualSearch, setShowManualSearch] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<QrScanner | null>(null);

    // Verificar permissões
    const allowedRoles = ['secretario_local', 'secretario_regional'];
    const hasPermission = userData && allowedRoles.includes(userData.role);

    // Carregar dados do evento e inscrições
    const loadEventData = useCallback(async () => {
        if (!eventId || !hasPermission) return;

        try {
            setLoading(true);

            // Carregar evento
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (!eventDoc.exists()) {
                toast.error('Evento não encontrado');
                router.push('/admin/events');
                return;
            }

            const eventData = eventDoc.data();
            const eventObj: Event = {
                id: eventDoc.id,
                title: eventData.title || 'Evento sem título',
                description: eventData.description || '',
                date: eventData.date?.toDate() || new Date(),
                endDate: eventData.endDate?.toDate(),
                location: eventData.location || '',
                maxParticipants: Number(eventData.maxParticipants) || 0,
                currentParticipants: Number(eventData.currentParticipants) || 0,
                price: Number(eventData.price) || 0,
                churchId: eventData.churchId || '',
                churchName: eventData.churchName || '',
                status: eventData.status || 'active',
                createdAt: eventData.createdAt?.toDate() || new Date(),
                updatedAt: eventData.updatedAt?.toDate() || new Date(),
            };
            setEvent(eventObj);

            // Carregar inscrições
            const registrationsQuery = query(
                collection(db, 'eventRegistrations'),
                where('eventId', '==', eventId),
                where('status', '==', 'approved')
            );

            const registrationsSnapshot = await getDocs(registrationsQuery);
            const registrationsData: EventRegistration[] = registrationsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    eventId: data.eventId,
                    userId: data.userId,
                    userType: data.userType || 'user',
                    seniorId: data.seniorId,
                    userName: data.userName,
                    userEmail: data.userEmail,
                    userPhone: data.userPhone,
                    userChurch: data.userChurch,
                    churchName: data.churchName,
                    userCpf: data.userCpf,
                    pastorName: data.pastorName,
                    status: data.status,
                    paymentStatus: data.paymentStatus,
                    paymentDate: data.paymentDate?.toDate(),
                    registeredBy: data.registeredBy,
                    registeredByName: data.registeredByName,
                    registrationType: data.registrationType,
                    paymentId: data.paymentId,
                    approvedBy: data.approvedBy,
                    approvedAt: data.approvedAt?.toDate(),
                    rejectionReason: data.rejectionReason,
                    rejectedBy: data.rejectedBy,
                    checkedIn: data.checkedIn || false,
                    checkedInAt: data.checkedInAt?.toDate(),
                    checkedInBy: data.checkedInBy,
                    checkedInByName: data.checkedInByName,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                };
            });

            setRegistrations(registrationsData);
            calculateStats(registrationsData);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados do evento');
        } finally {
            setLoading(false);
        }
    }, [eventId, hasPermission, router]);

    // Calcular estatísticas
    const calculateStats = (regs: EventRegistration[]) => {
        const stats: CheckInStats = {
            total: regs.length,
            checkedIn: regs.filter(r => r.checkedIn).length,
            pending: regs.filter(r => !r.checkedIn).length,
            approved: regs.filter(r => r.status === 'approved').length,
            paid: regs.filter(r => r.paymentStatus === 'paid').length,
        };
        setStats(stats);
    };

    // Inicializar scanner
    const startScanner = async () => {
        if (!videoRef.current || scanning) return;

        try {
            setScanning(true);
            
            const scanner = new QrScanner(
                videoRef.current,
                (result) => handleQRCodeScan(result.data),
                {
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: 'environment', // Câmera traseira
                }
            );

            scannerRef.current = scanner;
            await scanner.start();
            
        } catch (error) {
            console.error('Erro ao iniciar scanner:', error);
            toast.error('Erro ao acessar a câmera. Verifique as permissões.');
            setScanning(false);
        }
    };

    // Parar scanner
    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop();
            scannerRef.current.destroy();
            scannerRef.current = null;
        }
        setScanning(false);
    };

    // Processar QR Code escaneado
    const handleQRCodeScan = async (qrData: string) => {
        try {
            // Formato esperado: eventId-registrationId
            const [scannedEventId, registrationId] = qrData.split('-');

            if (scannedEventId !== eventId) {
                toast.error('QR Code de outro evento!');
                return;
            }

            const registration = registrations.find(r => r.id === registrationId);
            if (!registration) {
                toast.error('Inscrição não encontrada ou não aprovada!');
                return;
            }

            if (registration.checkedIn) {
                toast.warning(`${registration.userName} já fez check-in!`);
                return;
            }

            // Realizar check-in
            await performCheckIn(registration);

        } catch (error) {
            console.error('Erro ao processar QR Code:', error);
            toast.error('QR Code inválido!');
        }
    };

    // Realizar check-in
    const performCheckIn = async (registration: EventRegistration) => {
        if (!userData) return;

        try {
            const registrationRef = doc(db, 'eventRegistrations', registration.id);
            
            await updateDoc(registrationRef, {
                checkedIn: true,
                checkedInAt: serverTimestamp(),
                checkedInBy: userData.id,
                checkedInByName: userData.name,
                updatedAt: serverTimestamp()
            });

            // Atualizar estado local
            const updatedRegistrations = registrations.map(r => 
                r.id === registration.id 
                    ? { 
                        ...r, 
                        checkedIn: true, 
                        checkedInAt: new Date(),
                        checkedInBy: userData.id,
                        checkedInByName: userData.name
                    }
                    : r
            );
            
            setRegistrations(updatedRegistrations);
            calculateStats(updatedRegistrations);

            toast.success(`✅ Check-in realizado: ${registration.userName}`);

        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            toast.error('Erro ao realizar check-in');
        }
    };

    // Check-in manual
    const handleManualCheckIn = async (registration: EventRegistration) => {
        if (registration.checkedIn) {
            toast.warning('Participante já fez check-in!');
            return;
        }
        await performCheckIn(registration);
    };

    // Filtrar registrações para busca manual
    const filteredRegistrations = registrations.filter(r =>
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userPhone.includes(searchTerm) ||
        r.churchName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        loadEventData();
    }, [loadEventData]);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    if (!hasPermission) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
                    <p className="text-gray-600">Apenas secretários podem acessar esta página.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando dados do evento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">📱 Check-in</h1>
                            <p className="text-gray-600">{event?.title}</p>
                            <p className="text-sm text-gray-500">
                                {event?.date.toLocaleDateString('pt-BR')} • {event?.location}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/events')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Voltar
                        </button>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-blue-600">Total</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                            <div className="text-sm text-green-600">Presentes</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-yellow-600">Pendentes</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">{stats.approved}</div>
                            <div className="text-sm text-purple-600">Aprovados</div>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
                            <div className="text-sm text-emerald-600">Pagos</div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Scanner QR Code */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">📷 Scanner QR Code</h2>
                        
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                                style={{ display: scanning ? 'block' : 'none' }}
                            />
                            
                            {!scanning && (
                                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📱</div>
                                        <p className="text-gray-500">Clique para iniciar o scanner</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 space-y-2">
                            {!scanning ? (
                                <button
                                    onClick={startScanner}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    📷 Iniciar Scanner
                                </button>
                            ) : (
                                <button
                                    onClick={stopScanner}
                                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium"
                                >
                                    ⏹️ Parar Scanner
                                </button>
                            )}
                            
                            <button
                                onClick={() => setShowManualSearch(!showManualSearch)}
                                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium"
                            >
                                🔍 Busca Manual
                            </button>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                            <p>💡 Aponte a câmera para o QR Code do crachá</p>
                            <p>• O check-in será automático após a leitura</p>
                            <p>• Use a busca manual como alternativa</p>
                        </div>
                    </div>

                    {/* Lista de Presenças */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">✅ Presenças Confirmadas</h2>
                        
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {registrations
                                .filter(r => r.checkedIn)
                                .sort((a, b) => (b.checkedInAt?.getTime() || 0) - (a.checkedInAt?.getTime() || 0))
                                .map(registration => (
                                    <div key={registration.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-green-800">{registration.userName}</div>
                                                <div className="text-sm text-green-600">{registration.churchName}</div>
                                                <div className="text-xs text-green-500">
                                                    {registration.checkedInAt?.toLocaleTimeString('pt-BR')}
                                                </div>
                                            </div>
                                            <div className="text-green-600">✅</div>
                                        </div>
                                    </div>
                                ))
                            }
                            
                            {stats.checkedIn === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-4xl mb-2">👥</div>
                                    <p>Nenhum check-in realizado ainda</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Busca Manual */}
                {showManualSearch && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Busca Manual</h2>
                        
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar por nome, telefone ou igreja..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {filteredRegistrations.map(registration => (
                                <div key={registration.id} className={`border rounded-lg p-3 ${
                                    registration.checkedIn 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-white border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium">{registration.userName}</div>
                                            <div className="text-sm text-gray-600">{registration.userPhone}</div>
                                            <div className="text-sm text-gray-600">{registration.churchName}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-1 rounded ${
                                                    registration.paymentStatus === 'paid' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {registration.paymentStatus === 'paid' ? '💰 Pago' : '⏳ Pendente'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {registration.checkedIn ? (
                                                <div className="text-center">
                                                    <div className="text-green-600 text-xl">✅</div>
                                                    <div className="text-xs text-green-600">
                                                        {registration.checkedInAt?.toLocaleTimeString('pt-BR')}
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleManualCheckIn(registration)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                                >
                                                    Check-in
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {filteredRegistrations.length === 0 && searchTerm && (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <p>Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}