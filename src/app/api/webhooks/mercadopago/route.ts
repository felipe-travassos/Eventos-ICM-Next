// src/app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminDb } from '@/lib/firebase/admin'
import admin from '@/lib/firebase/admin'

// Função para validar a assinatura do webhook
function validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    ts: string
): boolean {
    try {
        // Construir a string para validação conforme documentação do MP
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
        
        // Criar HMAC usando a chave secreta do webhook
        const hmac = crypto.createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET!)
        hmac.update(manifest)
        const sha = hmac.digest('hex')
        
        // Extrair a assinatura do header (formato: "ts=123456789,v1=hash")
        const signatureParts = xSignature.split(',')
        let v1Hash = ''
        
        for (const part of signatureParts) {
            const [key, value] = part.split('=')
            if (key === 'v1') {
                v1Hash = value
                break
            }
        }
        
        return v1Hash === sha
    } catch (error) {
        console.error('Erro na validação da assinatura:', error)
        return false
    }
}

// Função para processar notificação de pagamento
async function processPaymentNotification(paymentId: string) {
    try {
        console.log('🔔 Processando notificação de pagamento:', paymentId)
        
        // Buscar dados do pagamento no Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar pagamento: ${response.status}`)
        }
        
        const paymentData = await response.json()
        console.log('📊 Dados do pagamento recebidos:', {
            id: paymentData.id,
            status: paymentData.status,
            external_reference: paymentData.external_reference
        })
        
        // Buscar a inscrição no Firestore usando external_reference
        const registrationId = paymentData.external_reference
        if (!registrationId) {
            console.warn('⚠️ external_reference não encontrado no pagamento')
            return
        }
        
        // Preparar dados para atualização
        const updateData: any = {
            paymentStatus: paymentData.status,
            mercadoPagoStatus: paymentData.status,
            statusDetail: paymentData.status_detail,
            lastWebhookUpdate: admin.firestore.FieldValue.serverTimestamp(),
            webhookProcessed: true
        }
        
        // Dados específicos para pagamento aprovado
        if (paymentData.status === 'approved') {
            updateData.paidAt = admin.firestore.FieldValue.serverTimestamp()
            updateData.approvedAmount = paymentData.transaction_amount
            updateData.netReceivedAmount = paymentData.transaction_details?.net_received_amount
            updateData.installments = paymentData.installments
            
            // Dados do pagador
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
            
            // Dados dos itens
            if (paymentData.additional_info?.items) {
                updateData.mercadoPagoItems = paymentData.additional_info.items
            }
        }
        
        // Dados para pagamento rejeitado/cancelado
        if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
            updateData.paymentError = paymentData.status_detail
            updateData.rejectedAt = admin.firestore.FieldValue.serverTimestamp()
        }
        
        // Atualizar no Firestore
        await adminDb
            .collection('registrations')
            .doc(registrationId)
            .update(updateData)
        
        console.log('✅ Inscrição atualizada via webhook:', {
            registrationId,
            status: paymentData.status,
            updatedFields: Object.keys(updateData)
        })
        
    } catch (error) {
        console.error('❌ Erro ao processar notificação de pagamento:', error)
        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Extrair headers necessários para validação
        const xSignature = request.headers.get('x-signature')
        const xRequestId = request.headers.get('x-request-id')
        
        if (!xSignature || !xRequestId) {
            console.warn('⚠️ Headers de validação ausentes')
            return NextResponse.json({ error: 'Headers inválidos' }, { status: 400 })
        }
        
        // 2. Extrair dados do corpo da requisição
        const body = await request.json()
        console.log('🔔 Webhook recebido:', JSON.stringify(body, null, 2))
        
        const { id, live_mode, type, date_created, application_id, user_id, version, api_version, action, data } = body
        
        // 3. Validar assinatura (se configurada)
        if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
            const timestamp = new Date(date_created).getTime().toString()
            const isValid = validateWebhookSignature(xSignature, xRequestId, data.id, timestamp)
            
            if (!isValid) {
                console.error('❌ Assinatura do webhook inválida')
                return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
            }
            
            console.log('✅ Assinatura do webhook validada')
        }
        
        // 4. Processar apenas notificações de pagamento
        if (type === 'payment') {
            const paymentId = data.id
            
            // Processar a notificação
            await processPaymentNotification(paymentId)
            
            // Log da ação processada
            console.log('📝 Webhook processado:', {
                type,
                action,
                paymentId,
                live_mode,
                timestamp: new Date().toISOString()
            })
            
            return NextResponse.json({ 
                success: true, 
                message: 'Webhook processado com sucesso',
                processed: {
                    type,
                    paymentId,
                    action
                }
            })
        } else {
            // Outros tipos de notificação (merchant_order, etc.)
            console.log('ℹ️ Tipo de webhook não processado:', type)
            return NextResponse.json({ 
                success: true, 
                message: 'Tipo de webhook não processado',
                type 
            })
        }
        
    } catch (error: any) {
        console.error('❌ ERRO NO WEBHOOK MERCADO PAGO:', {
            message: error.message,
            stack: error.stack
        })
        
        return NextResponse.json({
            success: false,
            error: 'Erro interno no processamento do webhook',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 })
    }
}

// Endpoint GET para teste/verificação
export async function GET() {
    return NextResponse.json({
        message: 'Endpoint de webhook do Mercado Pago ativo',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasWebhookSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET
    })
}