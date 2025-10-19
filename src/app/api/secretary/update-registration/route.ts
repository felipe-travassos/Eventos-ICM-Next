// app/api/secretary/update-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { registrationId, paymentId, paymentStatus } = body;

        if (!registrationId) {
            return NextResponse.json({ error: 'ID da inscrição é obrigatório' }, { status: 400 });
        }

        const registrationRef = doc(db, 'registrations', registrationId);

        const updateData: { paymentId?: string; paymentStatus?: 'pending' | 'paid' | 'refunded'; updatedAt: Date } = {
            updatedAt: new Date()
        };

        if (paymentId) updateData.paymentId = paymentId;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;

        await updateDoc(registrationRef, updateData);

        return NextResponse.json({ success: true, message: 'Inscrição atualizada' });

    } catch (err: unknown) {
        console.error('Erro ao atualizar inscrição:', err);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}