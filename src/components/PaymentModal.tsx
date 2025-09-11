// components/PaymentModal.tsx
'use client';

import React from 'react';

interface PaymentData {
    amount: number;
    description: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
}

interface PaymentModalProps {
    paymentData: PaymentData;
    onClose: () => void;
    onCopyPix: () => void;
    onCheckStatus: () => void;
}

export default function PaymentModal({ paymentData, onClose, onCopyPix, onCheckStatus }: PaymentModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Pagamento PIX</h2>

                <div className="space-y-3">
                    <div className="text-sm">
                        <p className="text-gray-600">Descrição:</p>
                        <p className="font-semibold text-sm">{paymentData.description}</p>
                    </div>

                    <div className="text-sm">
                        <p className="text-gray-600">Valor:</p>
                        <p className="font-semibold text-green-600 text-sm">
                            R$ {paymentData.amount.toFixed(2)}
                        </p>
                    </div>

                    {paymentData.qrCodeBase64 && (
                        <div className="text-center">
                            <p className="text-gray-600 mb-2 text-sm">Escaneie o QR Code:</p>
                            <img
                                src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                                alt="QR Code PIX"
                                className="mx-auto mb-3 border rounded-lg"
                                style={{ width: '150px', height: '150px' }}
                            />
                        </div>
                    )}

                    {paymentData.qrCode && (
                        <div>
                            <p className="text-gray-600 mb-1 text-sm">Código PIX:</p>
                            <div className="bg-gray-100 p-2 rounded break-all text-xs mb-2">
                                {paymentData.qrCode.substring(0, 30)}...
                            </div>
                            <button
                                onClick={onCopyPix}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded w-full hover:bg-blue-700 text-sm"
                            >
                                Copiar Código PIX
                            </button>
                        </div>
                    )}

                    {paymentData.ticketUrl && (
                        <div className="text-center">
                            <a
                                href={paymentData.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                                Abrir comprovante
                            </a>
                        </div>
                    )}

                    <div className="flex space-x-2 pt-3">
                        <button
                            onClick={onCheckStatus}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm"
                        >
                            Verificar
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 text-sm"
                        >
                            Fechar
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 text-center mt-3">
                        <p>O pagamento pode levar alguns minutos para ser confirmado.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}