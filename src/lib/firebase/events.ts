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
    serverTimestamp
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { EventRegistration, Event, EventRegistrationCreate } from '@/types';

// Função para buscar todos os eventos
export const getAllEvents = async (): Promise<Event[]> => {
    try {
        const eventsRef = collection(db, 'events');
        const querySnapshot = await getDocs(eventsRef);

        const events: Event[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Datas com fallbacks seguros
            const date = data.date?.toDate?.() || new Date();
            const createdAt = data.createdAt?.toDate?.() || new Date();

            events.push({
                id: doc.id,
                title: data.title || 'Sem título',
                description: data.description || '',
                date: date,
                endDate: data.endDate?.toDate?.(), // Opcional
                location: data.location || '',
                capacity: Number(data.maxParticipants) || 0, // Nome CORRETO do campo
                registered: Number(data.currentParticipants) || 0, // Nome CORRETO do campo
                price: Number(data.price) || 0,
                churchId: data.churchId || data.createdBy || '', // Fallback para createdBy
                churchName: data.churchName || '',
                status: data.status || 'active',
                imageURL: data.imageURL || '',
                createdAt: createdAt,
                updatedAt: data.updatedAt?.toDate?.() || createdAt // Fallback para createdAt
            });
        });

        console.log('Total de eventos carregados:', events.length);
        return events;
    } catch (error) {
        console.error('Erro detalhado ao buscar eventos:', error);
        throw error;
    }
};

// Função para registrar em um evento
export const registerForEvent = async (eventId: string, userId: string, userData: any) => {
    try {
        // Verificar se o evento existe e tem vagas
        const eventDoc = doc(db, 'events', eventId);
        const eventSnapshot = await getDoc(eventDoc);

        if (!eventSnapshot.exists()) {
            throw new Error('Evento não encontrado');
        }

        const eventData = eventSnapshot.data();
        const event = {
            id: eventSnapshot.id,
            ...eventData,
            date: eventData.date.toDate(),
            endDate: eventData.endDate?.toDate(),
            createdAt: eventData.createdAt.toDate(),
            updatedAt: eventData.updatedAt.toDate()
        } as Event;

        // Verificar se há vagas disponíveis
        if (event.registered >= event.capacity) {
            throw new Error('Não há vagas disponíveis para este evento');
        }

        // Verificar se o usuário já está inscrito neste evento
        const registrationsRef = collection(db, 'eventRegistrations');
        const existingRegistrationQuery = query(
            registrationsRef,
            where('eventId', '==', eventId),
            where('userId', '==', userId)
        );

        const existingRegistration = await getDocs(existingRegistrationQuery);

        if (!existingRegistration.empty) {
            throw new Error('Você já está inscrito neste evento');
        }

        // Criar a inscrição
        const registrationData: Omit<EventRegistrationCreate, 'id'> = {
            eventId,
            userId,
            userName: userData.name,
            userEmail: userData.email,
            userPhone: userData.phone || '',
            userChurch: userData.churchId || '',
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'eventRegistrations'), registrationData);

        // Atualizar o contador de inscritos no evento
        await updateDoc(eventDoc, {
            registered: increment(1),
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        console.error('Erro ao registrar para o evento:', error);
        throw new Error(error.message || 'Erro ao realizar inscrição');
    }
};

// Função para buscar inscrições do usuário
export const getUserRegistrations = async (userId: string): Promise<EventRegistration[]> => {
    try {
        const registrationsRef = collection(db, 'eventRegistrations');
        const q = query(registrationsRef, where('userId', '==', userId));
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
                status: data.status,
                paymentStatus: data.paymentStatus,
                paymentDate: data.paymentDate?.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            });
        });

        return registrations;
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        throw error;
    }
};