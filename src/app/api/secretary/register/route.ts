// app/api/secretary/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Chave secreta simples para autorização (guarde no .env)
const SECRETARY_SECRET = process.env.SECRETARY_SECRET || 'secretario-local-123';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Verificação simples por chave secreta
        if (body.secret !== SECRETARY_SECRET) {
            return NextResponse.json(
                { error: 'Acesso não autorizado' },
                { status: 401 }
            );
        }

        // Dados da inscrição
        const registrationData = {
            // Dados do evento
            eventId: body.eventId,
            eventName: body.eventName,

            // Dados do participante
            userType: 'senior',
            seniorId: body.seniorId,
            userName: body.userName,
            userEmail: body.userEmail || 'idoso@igreja.com',
            userPhone: body.userPhone,
            userCpf: body.userCpf,

            // Dados da igreja
            churchName: body.churchName,
            pastorName: body.pastorName,

            // Dados do pagamento
            paymentId: body.paymentId,
            paymentStatus: 'pending',

            // Metadados
            registeredBy: body.secretaryId, // ID do secretário
            registeredByName: body.secretaryName,
            registrationType: 'secretary',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Salvar no Firestore
        const docRef = await adminDb.collection('registrations').add(registrationData);

        // Atualizar histórico do idoso se existir seniorId
        if (body.seniorId) {
            await adminDb.collection('seniors').doc(body.seniorId).update({
                lastEventRegistered: body.eventId,
                lastEventName: body.eventName,
                updatedAt: new Date()
            });
        }

        return NextResponse.json({
            success: true,
            registrationId: docRef.id,
            message: 'Inscrição realizada com sucesso'
        });

    } catch (error: any) {
        console.error('Erro ao criar inscrição:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}