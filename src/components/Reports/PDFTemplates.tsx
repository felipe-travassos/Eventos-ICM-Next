// components/Reports/PDFTemplates.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { EventWithRegistrations, EventRegistration } from '@/types';

// Registrar fonte (opcional)
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1pt solid #e5e7eb',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 3,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#374151',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 4,
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#e5e7eb',
        marginBottom: 15,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
        padding: 8,
    },
    tableCol: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#e5e7eb',
        padding: 8,
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
    },
    tableCell: {
        fontSize: 10,
        color: '#4b5563',
    },
    summaryCard: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 6,
        marginBottom: 10,
        border: '1pt solid #e2e8f0',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: 'medium',
    },
    summaryValue: {
        fontSize: 11,
        color: '#1e293b',
        fontWeight: 'bold',
    },
    financialHighlight: {
        backgroundColor: '#dcfce7',
        padding: 15,
        borderRadius: 6,
        marginBottom: 15,
        border: '1pt solid #bbf7d0',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 9,
        color: '#9ca3af',
    },
    badge: {
        padding: 4,
        borderRadius: 12,
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        marginHorizontal: 2,
    },
    badgePaid: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    badgePending: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
    },
    badgeApproved: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
    },
    badgeRejected: {
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
    },
});

interface RegistrationPDFProps {
    event: EventWithRegistrations;
    registrations: EventRegistration[];
    reportType: string;
}

export const RegistrationPDF = ({ event, registrations, reportType }: RegistrationPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Cabeçalho */}
            <View style={styles.header}>
                <Text style={styles.title}>Relatório de Inscrições</Text>
                <Text style={styles.subtitle}>Evento: {event.title}</Text>
                <Text style={styles.subtitle}>
                    Data: {event.date.toLocaleDateString('pt-BR')} • Local: {event.location}
                </Text>
                <Text style={styles.subtitle}>
                    Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </Text>
            </View>

            {/* Resumo Estatístico */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumo Estatístico</Text>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total de Inscrições:</Text>
                        <Text style={styles.summaryValue}>{registrations.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Inscrições Pagas:</Text>
                        <Text style={styles.summaryValue}>
                            {registrations.filter(reg => reg.paymentStatus === 'paid').length}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Inscrições Pendentes:</Text>
                        <Text style={styles.summaryValue}>
                            {registrations.filter(reg => reg.paymentStatus === 'pending').length}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Taxa de Conversão:</Text>
                        <Text style={styles.summaryValue}>
                            {((registrations.filter(reg => reg.paymentStatus === 'paid').length / registrations.length) * 100).toFixed(1)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Lista de Inscrições */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lista de Inscritos ({registrations.length})</Text>

                <View style={styles.table}>
                    {/* Cabeçalho da tabela */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColHeader, { width: '25%' }]}>
                            <Text style={styles.tableCellHeader}>Nome</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '20%' }]}>
                            <Text style={styles.tableCellHeader}>Igreja</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '15%' }]}>
                            <Text style={styles.tableCellHeader}>Telefone</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '15%' }]}>
                            <Text style={styles.tableCellHeader}>Status</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '15%' }]}>
                            <Text style={styles.tableCellHeader}>Pagamento</Text>
                        </View>
                        <View style={[styles.tableColHeader, { width: '10%' }]}>
                            <Text style={styles.tableCellHeader}>Data</Text>
                        </View>
                    </View>

                    {/* Dados da tabela */}
                    {registrations.map((registration, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={[styles.tableCol, { width: '25%' }]}>
                                <Text style={styles.tableCell}>{registration.userName}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '20%' }]}>
                                <Text style={styles.tableCell}>{registration.churchName}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{registration.userPhone}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <View style={[
                                    styles.badge,
                                    registration.status === 'approved' ? styles.badgeApproved :
                                        registration.status === 'rejected' ? styles.badgeRejected :
                                            styles.badgePending
                                ]}>
                                    <Text>
                                        {registration.status === 'approved' ? 'Aprovado' :
                                            registration.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <View style={[
                                    styles.badge,
                                    registration.paymentStatus === 'paid' ? styles.badgePaid : styles.badgePending
                                ]}>
                                    <Text>
                                        {registration.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>
                                    {registration.createdAt.toLocaleDateString('pt-BR')}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Rodapé */}
            <Text style={styles.footer}>
                Relatório gerado automaticamente pelo Sistema de Gestão de Eventos • Página 1 de 1
            </Text>
        </Page>
    </Document>
);

export const FinancialPDF = ({ event, registrations }: RegistrationPDFProps) => {
    const paidRegistrations = registrations.filter(reg => reg.paymentStatus === 'paid');
    const totalRevenue = paidRegistrations.length * event.price;
    const expectedRevenue = registrations.length * event.price;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Cabeçalho */}
                <View style={styles.header}>
                    <Text style={styles.title}>Relatório Financeiro</Text>
                    <Text style={styles.subtitle}>Evento: {event.title}</Text>
                    <Text style={styles.subtitle}>Valor: R$ {event.price.toFixed(2)}</Text>
                    <Text style={styles.subtitle}>
                        Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                    </Text>
                </View>

                {/* Destaque Financeiro */}
                <View style={styles.financialHighlight}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#166534', marginBottom: 10, textAlign: 'center' }}>
                        RESUMO FINANCEIRO
                    </Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Receita Total:</Text>
                        <Text style={[styles.summaryValue, { color: '#166534' }]}>R$ {totalRevenue.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Receita Esperada:</Text>
                        <Text style={styles.summaryValue}>R$ {expectedRevenue.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Taxa de Conversão:</Text>
                        <Text style={styles.summaryValue}>
                            {((paidRegistrations.length / registrations.length) * 100).toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* Detalhamento por Igreja */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Receita por Igreja</Text>

                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '60%' }]}>
                                <Text style={styles.tableCellHeader}>Igreja</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}>
                                <Text style={styles.tableCellHeader}>Inscritos</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}>
                                <Text style={styles.tableCellHeader}>Receita</Text>
                            </View>
                        </View>

                        {Object.entries(
                            registrations.reduce((acc, reg) => {
                                const church = reg.churchName;
                                if (!acc[church]) acc[church] = { total: 0, paid: 0 };
                                acc[church].total++;
                                if (reg.paymentStatus === 'paid') acc[church].paid++;
                                return acc;
                            }, {} as { [key: string]: { total: number; paid: number } })
                        ).map(([church, stats], index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={[styles.tableCol, { width: '60%' }]}>
                                    <Text style={styles.tableCell}>{church}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '20%' }]}>
                                    <Text style={styles.tableCell}>
                                        {stats.paid}/{stats.total}
                                    </Text>
                                </View>
                                <View style={[styles.tableCol, { width: '20%' }]}>
                                    <Text style={styles.tableCell}>
                                        R$ {(stats.paid * event.price).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Rodapé */}
                <Text style={styles.footer}>
                    Relatório Financeiro • Sistema de Gestão de Eventos • Página 1 de 1
                </Text>
            </Page>
        </Document>
    );
};

// Adicione este componente no PDFTemplates.tsx
export const ChurchPDF = ({ event, registrations }: RegistrationPDFProps) => {
    const churchStats = registrations.reduce((acc, reg) => {
        if (!acc[reg.churchName]) {
            acc[reg.churchName] = { total: 0, paid: 0, pending: 0, approved: 0, rejected: 0 };
        }

        acc[reg.churchName].total++;
        if (reg.paymentStatus === 'paid') acc[reg.churchName].paid++;
        if (reg.paymentStatus === 'pending') acc[reg.churchName].pending++;
        if (reg.status === 'approved') acc[reg.churchName].approved++;
        if (reg.status === 'rejected') acc[reg.churchName].rejected++;

        return acc;
    }, {} as { [key: string]: { total: number; paid: number; pending: number; approved: number; rejected: number } });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Relatório por Igreja</Text>
                    <Text style={styles.subtitle}>Evento: {event.title}</Text>
                    <Text style={styles.subtitle}>
                        Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo por Igreja</Text>

                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '30%' }]}>
                                <Text style={styles.tableCellHeader}>Igreja</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '14%' }]}>
                                <Text style={styles.tableCellHeader}>Total</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '14%' }]}>
                                <Text style={styles.tableCellHeader}>Pagos</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '14%' }]}>
                                <Text style={styles.tableCellHeader}>Aprovados</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '14%' }]}>
                                <Text style={styles.tableCellHeader}>Taxa</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '14%' }]}>
                                <Text style={styles.tableCellHeader}>Receita</Text>
                            </View>
                        </View>

                        {Object.entries(churchStats).map(([church, stats], index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={[styles.tableCol, { width: '30%' }]}>
                                    <Text style={styles.tableCell}>{church}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '14%' }]}>
                                    <Text style={styles.tableCell}>{stats.total}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '14%' }]}>
                                    <Text style={styles.tableCell}>{stats.paid}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '14%' }]}>
                                    <Text style={styles.tableCell}>{stats.approved}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '14%' }]}>
                                    <Text style={styles.tableCell}>
                                        {((stats.paid / stats.total) * 100).toFixed(1)}%
                                    </Text>
                                </View>
                                <View style={[styles.tableCol, { width: '14%' }]}>
                                    <Text style={styles.tableCell}>
                                        R$ {(stats.paid * event.price).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.footer}>
                    Relatório por Igreja • Sistema de Gestão de Eventos • Página 1 de 1
                </Text>
            </Page>
        </Document>
    );
};