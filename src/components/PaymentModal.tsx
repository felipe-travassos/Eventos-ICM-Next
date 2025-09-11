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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Pagamento PIX</h2>

                <div className="space-y-4">
                    <div>
                        <p className="text-gray-600">Descrição:</p>
                        <p className="font-semibold">{paymentData.description}</p>
                    </div>

                    <div>
                        <p className="text-gray-600">Valor:</p>
                        <p className="font-semibold text-green-600">
                            R$ {paymentData.amount.toFixed(2)}
                        </p>
                    </div>

                    {paymentData.qrCodeBase64 && (
                        <div className="text-center">
                            <p className="text-gray-600 mb-2">Escaneie o QR Code:</p>
                            <img
                                src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                                alt="QR Code PIX"
                                className="mx-auto mb-4 border rounded-lg"
                                style={{ width: '200px', height: '200px' }}
                            />
                        </div>
                    )}

                    {paymentData.qrCode && (
                        <div>
                            <p className="text-gray-600 mb-2">Código PIX:</p>
                            <div className="bg-gray-100 p-3 rounded break-all text-sm mb-2">
                                {paymentData.qrCode}
                            </div>
                            <button
                                onClick={onCopyPix}
                                className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
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
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Abrir comprovante no Mercado Pago
                            </a>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onCheckStatus}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Verificar Pagamento
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                            Fechar
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 text-center mt-4">
                        <p>O pagamento pode levar alguns minutos para ser confirmado.</p>
                        <p>Após pagar, clique em "Verificar Pagamento".</p>
                    </div>
                </div>
            </div>
        </div>
    );
}