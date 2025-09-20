// components/Reports/Charts.tsx
'use client';

import React from 'react';
import { EventWithRegistrations } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartsProps {
    event: EventWithRegistrations;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Charts({ event }: ChartsProps) {
    const paymentData = [
        { name: 'Pagos', value: event.registrations.filter(reg => reg.paymentStatus === 'paid').length },
        { name: 'Pendentes', value: event.registrations.filter(reg => reg.paymentStatus === 'pending').length }
    ];

    const statusData = [
        { name: 'Aprovados', value: event.registrations.filter(reg => reg.status === 'approved').length },
        { name: 'Pendentes', value: event.registrations.filter(reg => reg.status === 'pending').length },
        { name: 'Rejeitados', value: event.registrations.filter(reg => reg.status === 'rejected').length }
    ];

    // Dados por igreja para gráfico de barras
    const churchData = Object.entries(
        event.registrations.reduce((acc, reg) => {
            acc[reg.churchName] = (acc[reg.churchName] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number })
    ).map(([name, value]) => ({ name, value }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-4 text-center">Status de Pagamento</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                        >
                            {paymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-4 text-center">Status de Inscrição</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {churchData.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                    <h4 className="font-semibold mb-4 text-center">Inscrições por Igreja</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={churchData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}