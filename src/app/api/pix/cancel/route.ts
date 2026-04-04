// src/app/api/pix/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { paymentId, registrationId } = body

        if (!paymentId) {
            return NextResponse.json(
                { error: 'paymentId é obrigatório' },
                { status: 400 }
            )
        }

        console.log('🔄 Iniciando cancelamento do PIX:', { paymentId, registrationId })

        // 1. Primeiro verifica o status atual do pagamento
        const statusResponse = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const currentStatus = statusResponse.data.status
        console.log('📊 Status atual do pagamento:', currentStatus)

        // 2. Só cancela se estiver pendente
        if (currentStatus === 'pending') {
            try {
                // Tenta cancelar o pagamento
                const cancelResponse = await axios.post(
                    `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )

                console.log('✅ PIX cancelado com sucesso:', cancelResponse.data)

                // Atualiza o status no Firestore
                if (registrationId) {
                    await adminDb
                        .collection('registrations')
                        .doc(registrationId)
                        .update({
                            paymentStatus: 'cancelled',
                            cancelledAt: new Date(),
                            cancellationReason: 'usuário excluiu inscrição'
                        })
                }

                return NextResponse.json({
                    success: true,
                    message: 'PIX cancelado com sucesso',
                    data: cancelResponse.data
                })

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Erro ao cancelar PIX';
                const responseStatus = typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { status?: number } }).response?.status
                    : undefined;
                const responseData = typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: unknown } }).response?.data
                    : undefined;

                console.error('❌ Erro ao cancelar PIX:', {
                    message,
                    status: responseStatus,
                    data: responseData
                })

                // Mesmo se não conseguir cancelar, marca como cancelado no sistema
                if (registrationId) {
                    await adminDb
                        .collection('registrations')
                        .doc(registrationId)
                        .update({
                            paymentStatus: 'cancelled',
                            cancelledAt: new Date(),
                            cancellationReason: 'tentativa de cancelamento falhou',
                            cancellationError: message
                        })
                }

                return NextResponse.json({
                    success: false,
                    message: 'Não foi possível cancelar o PIX no Mercado Pago',
                    error: responseData || message
                }, { status: 500 })
            }
        } else {
            console.log('⚠️ Pagamento não pode ser cancelado. Status atual:', currentStatus)

            // Atualiza o status conforme a situação
            let newStatus = currentStatus;
            let cancellationReason = 'status não permitia cancelamento';

            if (currentStatus === 'approved') {
                cancellationReason = 'pagamento já foi aprovado';
            } else if (currentStatus === 'cancelled') {
                cancellationReason = 'já estava cancelado';
            } else if (currentStatus === 'refunded') {
                cancellationReason = 'já foi reembolsado';
            }

            if (registrationId) {
                await adminDb
                    .collection('registrations')
                    .doc(registrationId)
                    .update({
                        paymentStatus: newStatus,
                        cancelledAt: new Date(),
                        cancellationReason: cancellationReason
                    })
            }

            return NextResponse.json({
                success: false,
                message: `Pagamento não pode ser cancelado. Status atual: ${currentStatus}`,
                currentStatus: currentStatus
            }, { status: 400 })
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao cancelar pagamento Pix';
        const responseStatus = typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        const responseData = typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: unknown } }).response?.data
            : undefined;

        console.error('❌ ERRO NO CANCELAMENTO PIX:', {
            message,
            status: responseStatus,
            data: responseData
        })

        return NextResponse.json({
            success: false,
            error: 'Erro ao cancelar pagamento Pix',
            details: responseData || message
        }, { status: 500 })
    }
}