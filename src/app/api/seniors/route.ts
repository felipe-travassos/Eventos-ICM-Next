// app/api/seniors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Senior } from '@/types'


// Função para validar se os dados são do tipo Senior
function isValidSenior(data: any): data is Senior {
    return (
        typeof data.name === 'string' &&
        typeof data.phone === 'string' &&
        typeof data.cpf === 'string' &&
        typeof data.church === 'string' &&
        typeof data.pastor === 'string' &&
        typeof data.churchId === 'string' &&
        typeof data.createdBy === 'string'
    );
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get('search')?.toLowerCase() || '';
        const secretaryId = searchParams.get('secretaryId');

        if (!secretaryId) {
            return NextResponse.json({ error: 'Secretary ID is required' }, { status: 400 });
        }

        const seniorsRef = adminDb.collection('seniors').where('createdBy', '==', secretaryId);
        const snapshot = await seniorsRef.get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        const seniors = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data
                };
            })
            .filter(senior => isValidSenior(senior)) // Filtra apenas os válidos
            .filter(senior =>
                senior.name.toLowerCase().includes(searchTerm) ||
                senior.phone.includes(searchTerm) ||
                senior.cpf.includes(searchTerm)
            )
            .slice(0, 10);

        return NextResponse.json(seniors);
    } catch (error: any) {
        console.error('Error fetching seniors:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            name,
            email,
            phone,
            cpf,
            birthDate,
            church,
            pastor,
            address,
            healthInfo,
            churchId,
            secretaryId
        } = body;

        // Validação dos campos obrigatórios
        if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        if (!phone) return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
        if (!cpf) return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 });
        if (!churchId) return NextResponse.json({ error: 'ID da igreja é obrigatório' }, { status: 400 });
        if (!secretaryId) return NextResponse.json({ error: 'ID do secretário é obrigatório' }, { status: 400 });

        // Garante valores padrão para evitar undefined
        const finalChurch = church?.trim() || 'Igreja não informada';
        const finalPastor = pastor?.trim() || 'Pastor não informado';

        const cleanedCpf = cpf.replace(/\D/g, '');

        // Verifica se o CPF já existe
        const existingQuery = await adminDb.collection('seniors')
            .where('cpf', '==', cleanedCpf)
            .get();

        if (!existingQuery.empty) {
            return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
        }

        const seniorData = {
            name: name.trim(),
            email: email?.trim() || '',
            phone: phone.trim(),
            cpf: cleanedCpf,
            birthDate: birthDate || '',
            church: finalChurch,
            pastor: finalPastor,
            address: address?.trim() || '',
            healthInfo: healthInfo?.trim() || '',
            churchId: churchId,
            createdBy: secretaryId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await adminDb.collection('seniors').add(seniorData);

        return NextResponse.json({
            id: docRef.id,
            ...seniorData
        }, { status: 201 });

    } catch (error: any) {
        console.error('Erro ao criar idoso:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor', details: error.message },
            { status: 500 }
        );
    }
}