// src/app/api/test-mercadopago/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig } from 'mercadopago';

export async function GET() {
    try {
        // Teste simples da conexão com Mercado Pago
        const _client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
        });

        return NextResponse.json({
            success: true,
            message: 'Mercado Pago configurado com sucesso!',
            hasToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
            tokenLength: process.env.MERCADOPAGO_ACCESS_TOKEN?.length
        });
    } catch (err: unknown) {
        console.error('Erro no teste do Mercado Pago:', err);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return NextResponse.json({
            success: false,
            error: message
        }, { status: 500 });
    }
}