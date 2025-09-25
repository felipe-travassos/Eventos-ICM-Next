// lib/firebase/events.ts
import {
    collection,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    updateDoc,
    addDoc,
    deleteDoc,
    orderBy,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { EventRegistration, Event, User } from '@/types';
import { canUserRegisterForEvents, getRegistrationErrorMessage } from '@/lib/firebase/userRegistrationValidation';


/**
 * Busca os detalhes completos de uma igreja pelo ID
 * @param churchId - ID da igreja
 * @returns Promise<{id: string, name: string, pastor: string, pastorId: string} | null> - Dados completos da igreja
 */
export const getChurchDetails = async (churchId: string) => {
    try {
        const churchDoc = await getDoc(doc(db, 'churches', churchId));
        if (churchDoc.exists()) {
            const churchData = churchDoc.data();
            return {
                id: churchId,
                name: churchData.name || '',
                pastor: churchData.pastorName || '',
                pastorId: churchData.pastorId || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar detalhes da igreja:', error);
        return null;
    }
};

/**
 * Busca os detalhes completos de uma igreja pelo ID
 * @param churchId - ID da igreja
 * @returns Promise<{id: string, name: string, pastor: string, pastorId: string} | null> - Dados completos da igreja
 */
export const getChurchById = async (churchId: string): Promise<{ id: string, name: string, pastor: string, pastorId: string } | null> => {
    try {
        const churchDoc = await getDoc(doc(db, 'churches', churchId));

        if (churchDoc.exists()) {
            const data = churchDoc.data();

            // Tente diferentes campos para encontrar o nome do pastor
            const pastorName = data.pastorName || data.pastorNome || data.pastor || 'Pastor não informado';
            const pastorId = data.pastorId || data.pastor || '';

            return {
                id: churchDoc.id,
                name: data.name || 'Igreja não encontrada',
                pastor: pastorName,
                pastorId: pastorId
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar igreja:', error);
        return null;
    }
};

/**
 * Busca os detalhes de um evento pelo ID
 * @param eventId - ID do evento
 * @returns Promise<Event | null> - Dados do evento ou null se não encontrado
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
    try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));

        if (eventDoc.exists()) {
            const data = eventDoc.data();
            return {
                id: eventDoc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                maxParticipants: Number(data.maxParticipants) || 0,
                currentParticipants: Number(data.currentParticipants) || 0,
                price: Number(data.price) || 0,
                status: data.status || 'active',
                location: data.location || '',
                description: data.description || '',
                imageURL: data.imageURL || '',
                createdBy: data.createdBy || ''
            } as Event;
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar evento:', error);
        return null;
    }
};

/**
 * Exclui permanentemente uma inscrição de evento
 * @param registrationId - ID da inscrição a ser excluída
 * @param eventId - ID do evento relacionado
 * @returns Promise<{success: boolean, message: string}> - Resultado da operação
 */
// Deixe apenas a exclusão do Firestore, o cancelamento é feito separadamente
export const deleteEventRegistration = async (registrationId: string, eventId: string) => {
    try {
        console.log('Excluindo inscrição do Firestore:', registrationId);

        await deleteDoc(doc(db, 'registrations', registrationId));
        console.log('Inscrição excluída com sucesso');

        return {
            success: true,
            message: 'Inscrição excluída com sucesso'
        };
    } catch (error: any) {
        console.error('Erro ao excluir inscrição:', error);
        return {
            success: false,
            message: 'Erro ao excluir inscrição: ' + error.message
        };
    }
}

/**
 * Busca todos os eventos e sincroniza automaticamente os contadores de participantes
 * Verifica inconsistências entre o contador do evento e as inscrições reais
 * @returns Promise<Event[]> - Array de eventos com contadores sincronizados
 */
export const getEventsWithSync = async (): Promise<Event[]> => {
    try {
        console.log('🔄 Iniciando sincronização de eventos...');

        // Buscar todos os eventos do Firestore
        const querySnapshot = await getDocs(collection(db, 'events'));
        const events = querySnapshot.docs.map(doc => {
            const data = doc.data();

            // ✅ DEBUG: Log dos dados brutos
            console.log('📄 Evento RAW:', {
                id: doc.id,
                title: data.title,
                maxParticipantsRaw: data.maxParticipants,
                currentParticipantsRaw: data.currentParticipants,
                tipoMax: typeof data.maxParticipants,
                tipoCurrent: typeof data.currentParticipants
            });

            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                maxParticipants: Number(data.maxParticipants) || 0,
                currentParticipants: Number(data.currentParticipants) || 0,
                price: Number(data.price) || 0,
                status: data.status || 'active',
                location: data.location || '',
                description: data.description || '',
                imageURL: data.imageURL || '',
                createdBy: data.createdBy || ''
            } as Event;
        });

        // ✅ CORREÇÃO: Verificar TODOS os eventos, não só os com currentParticipants > 0
        const syncPromises = events.map(async (event) => {
            try {
                console.log(`🔍 Verificando evento ${event.id}: ${event.title}`);

                // Buscar inscrições reais para ESTE evento
                const registrationsQuery = query(
                    collection(db, 'registrations'),
                    where('eventId', '==', event.id),
                    where('status', 'in', ['pending', 'approved', 'confirmed', 'paid'])
                );

                const querySnapshot = await getDocs(registrationsQuery);
                const actualParticipants = querySnapshot.size;

                console.log(`📊 Evento ${event.id}:`, {
                    contadorAtual: event.currentParticipants,
                    inscricoesReais: actualParticipants,
                    precisaCorrecao: event.currentParticipants !== actualParticipants
                });

                // ✅ CORREÇÃO: Sempre corrigir se houver diferença
                if (event.currentParticipants !== actualParticipants) {
                    console.log(`🔄 Corrigindo evento ${event.id}: de ${event.currentParticipants} para ${actualParticipants} participantes`);

                    await updateDoc(doc(db, 'events', event.id), {
                        currentParticipants: actualParticipants,
                        updatedAt: new Date()
                    });

                    // Atualizar também no array local
                    event.currentParticipants = actualParticipants;

                    console.log(`✅ Evento ${event.id} sincronizado: ${actualParticipants} participantes reais`);
                } else {
                    console.log(`✓ Evento ${event.id} já está sincronizado: ${actualParticipants} participantes`);
                }
            } catch (error) {
                console.error(`❌ Erro ao sincronizar evento ${event.id}:`, error);
            }
        });

        // Executar todas as sincronizações em paralelo
        console.log('⏳ Executando sincronizações...');
        await Promise.all(syncPromises);
        console.log('✅ Todas as sincronizações concluídas');

        return events;
    } catch (error) {
        console.error('❌ Erro ao buscar e sincronizar eventos:', error);
        return [];
    }
};

/**
 * Busca todos os eventos sem sincronização automática
 * @returns Promise<Event[]> - Array de eventos
 */
export const getAllEvents = async (): Promise<Event[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const events = querySnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                maxParticipants: Number(data.maxParticipants) || 0,
                currentParticipants: Number(data.currentParticipants) || 0,
                price: Number(data.price) || 0,
                status: data.status || 'active',
                location: data.location || '',
                description: data.description || '',
                imageURL: data.imageURL || '',
                createdBy: data.createdBy || ''
            } as Event;
        });

        return events;
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        return [];
    }
};

/**
 * Registra um usuário em um evento
 * @param eventId - ID do evento
 * @param userId - ID do usuário
 * @param userData - Dados do usuário (nome, email, telefone, igreja)
 * @param fullUserData - Dados completos do usuário para validação
 * @returns Promise<{success: boolean, message: string}> - Resultado da operação
 */
export const registerForEvent = async (
    eventId: string,
    userId: string,
    userData: { name: string; email: string; phone: string; church: string; cpf?: string },
    fullUserData?: User
): Promise<{ success: boolean; message: string }> => {
    try {
        // Validar se o usuário tem dados completos para se inscrever
        if (fullUserData) {
            const eligibility = canUserRegisterForEvents(fullUserData);
            if (!eligibility.canRegister) {
                const errorMessage = getRegistrationErrorMessage(eligibility.errors, eligibility.missingFields);
                return { success: false, message: errorMessage };
            }
        }

        // Validações de dados obrigatórios
        if (!userData.phone || userData.phone.length < 10) {
            return { success: false, message: 'Número de celular inválido' };
        }

        if (!userData.church) {
            return { success: false, message: 'Igreja não informada' };
        }

        console.log('Iniciando registro para evento:', eventId, userId);

        // Verificar se o evento existe
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
            console.log('Evento não encontrado no Firestore');
            return { success: false, message: 'Evento não encontrado' };
        }

        const eventData = eventDoc.data();
        const maxParticipants = Number(eventData.maxParticipants) || 0;
        const currentParticipants = Number(eventData.currentParticipants) || 0;

        // Verificar disponibilidade de vagas
        if (currentParticipants >= maxParticipants) {
            console.log('Vagas esgotadas no Firestore');
            return { success: false, message: 'Vagas esgotadas' };
        }

        // Verificar se usuário já está inscrito
        const alreadyRegistered = await checkUserRegistration(eventId, userId);
        if (alreadyRegistered) {
            console.log('Usuário já inscrito no evento');
            return { success: false, message: 'Você já está inscrito neste evento' };
        }

        // Verificar se CPF já está inscrito no evento (se CPF foi fornecido)
        if (userData.cpf) {
            const cpfAlreadyRegistered = await checkCpfRegistration(eventId, userData.cpf);
            if (cpfAlreadyRegistered) {
                console.log('CPF já inscrito no evento');
                return { success: false, message: 'Este CPF já possui uma inscrição neste evento' };
            }
        }

        // Buscar detalhes completos da igreja
        let churchName = 'Igreja não encontrada';
        let pastorName = 'Pastor não informado';

        try {
            const churchDoc = await getDoc(doc(db, 'churches', userData.church));
            if (churchDoc.exists()) {
                const churchData = churchDoc.data();
                churchName = churchData.name || 'Igreja não encontrada';
                pastorName = churchData.pastorName || 'Pastor não informado';
            }
        } catch (churchError) {
            console.error('Erro ao buscar dados da igreja:', churchError);
            // Continua com os valores padrão mesmo se der erro
        }

        // Criar documento de inscrição com dados completos
        const registrationData = {
            eventId,
            userId,
            userName: userData.name,
            userEmail: userData.email,
            userPhone: userData.phone,
            userChurch: userData.church, // ID da igreja
            churchName: churchName,      // Nome da igreja
            pastorName: pastorName,      // Nome do pastor
            userCpf: userData.cpf ? userData.cpf.replace(/\D/g, '') : '', // CPF limpo (apenas números)
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await addDoc(collection(db, 'registrations'), registrationData);

        // Atualizar contador de participantes do evento
        await updateDoc(doc(db, 'events', eventId), {
            currentParticipants: currentParticipants + 1,
            updatedAt: new Date()
        });

        console.log('Inscrição realizada com sucesso! Dados da igreja:', { churchName, pastorName });
        return { success: true, message: 'Inscrição realizada com sucesso!' };

    } catch (error: any) {
        console.error('Erro ao realizar inscrição:', error);
        return {
            success: false,
            message: 'Erro ao realizar inscrição'
        };
    }
};

/**
 * Busca todas as inscrições de um usuário
 * @param userId - ID do usuário
 * @returns Promise<EventRegistration[]> - Array de inscrições do usuário
 */
export const getUserRegistrations = async (userId: string): Promise<EventRegistration[]> => {
    try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(
            registrationsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const registrations: EventRegistration[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            registrations.push({
                id: doc.id,
                eventId: data.eventId,
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail,
                userPhone: data.userPhone,
                userChurch: data.userChurch,
                churchName: data.churchName,
                pastorName: data.pastorName,
                status: data.status,
                paymentStatus: data.paymentStatus,
                paymentId: data.paymentId || '',
                paymentDate: data.paymentDate?.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                userCpf: data.userCpf || '',
                registeredBy: data.registeredBy || '',
                registeredByName: data.registeredByName || '',
                registrationType: data.registrationType || 'self'
            } as EventRegistration);
        });

        return registrations;
    } catch (error) {
        console.error('Erro ao buscar inscrições do usuário:', error);
        throw error;
    }
};

/**
 * Verifica se um usuário já está inscrito em um evento
 * @param eventId - ID do evento
 * @param userId - ID do usuário
 * @returns Promise<boolean> - True se usuário já está inscrito
 */
export const checkUserRegistration = async (eventId: string, userId: string): Promise<boolean> => {
    try {
        const q = query(
            collection(db, 'registrations'),
            where('eventId', '==', eventId),
            where('userId', '==', userId),
            where('status', 'in', ['pending', 'approved', 'confirmed', 'paid'])
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erro ao verificar inscrição do usuário:', error);
        return false;
    }
};

/**
 * Verifica se um CPF já está inscrito em um evento
 * @param eventId - ID do evento
 * @param cpf - CPF a ser verificado (apenas números)
 * @returns Promise<boolean> - True se CPF já está inscrito
 */
export const checkCpfRegistration = async (eventId: string, cpf: string): Promise<boolean> => {
    try {
        // Remove formatação do CPF para comparação
        const cleanCpf = cpf.replace(/\D/g, '');
        
        const q = query(
            collection(db, 'registrations'),
            where('eventId', '==', eventId),
            where('userCpf', '==', cleanCpf),
            where('status', 'in', ['pending', 'approved', 'confirmed', 'paid'])
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erro ao verificar CPF na inscrição:', error);
        return false;
    }
};

/**
 * Corrige manualmente o contador de participantes de um evento
 * Sincroniza o contador com o número real de inscrições ativas
 * @param eventId - ID do evento a ser corrigido
 * @returns Promise<void>
 */
export const fixEventsWithNullParticipants = async (): Promise<void> => {
    try {
        const eventsRef = collection(db, 'events');
        const querySnapshot = await getDocs(eventsRef);

        const updatePromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Se maxParticipants for null ou undefined, corrigir para 0
            if (data.maxParticipants === null || data.maxParticipants === undefined) {
                console.log(`🔧 Corrigindo evento ${doc.id}: maxParticipants de null para 0`);
                await updateDoc(doc.ref, {
                    maxParticipants: 0,
                    updatedAt: new Date()
                });
            }

            // Se currentParticipants for null ou undefined, corrigir para 0
            if (data.currentParticipants === null || data.currentParticipants === undefined) {
                console.log(`🔧 Corrigindo evento ${doc.id}: currentParticipants de null para 0`);
                await updateDoc(doc.ref, {
                    currentParticipants: 0,
                    updatedAt: new Date()
                });
            }
        });

        await Promise.all(updatePromises);
        console.log('✅ Correção de eventos concluída');
    } catch (error) {
        console.error('❌ Erro ao corrigir eventos:', error);
    }
};