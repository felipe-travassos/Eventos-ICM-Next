import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    })
}

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
                    Authorization: `Bearer ${process.env.MERCADO_PAGO_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const status = mpRes.data.status
        console.log('Status do pagamento:', status)

        // Atualiza no Firestore só se aprovado
        if (status === 'approved') {
            await admin.firestore()
                .collection('registrations')
                .doc(registrationId)
                .update({
                    paymentStatus: 'paid',
                    paidAt: admin.firestore.FieldValue.serverTimestamp()
                })
        }

        return NextResponse.json({ status }, { status: 200 })
    } catch (error: any) {
        console.error('❌ ERRO CONSULTANDO STATUS PIX:', {
            message: error.message,
            isAxiosError: error.isAxiosError,
            status: error.response?.status,
            responseData: error.response?.data,
        })

        return NextResponse.json(
            {
                error: 'Erro ao verificar status do Pix',
                details: error.response?.data || error.message
            },
            { status: 500 }
        )
    }
}