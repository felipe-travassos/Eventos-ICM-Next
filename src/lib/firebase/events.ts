// src/lib/firebase/events.ts
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    Timestamp,
    orderBy,
    updateDoc
} from 'firebase/firestore';
import { db } from './config';
import { Event, EventRegistration } from '@/types';

export const registerForEvent = async (eventId: string, userId: string): Promise<string> => {
    try {
        // Verificar se já está inscrito
        const registrationQuery = query(
            collection(db, 'eventRegistrations'),
            where('eventId', '==', eventId),
            where('userId', '==', userId)
        );

        const existingRegistration = await getDocs(registrationQuery);

        if (!existingRegistration.empty) {
            throw new Error('Você já está inscrito neste evento');
        }

        // Buscar dados do evento
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
            throw new Error('Evento não encontrado');
        }

        const eventData = eventDoc.data();

        // Verificar se o evento está ativo
        if (eventData.status !== 'active') {
            throw new Error('Este evento não está mais disponível para inscrições');
        }

        // Verificar se há vagas disponíveis
        if (eventData.maxParticipants) {
            const registrationsCount = await getRegistrationCount(eventId);

            if (registrationsCount >= eventData.maxParticipants) {
                throw new Error('Não há mais vagas disponíveis para este evento');
            }
        }

        // Criar inscrição
        const registrationData = {
            eventId,
            userId,
            registrationDate: new Date(),
            status: 'confirmed'
        };

        const docRef = await addDoc(collection(db, 'eventRegistrations'), registrationData);

        // Atualizar contador de participantes
        await updateDoc(doc(db, 'events', eventId), {
            currentParticipants: (eventData.currentParticipants || 0) + 1
        });

        return docRef.id;
    } catch (error) {
        console.error('Erro ao registrar para o evento:', error);
        throw error;
    }
};

// Função auxiliar para contar inscrições
const getRegistrationCount = async (eventId: string): Promise<number> => {
    const q = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

export const getEventRegistrations = async (eventId: string) => {
    try {
        const q = query(
            collection(db, 'eventRegistrations'),
            where('eventId', '==', eventId)
        );

        const querySnapshot = await getDocs(q);
        const registrations: EventRegistration[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Converter Timestamp para Date
            registrations.push({
                id: doc.id,
                eventId: data.eventId,
                userId: data.userId,
                status: data.status,
                registrationDate: data.registrationDate.toDate() // Converter para Date
            } as EventRegistration);
        });

        return registrations;
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        throw error;
    }
};

// Função para buscar todos os eventos
// Função para buscar todos os eventos (sem filtro de data)
export const getAllEvents = async (): Promise<Event[]> => {
    try {
        const q = query(
            collection(db, 'events'),
            orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const events: Event[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                date: data.date.toDate(),
                location: data.location,
                imageURL: data.imageURL,
                maxParticipants: data.maxParticipants,
                currentParticipants: data.currentParticipants || 0,
                status: data.status || 'active',
                createdAt: data.createdAt.toDate(),
                createdBy: data.createdBy
            } as Event);
        });

        return events;
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        throw error;
    }
};

// Função específica para eventos ativos (usada na homepage)
export const getActiveEvents = async (): Promise<Event[]> => {
    try {
        const q = query(
            collection(db, 'events'),
            where('status', '==', 'active'),
            orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const events: Event[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                date: data.date.toDate(),
                location: data.location,
                imageURL: data.imageURL,
                maxParticipants: data.maxParticipants,
                currentParticipants: data.currentParticipants || 0,
                status: data.status || 'active',
                createdAt: data.createdAt.toDate(),
                createdBy: data.createdBy
            } as Event);
        });

        return events;
    } catch (error) {
        console.error('Erro ao buscar eventos ativos:', error);
        throw error;
    }
};