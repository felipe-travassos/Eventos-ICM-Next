// lib/firebase/events.ts
import {
    collection,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    updateDoc,
    increment,
    addDoc,
    orderBy,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { EventRegistration, Event } from '@/types';

/**
 * Busca todos os eventos e sincroniza automaticamente os contadores de participantes
 * Verifica inconsistências entre o contador do evento e as inscrições reais
 * @returns Promise<Event[]> - Array de eventos com contadores sincronizados
 */
export const getEventsWithSync = async (): Promise<Event[]> => {
    try {
        // Buscar todos os eventos do Firestore
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

        // Verificar e sincronizar eventos com possíveis inconsistências
        const syncPromises = events.map(async (event) => {
            // Só verificar eventos que mostram ter participantes
            if (event.currentParticipants > 0) {
                const registrationsQuery = query(
                    collection(db, 'registrations'),
                    where('eventId', '==', event.id),
                    where('status', 'in', ['pending', 'confirmed', 'paid'])
                );

                const querySnapshot = await getDocs(registrationsQuery);
                const actualParticipants = querySnapshot.size;

                // Corrigir se houver diferença entre contador e inscrições reais
                if (event.currentParticipants !== actualParticipants) {
                    await updateDoc(doc(db, 'events', event.id), {
                        currentParticipants: actualParticipants,
                        updatedAt: new Date()
                    });
                    console.log(`Evento ${event.id} sincronizado: ${actualParticipants} participantes reais`);
                }
            }
        });

        // Executar todas as sincronizações em paralelo
        await Promise.all(syncPromises);

        return events;
    } catch (error) {
        console.error('Erro ao buscar e sincronizar eventos:', error);
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
 * @returns Promise<{success: boolean, message: string}> - Resultado da operação
 */
export const registerForEvent = async (
    eventId: string,
    userId: string,
    userData: { name: string; email: string; phone: string; church: string }
): Promise<{ success: boolean; message: string }> => {
    try {
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

        // Criar documento de inscrição
        const registrationData = {
            eventId,
            userId,
            userName: userData.name,
            userEmail: userData.email,
            userPhone: userData.phone,
            userChurch: userData.church,
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

        console.log('Inscrição realizada com sucesso!');
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
        const q = query(
            collection(db, 'registrations'),
            where('userId', '==', userId),
            where('status', 'in', ['pending', 'confirmed', 'paid']),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        const registrations = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                eventId: data.eventId,
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail,
                userPhone: data.userPhone,
                userChurch: data.userChurch,
                status: data.status || 'pending',
                paymentStatus: data.paymentStatus || 'pending',
                paymentDate: data.paymentDate?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date()
            } as EventRegistration;
        });

        return registrations;
    } catch (error) {
        console.error('Erro ao buscar inscrições do usuário:', error);
        return [];
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
            where('status', 'in', ['pending', 'confirmed', 'paid'])
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erro ao verificar inscrição do usuário:', error);
        return false;
    }
};

/**
 * Corrige manualmente o contador de participantes de um evento
 * Sincroniza o contador com o número real de inscrições ativas
 * @param eventId - ID do evento a ser corrigido
 * @returns Promise<void>
 */
export const fixEventRegistrationCount = async (eventId: string): Promise<void> => {
    try {
        // Contar inscrições ativas do evento
        const registrationsQuery = query(
            collection(db, 'registrations'),
            where('eventId', '==', eventId),
            where('status', 'in', ['pending', 'confirmed', 'paid'])
        );

        const querySnapshot = await getDocs(registrationsQuery);
        const actualParticipants = querySnapshot.size;

        // Atualizar contador do evento
        await updateDoc(doc(db, 'events', eventId), {
            currentParticipants: actualParticipants,
            updatedAt: new Date()
        });

        console.log(`Evento ${eventId} corrigido: ${actualParticipants} participantes reais`);
    } catch (error) {
        console.error('Erro ao corrigir contador do evento:', error);
        throw error;
    }
};