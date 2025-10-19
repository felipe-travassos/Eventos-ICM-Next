// src/app/api/pix/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import admin, { adminDb } from '@/lib/firebase/admin'

// Tipagem dos itens do pagamento
type PaymentItem = {
    id: string;
    title: string;
    description: string;
    category_id: string;
    quantity: number;
    unit_price: number;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('API /pix/create recebeu:', JSON.stringify(body, null, 2))

        const {
            transaction_amount,
            description,
            payer,
            metadata,
            additional_info
        } = body

        // ✅ VALIDAÇÃO CRÍTICA: Verificar se registrationId existe
        if (!metadata?.registrationId) {
            console.error('❌ registrationId não encontrado nos metadados');
            return NextResponse.json(
                { error: 'ID da inscrição é obrigatório' },
                { status: 400 }
            );
        }

        // Configurar cliente do Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
        })

        // Criar instância do Payment
        const payment = new Payment(client)

        // external_reference é o ID da inscrição para correlacionar
        const externalReference = metadata.registrationId;

        // Preparar o payload completo para o Mercado Pago
        const paymentPayload = {
            transaction_amount,
            description,
            payment_method_id: 'pix',
            external_reference: externalReference, // ← AQUI O CAMPO NOVO
            payer: {
                email: payer.email,
                first_name: payer.first_name,
                last_name: payer.last_name || '',
                ...(payer.identification && {
                    identification: {
                        type: payer.identification.type || 'CPF',
                        number: payer.identification.number
                    }
                }),
                ...(payer.phone && {
                    phone: {
                        area_code: payer.phone.area_code,
                        number: payer.phone.number
                    }
                })
            },
            metadata: {
                ...metadata,
                external_reference: externalReference // ← Também nos metadados
            },
            ...(additional_info && {
                additional_info: {
                    ...(additional_info.items && {
                        items: additional_info.items.map((item: PaymentItem) => ({
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            category_id: item.category_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price
                        }))
                    }),
                    ...(additional_info.payer && {
                        payer: additional_info.payer
                    })
                }
            })
        }

        console.log('📤 Enviando para Mercado Pago com external_reference:', externalReference)

        // Criar pagamento PIX
        const result = await payment.create({
            body: paymentPayload
        })

        console.log('✅ Pagamento criado:', {
            id: result.id,
            external_reference: result.external_reference,
            status: result.status
        })

        const { id, point_of_interaction, external_reference } = result
        const { qr_code, qr_code_base64, ticket_url } = point_of_interaction!.transaction_data!

        // Salvar no Firestore com external_reference
        await adminDb
            .collection('registrations')
            .doc(metadata.registrationId)
            .set({
                paymentId: id,
                externalReference: external_reference, // ← Salva também no Firestore
                qrCode: qr_code,
                qrCodeBase64: qr_code_base64,
                ticketUrl: ticket_url,
                paymentStatus: 'pending',
                payerInfo: {
                    name: `${payer.first_name} ${payer.last_name || ''}`.trim(),
                    email: payer.email,
                    ...(payer.identification && { identification: payer.identification }),
                    ...(payer.phone && { phone: payer.phone })
                },
                items: additional_info?.items,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true })

        return NextResponse.json({
            id,
            qr_code,
            qr_code_base64,
            ticket_url,
            external_reference,
            payer: {
                name: `${payer.first_name} ${payer.last_name || ''}`,
                email: payer.email,
                identification: payer.identification,
                phone: payer.phone
            },
            items: additional_info?.items
        }, { status: 200 })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao criar pagamento Pix';
        const stack = err instanceof Error ? err.stack : undefined;
        // ... existing code ...
        const responseData = (err as { response?: { data?: unknown } })?.response?.data;
        console.error('❌ ERRO CRIANDO PIX:', { message, stack, response: responseData })

        return NextResponse.json({
            error: 'Erro ao criar pagamento Pix',
            details: message,
            ...(process.env.NODE_ENV === 'development' && {
                stack,
                response: responseData
            })
        }, { status: 500 })
    }
}