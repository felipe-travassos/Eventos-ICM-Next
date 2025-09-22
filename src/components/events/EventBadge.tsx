// components/Events/EventBadge.tsx
'use client';

import React, { useState } from 'react';
import { Event, EventRegistration } from '@/types';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

interface EventBadgeProps {
    event: Event;
    registration: EventRegistration;
    onClose?: () => void;
}

// Estilos MINIMALISTAS e SEGUROS
const styles = StyleSheet.create({
    page: {
        padding: 0,
        backgroundColor: '#ffffff',
    },
    container: {
        width: '100%',
        height: '100%',
        border: '1pt solid #000000',
        padding: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    header: {
        textAlign: 'center',
        marginBottom: 4,
        borderBottom: '1pt solid #cccccc',
        paddingBottom: 3,
    },
    eventTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    eventDate: {
        fontSize: 6,
        marginBottom: 1,
    },
    eventLocation: {
        fontSize: 6,
    },
    userSection: {
        textAlign: 'center',
        marginVertical: 4,
    },
    userName: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    userInfo: {
        fontSize: 6,
        marginBottom: 1,
    },
    qrSection: {
        alignItems: 'center',
        marginVertical: 3,
    },
    qrPlaceholder: {
        width: 30,
        height: 30,
        border: '1pt solid #999999',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    qrText: {
        fontSize: 5,
        color: '#666666',
    },
    footer: {
        textAlign: 'center',
        marginTop: 3,
        borderTop: '1pt solid #cccccc',
        paddingTop: 2,
    },
    badgeNumber: {
        fontSize: 6,
        marginBottom: 1,
    },
    status: {
        fontSize: 6,
        fontWeight: 'bold',
    },
});

// Função para gerar QR code como data URL
const generateQRCode = async (eventId: string, registrationId: string): Promise<string> => {
    try {
        // Cria um identificador único para o QR code
        const qrData = `${eventId}-${registrationId}`;
        return await QRCode.toDataURL(qrData, {
            width: 100,
            margin: 0,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'H', // Alta correção de erros para melhor leitura
        });
    } catch (err) {
        console.error('Erro ao gerar QR code:', err);
        return '';
    }
};

// Componente PDF CORRIGIDO - sem quebra de texto
const BadgePDFContent = ({ event, registration }: EventBadgeProps) => {
    // Estado para armazenar o QR code
    const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
    
    // Gera o QR code quando o componente é montado
    React.useEffect(() => {
        const loadQRCode = async () => {
            const dataURL = await generateQRCode(event.id, registration.id);
            setQrCodeDataURL(dataURL);
        };
        
        loadQRCode();
    }, [event.id, registration.id]);
    
    // Função para evitar quebras no meio das palavras
    const formatText = (text: string, maxLength: number) => {
        if (!text) return '';

        // Remove hífens problemáticos
        const cleanText = text.replace(/[-–—]/g, ' ');

        if (cleanText.length <= maxLength) return cleanText;

        // Encontra o último espaço dentro do limite
        const truncated = cleanText.substring(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');

        if (lastSpaceIndex > 0) {
            return truncated.substring(0, lastSpaceIndex);
        }

        return truncated;
    };

    const eventTitle = formatText(event?.title || 'Evento', 18);
    const eventDate = event?.date ? new Date(event.date).toLocaleDateString('pt-BR') : 'Data';
    const eventLocation = formatText(event?.location || 'Local', 22);
    const userName = formatText(registration?.userName || 'Nome', 22);
    const userPhone = registration?.userPhone || 'Sem tel';
    const churchName = formatText(registration?.churchName || 'Igreja', 28);
    const pastorName = formatText(registration?.pastorName || 'Pastor', 22);
    const badgeId = registration?.id ? registration.id.slice(-4).toUpperCase() : '0000';

    return (
        <Document>
            <Page size="A8" orientation="portrait" style={styles.page}>
                <View style={styles.container}>
                    {/* Cabeçalho do Evento */}
                    <View style={styles.header}>
                        <Text style={styles.eventTitle}>{eventTitle}</Text>
                        <Text style={styles.eventDate}>{eventDate}</Text>
                        <Text style={styles.eventLocation}>{eventLocation}</Text>
                    </View>

                    {/* Informações do Participante */}
                    <View style={styles.userSection}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userInfo}>{userPhone}</Text>
                        <Text style={styles.userInfo}>{churchName}</Text>
                        <Text style={styles.userInfo}>Pr. {pastorName}</Text>
                    </View>

                    {/* Área do QR Code */}
                    <View style={styles.qrSection}>
                        {qrCodeDataURL ? (
                            <Image src={qrCodeDataURL} style={styles.qrPlaceholder} />
                        ) : (
                            <View style={styles.qrPlaceholder}>
                                <Text style={styles.qrText}>QR CODE</Text>
                            </View>
                        )}
                        <Text style={styles.qrText}>ID: {badgeId}</Text>
                    </View>

                    {/* Rodapé e Status */}
                    <View style={styles.footer}>
                        <Text style={styles.badgeNumber}>Crachá #{badgeId}</Text>
                        <Text style={styles.status}>
                            {registration.paymentStatus === 'paid' ? '✅ PAGO' : '⏳ PENDENTE'}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// Componente principal do crachá
export default function EventBadge({ event, registration, onClose }: EventBadgeProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewQR, setPreviewQR] = useState<string>('');
    
    // Gera um QR code para preview na interface
    React.useEffect(() => {
        const loadPreviewQR = async () => {
            const dataURL = await generateQRCode(event.id, registration.id);
            setPreviewQR(dataURL);
        };
        
        loadPreviewQR();
    }, [event.id, registration.id]);

    const handleDownloadBadge = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cria o elemento PDF com os dados do evento e da inscrição
            const pdfElement = <BadgePDFContent event={event} registration={registration} />;
            
            // Gera o blob do PDF
            const blob = await pdf(pdfElement).toBlob();

            // Cria uma URL para o blob
            const url = URL.createObjectURL(blob);
            
            // Cria um nome de arquivo seguro para download
            const safeFileName = `cracha_${event.title}_${registration.userName}.pdf`
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/\s+/g, '_') // Substitui espaços por underscores
                .replace(/[^a-z0-9_]/gi, '') // Remove caracteres especiais
                .toLowerCase();

            // Cria um elemento de link para download
            const link = document.createElement('a');
            link.href = url;
            link.download = safeFileName;

            // Adiciona o link ao documento, clica nele e o remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpa a URL e fecha o modal após um breve delay
            setTimeout(() => {
                URL.revokeObjectURL(url);
                setLoading(false);
                if (onClose) onClose();
            }, 300); // Aumentado para 300ms para garantir que o download inicie

        } catch (error) {
            console.error('Erro ao gerar crachá:', error);
            setError('Não foi possível gerar o crachá. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🎫 Gerar Crachá</h3>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                        <p className="flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </p>
                    </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-2">Participante:</h4>
                    <p className="text-gray-800 font-medium">{registration.userName}</p>
                    <p className="text-gray-600 text-sm">{registration.userPhone || 'Telefone não informado'}</p>
                    <p className="text-gray-600 text-sm">{registration.churchName}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">Evento:</h4>
                    <p className="text-blue-800 font-medium">{event.title}</p>
                    <p className="text-blue-600 text-sm">
                        {event.date instanceof Date ? event.date.toLocaleDateString('pt-BR') : new Date(event.date).toLocaleDateString('pt-BR')} • {event.location}
                    </p>
                </div>
                
                <div className="flex items-center justify-center mb-6">
                    <div className="flex flex-col items-center">
                        <div className="border border-gray-300 rounded-lg p-2 bg-white mb-2">
                            {previewQR ? (
                                <img src={previewQR} alt="QR Code" className="w-24 h-24" />
                            ) : (
                                <div className="w-24 h-24 flex items-center justify-center bg-gray-100">
                                    <span className="text-gray-400 text-xs">Gerando...</span>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-500">QR Code de verificação</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownloadBadge}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Gerando PDF...
                            </>
                        ) : (
                            <>📥 Baixar Crachá</>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-600 hover:text-gray-800 py-2 border border-gray-300 rounded disabled:opacity-50 transition-all duration-200"
                    >
                        Cancelar
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    💡 Baixe o PDF e imprima em papel A8 (52x74mm)
                </p>
                <p className="text-xs text-gray-400 mt-1 text-center">
                    O crachá inclui um QR code para verificação de presença
                </p>
            </div>
        </div>
    );
}