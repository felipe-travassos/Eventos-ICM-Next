// app/api/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Função auxiliar para pegar o usuário atual (você precisa implementar)
async function getCurrentUser(request: NextRequest) {
    // Esta função deve verificar o token JWT ou sessão
    // Retorna { uid: string, role: string, email: string }
    // Implementação exemplo:
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // Verificar token e retornar usuário
    return { uid: 'user123', role: 'secretary-local', email: 'secretario@igreja.com' };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Dados da inscrição recebidos:', body);

        // 1. VERIFICAR PERMISSÃO
        const user = await getCurrentUser(request);

        if (user.role !== 'secretary-local') {
            console.log('Usuário não autorizado:', user);
            return NextResponse.json(
                { error: 'Apenas secretários podem fazer esta operação' },
                { status: 403 }
            );
        }

        // 2. PREPARAR DADOS DA INSCRIÇÃO
        const registrationData = {
            // Dados do evento
            eventId: body.eventId,
            eventName: body.eventName,

            // Dados do participante (idoso)
            userType: 'senior', // Identifica que é um idoso
            seniorId: body.seniorId, // ID do documento do idoso
            userName: body.userName,
            userEmail: body.userEmail || 'idoso@igreja.com',
            userPhone: body.userPhone,
            userCpf: body.userCpf,

            // Dados da igreja
            churchName: body.churchName,
            pastorName: body.pastorName,

            // Dados do pagamento
            paymentId: body.paymentId,
            paymentStatus: 'pending', // Inicialmente pendente

            // Metadados
            registeredBy: user.uid, // ID do secretário que fez a inscrição
            registeredByEmail: user.email,
            registrationType: 'secretary', // Tipo de inscrição
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 3. SALVAR NO FIRESTORE
        console.log('Salvando inscrição no Firestore...');
        const docRef = await adminDb.collection('registrations').add(registrationData);
        console.log('Inscrição salva com ID:', docRef.id);

        // 4. ATUALIZAR HISTÓRICO DO IDOSO (se tiver seniorId)
        if (body.seniorId) {
            console.log('Atualizando histórico do idoso:', body.seniorId);
            await adminDb.collection('seniors').doc(body.seniorId).update({
                lastEventRegistered: body.eventId,
                lastEventName: body.eventName,
                updatedAt: new Date()
            });
        }

        // 5. RETORNAR SUCESSO
        return NextResponse.json({
            success: true,
            registrationId: docRef.id,
            message: 'Inscrição realizada com sucesso',
            data: registrationData
        });

-    } catch (error: any) {
-        console.error('Erro ao criar inscrição:', error);
-        return NextResponse.json(
-            {
-                error: 'Erro interno do servidor',
-                details: error.message
-            },
-            { status: 500 }
-        );
+    } catch (err: unknown) {
+        const message = err instanceof Error ? err.message : 'Erro interno do servidor';
+        console.error('Erro ao criar inscrição:', err);
+        return NextResponse.json(
+            {
+                error: 'Erro interno do servidor',
+                details: message
+            },
+            { status: 500 }
+        );
     }
}

// Também pode adicionar GET para listar inscrições
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (user.role !== 'secretary-local') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const secretaryId = searchParams.get('secretaryId') || user.uid;

        const snapshot = await adminDb
            .collection('registrations')
            .where('registeredBy', '==', secretaryId)
            .orderBy('createdAt', 'desc')
            .get();

        const registrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(registrations);
-    } catch (error) {
-        console.error('Erro ao buscar inscrições:', error);
-        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
+    } catch (err: unknown) {
+        const message = err instanceof Error ? err.message : 'Erro interno';
+        console.error('Erro ao buscar inscrições:', err);
+        return NextResponse.json({ error: message }, { status: 500 });
     }
}