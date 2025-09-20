// components/Reports/EventReports.tsx
'use client';

import React, { useState } from 'react';
import { EventWithRegistrations } from '@/types';
import { RegistrationPDF, FinancialPDF, ChurchPDF } from './PDFTemplates';
import { PDFDownloadLink } from '@react-pdf/renderer';

interface EventReportsProps {
    events: EventWithRegistrations[];
    selectedEvent: EventWithRegistrations | null;
}

interface ReportFilters {
    startDate: string;
    endDate: string;
    reportType: 'registrations' | 'financial' | 'church' | 'attendance';
    format: 'csv' | 'pdf';
}

export default function EventReports({ events, selectedEvent }: EventReportsProps) {
    const [showReports, setShowReports] = useState(false);
    const [filters, setFilters] = useState<ReportFilters>({
        startDate: '',
        endDate: '',
        reportType: 'registrations',
        format: 'csv'
    });

    const [pdfData, setPdfData] = useState<{
        event: EventWithRegistrations;
        registrations: any[];
        type: string;
        filteredData?: any[];
    } | null>(null);

    const generateRegistrationReport = () => {
        if (!selectedEvent) return [];

        return selectedEvent.registrations.map(reg => ({
            Nome: reg.userName,
            Email: reg.userEmail,
            Telefone: reg.userPhone,
            Igreja: reg.churchName,
            Pastor: reg.pastorName,
            'Status Inscrição': reg.status,
            'Status Pagamento': reg.paymentStatus,
            'Data Inscrição': reg.createdAt.toLocaleDateString('pt-BR'),
            'Data Pagamento': reg.paymentDate?.toLocaleDateString('pt-BR') || 'N/A'
        }));
    };

    const generateFinancialReport = () => {
        if (!selectedEvent) return null;

        const paidRegistrations = selectedEvent.registrations.filter(reg => reg.paymentStatus === 'paid');
        const pendingRegistrations = selectedEvent.registrations.filter(reg => reg.paymentStatus === 'pending');

        const totalRevenue = paidRegistrations.length * selectedEvent.price;
        const expectedRevenue = selectedEvent.registrations.length * selectedEvent.price;

        return {
            total: {
                'Total de Inscrições': selectedEvent.registrations.length,
                'Inscrições Pagas': paidRegistrations.length,
                'Inscrições Pendentes': pendingRegistrations.length,
                'Receita Total': `R$ ${totalRevenue.toFixed(2)}`,
                'Receita Esperada': `R$ ${expectedRevenue.toFixed(2)}`,
                'Taxa de Conversão': `${((paidRegistrations.length / selectedEvent.registrations.length) * 100).toFixed(1)}%`
            },
            details: paidRegistrations.map(reg => ({
                Nome: reg.userName,
                Igreja: reg.churchName,
                Valor: `R$ ${selectedEvent.price.toFixed(2)}`,
                'Data Pagamento': reg.paymentDate?.toLocaleDateString('pt-BR') || 'N/A'
            }))
        };
    };

    const generateChurchReport = () => {
        if (!selectedEvent) return [];

        const churchStats: { [key: string]: { count: number; paid: number; revenue: number } } = {};

        selectedEvent.registrations.forEach(reg => {
            if (!churchStats[reg.churchName]) {
                churchStats[reg.churchName] = { count: 0, paid: 0, revenue: 0 };
            }

            churchStats[reg.churchName].count++;
            if (reg.paymentStatus === 'paid') {
                churchStats[reg.churchName].paid++;
                churchStats[reg.churchName].revenue += selectedEvent.price;
            }
        });

        return Object.entries(churchStats).map(([church, stats]) => ({
            Igreja: church,
            'Total Inscritos': stats.count,
            'Inscrições Pagas': stats.paid,
            'Receita': `R$ ${stats.revenue.toFixed(2)}`,
            'Taxa de Pagamento': `${((stats.paid / stats.count) * 100).toFixed(1)}%`
        }));
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert('Nenhum dado para exportar');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const generatePDF = (type: string, filteredData?: any[]) => {
        if (!selectedEvent) return;

        setPdfData({
            event: selectedEvent,
            registrations: filteredData || selectedEvent.registrations,
            type,
            filteredData
        });
    };

    const handleGenerateReport = () => {
        if (filters.format === 'pdf') {
            generatePDF(filters.reportType);
            return;
        }

        let reportData: any[] = [];

        switch (filters.reportType) {
            case 'registrations':
                reportData = generateRegistrationReport();
                exportToCSV(reportData, `relatorio-inscricoes-${selectedEvent?.title}`);
                break;

            case 'financial':
                const financialData = generateFinancialReport();
                if (financialData) {
                    exportToCSV([financialData.total], `relatorio-financeiro-${selectedEvent?.title}`);
                    if (financialData.details.length > 0) {
                        exportToCSV(financialData.details, `detalhes-financeiros-${selectedEvent?.title}`);
                    }
                }
                break;

            case 'church':
                reportData = generateChurchReport();
                exportToCSV(reportData, `relatorio-igrejas-${selectedEvent?.title}`);
                break;

            case 'attendance':
                alert('Relatório de comparecimento em desenvolvimento');
                break;
        }

        alert('Relatório gerado com sucesso!');
    };

    const getPDFDocument = () => {
        if (!pdfData) return null;

        switch (pdfData.type) {
            case 'financial':
                return (
                    <FinancialPDF
                        event={pdfData.event}
                        registrations={pdfData.registrations}
                        reportType={pdfData.type}
                    />
                );

            case 'church':
                return (
                    <ChurchPDF
                        event={pdfData.event}
                        registrations={pdfData.registrations}
                        reportType={pdfData.type}
                    />
                );

            default:
                return (
                    <RegistrationPDF
                        event={pdfData.event}
                        registrations={pdfData.registrations}
                        reportType={pdfData.type}
                    />
                );
        }
    };

    return (
        <div className="mb-6">
            {/* Botões de Ação Rápida */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => generatePDF('registrations')}
                    disabled={!selectedEvent}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    title="Gerar PDF de Inscrições"
                >
                    📋 PDF Inscrições
                </button>

                <button
                    onClick={() => generatePDF('financial')}
                    disabled={!selectedEvent}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                    title="Gerar PDF Financeiro"
                >
                    💰 PDF Financeiro
                </button>

                <button
                    onClick={() => generatePDF('church')}
                    disabled={!selectedEvent}
                    className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    title="Gerar PDF por Igreja"
                >
                    ⛪ PDF por Igreja
                </button>

                <button
                    onClick={() => setShowReports(!showReports)}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                >
                    {showReports ? '▲ Ocultar' : '▼ Mais Relatórios'}
                </button>
            </div>

            {/* Painel de Relatórios Avançados */}
            {showReports && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Relatórios Avançados</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Tipo de Relatório</label>
                            <select
                                value={filters.reportType}
                                onChange={(e) => setFilters({ ...filters, reportType: e.target.value as any })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="registrations">Inscrições</option>
                                <option value="financial">Financeiro</option>
                                <option value="church">Por Igreja</option>
                                <option value="attendance">Comparecimento</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Formato</label>
                            <select
                                value={filters.format}
                                onChange={(e) => setFilters({ ...filters, format: e.target.value as any })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="csv">CSV/Excel</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Data Inicial</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Data Final</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerateReport}
                            disabled={!selectedEvent}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {filters.format === 'pdf' ? '📄 Gerar PDF' : '📊 Gerar Relatório'}
                        </button>

                        <button
                            onClick={() => setShowReports(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>

                    {!selectedEvent && (
                        <p className="text-red-500 text-sm mt-3">
                            ⚠️ Selecione um evento para gerar relatórios
                        </p>
                    )}
                </div>
            )}

            {/* Modal de Download PDF */}
            {pdfData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📄</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Relatório Pronto!</h3>
                            <p className="text-gray-600">
                                Seu relatório em PDF está pronto para download
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Evento:</span>
                                <span className="text-sm text-gray-600">{pdfData.event.title}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Tipo:</span>
                                <span className="text-sm text-gray-600 capitalize">{pdfData.type}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm font-medium text-gray-700">Registros:</span>
                                <span className="text-sm text-gray-600">{pdfData.registrations.length}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <PDFDownloadLink
                                document={getPDFDocument()}
                                fileName={`relatorio-${pdfData.type}-${pdfData.event.title.replace(/\s+/g, '_')}.pdf`}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                            >
                                {({ loading }) => (
                                    loading ? '⏳ Preparando PDF...' : '📥 Download PDF'
                                )}
                            </PDFDownloadLink>

                            <button
                                onClick={() => setPdfData(null)}
                                className="text-gray-600 hover:text-gray-800 py-2 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}