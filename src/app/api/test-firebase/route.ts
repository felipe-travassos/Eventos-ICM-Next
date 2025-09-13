// src/app/api/test-firebase/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
    try {
        // Teste simples do Firestore
        const testRef = adminDb.collection('test').doc('connection');
        await testRef.set({
            timestamp: new Date(),
            message: 'Conexão teste do Firebase Admin'
        });

        return NextResponse.json({
            success: true,
            message: 'Firebase Admin conectado com sucesso!'
        });
    } catch (error: any) {
        console.error('Erro no teste do Firebase:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: 'Verifique a configuração do Service Account'
        }, { status: 500 });
    }
}