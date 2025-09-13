// app/api/seniors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const secretaryId = searchParams.get('secretaryId');
        const searchTerm = searchParams.get('search');

        let query = adminDb.collection('seniors');

        if (secretaryId) {
            query = query.where('createdBy', '==', secretaryId);
        }

        if (searchTerm) {
            query = query.where('name', '>=', searchTerm)
                .where('name', '<=', searchTerm + '\uf8ff');
        }

        const snapshot = await query.orderBy('name').get();
        const seniors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(seniors);
    } catch (error) {
        console.error('Erro ao buscar idosos:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, cpf, birthDate, church, pastor, createdBy } = body;

        const seniorData = {
            name,
            email: email || '',
            phone,
            cpf,
            birthDate,
            church,
            pastor,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await adminDb.collection('seniors').add(seniorData);

        return NextResponse.json({
            id: docRef.id,
            ...seniorData
        });
    } catch (error) {
        console.error('Erro ao criar idoso:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}