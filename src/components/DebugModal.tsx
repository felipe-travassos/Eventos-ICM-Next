// components/DebugModal.tsx
'use client';

import React from 'react';

interface DebugData {
    payer: {
        first_name: string;
        last_name: string;
        email: string;
        identification?: {
            type: string;
            number: string;
        };
        phone?: {
            area_code: string;
            number: string;
        };
    };
    additional_info: {
        items: Array<{
            id: string;
            title: string;
            description: string;
            category_id: string;
            quantity: number;
            unit_price: number;
        }>;
    };
    transaction_amount: number;
    description: string;
    metadata: any;
}

interface DebugModalProps {
    debugData: DebugData | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function DebugModal({ debugData, isOpen, onClose }: DebugModalProps) {
    if (!isOpen || !debugData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Debug - Dados Enviados ao Mercado Pago</h2>

                <div className="space-y-4">
                    {/* Dados do Comprador */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">👤 Dados do Comprador</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p><strong>Nome:</strong> {debugData.payer.first_name} {debugData.payer.last_name}</p>
                            <p><strong>Email:</strong> {debugData.payer.email}</p>
                            {debugData.payer.identification && (
                                <p><strong>CPF:</strong> {debugData.payer.identification.number}</p>
                            )}
                            {debugData.payer.phone && (
                                <p><strong>Telefone:</strong> +{debugData.payer.phone.area_code} {debugData.payer.phone.number}</p>
                            )}
                        </div>
                    </div>

                    {/* Item do Pagamento */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">🎯 Item do Pagamento</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            {debugData.additional_info.items.map((item, index) => (
                                <div key={index} className="mb-2 last:mb-0">
                                    <p><strong>ID:</strong> {item.id}</p>
                                    <p><strong>Título:</strong> {item.title}</p>
                                    <p><strong>Descrição:</strong> {item.description}</p>
                                    <p><strong>Categoria:</strong> {item.category_id}</p>
                                    <p><strong>Quantidade:</strong> {item.quantity}</p>
                                    <p><strong>Preço Unitário:</strong> R$ {item.unit_price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Informações Gerais */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">💰 Informações Gerais</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p><strong>Valor Total:</strong> R$ {debugData.transaction_amount.toFixed(2)}</p>
                            <p><strong>Descrição:</strong> {debugData.description}</p>
                        </div>
                    </div>

                    {/* Metadados */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">📊 Metadados</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(debugData.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* JSON Completo */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">📋 JSON Completo</h3>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                            <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(debugData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
                >
                    Fechar Debug
                </button>
            </div>
        </div>
    );
}