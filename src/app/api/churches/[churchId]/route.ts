import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: { churchId: string } }
) {
    try {
        const { churchId } = params;

        if (!churchId) {
            return NextResponse.json(
                { error: 'ID da igreja é obrigatório' },
                { status: 400 }
            );
        }

        // Buscar dados da igreja no Firestore
        const churchDoc = await adminDb.collection('churches').doc(churchId).get();

        if (!churchDoc.exists) {
            return NextResponse.json(
                { error: 'Igreja não encontrada' },
                { status: 404 }
            );
        }

        const churchData = churchDoc.data();

        return NextResponse.json({
            id: churchDoc.id,
            name: churchData?.name,
            pastorName: churchData?.pastorName,
            address: churchData?.address,
            region: churchData?.region,
            createdAt: churchData?.createdAt,
            updatedAt: churchData?.updatedAt
        });

    } catch (error) {
        console.error('Erro ao buscar igreja:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}