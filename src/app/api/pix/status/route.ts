// src/app/api/pix/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import admin, { adminDb } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const paymentId = searchParams.get('paymentId')
        const registrationId = searchParams.get('registrationId')

        if (!paymentId || !registrationId) {
            return NextResponse.json(
                { error: 'paymentId e registrationId são obrigatórios' },
                { status: 400 }
            )
        }

        console.log('Consultando status do pagamento:', { paymentId, registrationId })

        // Consulta Mercado Pago
        const mpRes = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const paymentData = mpRes.data;
        const status = paymentData.status;

        console.log('✅ Status do pagamento:', status)
        console.log('📊 Dados completos do pagamento:', {
            id: paymentData.id,
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            amount: paymentData.transaction_amount,
            payer: {
                email: paymentData.payer?.email,
                name: `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim(),
                identification: paymentData.payer?.identification,
                phone: paymentData.payer?.phone
            },
            items: paymentData.additional_info?.items,
            metadata: paymentData.metadata
        })

        // Atualiza no Firestore com todos os dados relevantes
        const updateData: Record<string, unknown> = {
            paymentStatus: status,
            lastStatusCheck: admin.firestore.FieldValue.serverTimestamp(),
            mercadoPagoStatus: status,
            statusDetail: paymentData.status_detail
        }

        // Se foi aprovado, adiciona dados específicos
        if (status === 'approved') {
            updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
            updateData.approvedAmount = paymentData.transaction_amount;
            updateData.netReceivedAmount = paymentData.transaction_details?.net_received_amount;
            updateData.installments = paymentData.installments;

            // Salva dados do pagador do Mercado Pago (para conciliação)
            if (paymentData.payer) {
                updateData.mercadoPagoPayer = {
                    id: paymentData.payer.id,
                    email: paymentData.payer.email,
                    firstName: paymentData.payer.first_name,
                    lastName: paymentData.payer.last_name,
                    identification: paymentData.payer.identification,
                    phone: paymentData.payer.phone
                }
            }

            // Salva dados dos itens
            if (paymentData.additional_info?.items) {
                updateData.mercadoPagoItems = paymentData.additional_info.items;
            }
        }

        // Se foi rejeitado ou cancelado
        if (status === 'rejected' || status === 'cancelled') {
            updateData.statusDetail = paymentData.status_detail;
            updateData.paymentError = paymentData.status_detail;
        }

        await adminDb
            .collection('registrations')
            .doc(registrationId)
            .update(updateData)

        // Log de atualização
        console.log('📝 Firestore atualizado para registro:', registrationId, {
            status: status,
            updatedFields: Object.keys(updateData)
        })

        return NextResponse.json({
            status,
            status_detail: paymentData.status_detail,
            transaction_amount: paymentData.transaction_amount,
            payer: paymentData.payer ? {
                email: paymentData.payer.email,
                name: `${paymentData.payer.first_name || ''} ${paymentData.payer.last_name || ''}`.trim(),
                identification: paymentData.payer.identification,
                phone: paymentData.payer.phone
            } : null,
            items: paymentData.additional_info?.items
        }, { status: 200 })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao verificar status do Pix';
        const isAxiosError = typeof err === 'object' && err !== null && 'isAxiosError' in err
            ? (err as { isAxiosError?: boolean }).isAxiosError
            : undefined;
        const responseStatus = typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        const responseData = typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: unknown } }).response?.data
            : undefined;
        const url = typeof err === 'object' && err !== null && 'config' in err
            ? (err as { config?: { url?: string } }).config?.url
            : undefined;

        console.error('❌ ERRO CONSULTANDO STATUS PIX:', {
            message,
            isAxiosError,
            status: responseStatus,
            responseData,
            url
        })

        // Tenta atualizar o status como erro no Firestore
        try {
            const regId = new URL(request.url).searchParams.get('registrationId');
            if (regId) {
                await adminDb
                    .collection('registrations')
                    .doc(regId)
                    .update({
                        lastStatusCheck: admin.firestore.FieldValue.serverTimestamp(),
                        statusCheckError: message
                    })
            }
        } catch (firestoreError) {
            console.error('Erro ao atualizar status de erro no Firestore:', firestoreError);
        }

        return NextResponse.json(
            {
                error: 'Erro ao verificar status do Pix',
                details: responseData || message,
                ...(process.env.NODE_ENV === 'development' && {
                    stack: err instanceof Error ? err.stack : undefined
                })
            },
            { status: 500 }
        )
    }
}