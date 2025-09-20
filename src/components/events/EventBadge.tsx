// components/Events/EventBadge.tsx
'use client';

import React, { useState } from 'react';
import { Event, EventRegistration } from '@/types';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

interface EventBadgeProps {
    event: Event;
    registration: EventRegistration;
    onClose?: () => void;
}

// Estilos MINIMALISTAS e SEGUROS
const styles = StyleSheet.create({
    page: {
        width: 80,
        height: 120,
        padding: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    section: {
        margin: 5,
        padding: 3,
        textAlign: 'center'
    },
    title: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2
    },
    date: {
        fontSize: 8,
        marginBottom: 1
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 3
    },
    info: {
        fontSize: 8,
        marginBottom: 1
    },
    qrArea: {
        width: 40,
        height: 40,
        border: '1pt solid #ccc',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5
    },
    qrText: {
        fontSize: 6,
        color: '#666'
    },
    footer: {
        fontSize: 7,
        textAlign: 'center',
        marginTop: 3
    }
});

// Componente PDF CORRETO
const BadgePDFContent = ({ event, registration }: EventBadgeProps) => {
    const eventTitle = event?.title?.substring(0, 15) || 'Evento';
    const eventDate = event?.date ? new Date(event.date).toLocaleDateString('pt-BR') : 'Data';
    const eventLocation = event?.location?.substring(0, 20) || 'Local';
    const userName = registration?.userName?.substring(0, 20) || 'Nome';
    const userPhone = registration?.userPhone || 'Sem tel';
    const churchName = registration?.churchName?.substring(0, 25) || 'Igreja';
    const pastorName = registration?.pastorName?.substring(0, 20) || 'Pastor';
    const badgeId = registration?.id ? registration.id.slice(-4).toUpperCase() : '0000';

    return (
        <Document>
            <Page size={[80, 120]} style={styles.page}>
                {/* Evento */}
                <View style={styles.section}>
                    <Text style={styles.title}>{eventTitle.toUpperCase()}</Text>
                    <Text style={styles.date}>{eventDate}</Text>
                    <Text style={styles.date}>{eventLocation}</Text>
                </View>

                {/* Participante */}
                <View style={styles.section}>
                    <Text style={styles.userName}>{userName.toUpperCase()}</Text>
                    <Text style={styles.info}>{userPhone}</Text>
                    <Text style={styles.info}>{churchName}</Text>
                    <Text style={styles.info}>Pr. {pastorName}</Text>
                </View>

                {/* QR Code */}
                <View style={styles.section}>
                    <View style={styles.qrArea}>
                        <Text style={styles.qrText}>QR CODE</Text>
                    </View>
                    <Text style={styles.info}>ID: {badgeId}</Text>
                </View>

                {/* Status */}
                <View style={styles.section}>
                    <Text style={styles.footer}>
                        {registration.paymentStatus === 'paid' ? '✅ PAGO' : '⏳ PENDENTE'}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Componente principal do crachá
export default function EventBadge({ event, registration, onClose }: EventBadgeProps) {
    const [loading, setLoading] = useState(false);

    const handleDownloadBadge = async () => {
        try {
            setLoading(true);

            const pdfElement = <BadgePDFContent event={event} registration={registration} />;
            const blob = await pdf(pdfElement).toBlob();

            // ✅ SOLUÇÃO: Criar link de download sem abrir nova janela
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cracha_${event.title}_${registration.userName}.pdf`
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '_')
                .toLowerCase();

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar após download
            setTimeout(() => {
                URL.revokeObjectURL(url);
                setLoading(false);
                if (onClose) onClose();
            }, 100);

        } catch (error) {
            console.error('Erro ao baixar:', error);
            alert('Erro ao baixar crachá.');
            setLoading(false);
        }
    };

    const handlePrintBadge = async () => {
        try {
            setLoading(true);

            const pdfElement = <BadgePDFContent event={event} registration={registration} />;
            const blob = await pdf(pdfElement).toBlob();

            // ✅ SOLUÇÃO: Usar iframe em vez de window.open
            const url = URL.createObjectURL(blob);

            // Criar iframe para impressão
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;

            document.body.appendChild(iframe);

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.print();

                    // Limpar após impressão
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        URL.revokeObjectURL(url);
                        setLoading(false);
                        if (onClose) onClose();
                    }, 1000);
                } catch (error) {
                    console.error('Erro na impressão:', error);
                    alert('Não foi possível imprimir. Faça o download e imprima manualmente.');
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                    setLoading(false);
                }
            };

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar crachá para impressão.');
            setLoading(false);
        }
    };

    // ✅ SOLUÇÃO ALTERNATIVA: Download + instruções para imprimir
    const handleDownloadAndPrint = async () => {
        try {
            setLoading(true);

            const pdfElement = <BadgePDFContent event={event} registration={registration} />;
            const blob = await pdf(pdfElement).toBlob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `cracha_${event.title}_${registration.userName}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Crachá baixado! Abra o arquivo PDF e use Ctrl+P para imprimir.');

            setTimeout(() => {
                URL.revokeObjectURL(url);
                setLoading(false);
                if (onClose) onClose();
            }, 100);

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao baixar crachá.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🎫 Gerar Crachá</h3>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Participante:</h4>
                    <p className="text-gray-800 font-medium">{registration.userName}</p>
                    <p className="text-gray-600 text-sm">{registration.userPhone || 'Telefone não informado'}</p>
                    <p className="text-gray-600 text-sm">{registration.churchName}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2">Evento:</h4>
                    <p className="text-blue-800 font-medium">{event.title}</p>
                    <p className="text-blue-600 text-sm">
                        {event.date.toLocaleDateString('pt-BR')} • {event.location}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownloadAndPrint}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                        {loading ? '⏳ Gerando...' : '📥 Baixar PDF para Impressão'}
                    </button>

                    <button
                        onClick={handleDownloadBadge}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                        {loading ? '⏳ Gerando...' : '📁 Apenas Baixar'}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-600 hover:text-gray-800 py-2 border border-gray-300 rounded disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    💡 Recomendado: Baixe o PDF e imprima manualmente
                </p>
            </div>
        </div>
    );
}