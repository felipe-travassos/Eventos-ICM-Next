// app/api/registrations/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const seniorId = searchParams.get('seniorId');

        if (!eventId || !seniorId) {
            return NextResponse.json({ error: 'Parâmetros faltando' }, { status: 400 });
        }

        const q = query(
            collection(db, 'registrations'),
            where('eventId', '==', eventId),
            where('seniorId', '==', seniorId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return NextResponse.json(null);
        }

        const registration = snapshot.docs[0].data();
        return NextResponse.json({
            id: snapshot.docs[0].id,
            ...registration,
            createdAt: registration.createdAt?.toDate(),
            updatedAt: registration.updatedAt?.toDate(),
            approvedAt: registration.approvedAt?.toDate()
        });

    } catch (error) {
        console.error('Erro ao verificar inscrição:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}