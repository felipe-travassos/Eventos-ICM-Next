import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { MercadoPagoConfig, Payment } from 'mercadopago'

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('API /pix/create recebeu:', body)

        const { transaction_amount, description, payer, metadata } = body

        // Configurar cliente do Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADO_PAGO_TOKEN!,
        })

        // Criar instância do Payment
        const payment = new Payment(client)

        // Criar pagamento PIX
        const result = await payment.create({
            body: {
                transaction_amount,
                description,
                payment_method_id: 'pix',
                payer: {
                    email: payer.email,
                    first_name: payer.first_name,
                    last_name: payer.last_name || '',
                },
                metadata
            }
        })

        console.log('Pagamento criado:', result)

        const { id, point_of_interaction } = result
        const { qr_code, qr_code_base64, ticket_url } = point_of_interaction!.transaction_data!

        await admin.firestore()
            .collection('registrations')
            .doc(metadata.registrationId)
            .set({
                paymentId: id,
                qrCode: qr_code,
                qrCodeBase64: qr_code_base64,
                ticketUrl: ticket_url,
                paymentStatus: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true })

        return NextResponse.json({
            id,
            qr_code,
            qr_code_base64,
            ticket_url
        }, { status: 200 })

    } catch (err: any) {
        console.error('❌ ERRO CRIANDO PIX:', err)

        return NextResponse.json({
            error: 'Erro ao criar pagamento Pix',
            details: err.message
        }, { status: 500 })
    }
}