import { FieldValue } from 'firebase/firestore';

// Tipo para LEITURA (quando os dados vêm do Firestore)
export interface EventRegistration {
    id: string;
    eventId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    userChurch: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    paymentDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Tipo para CRIAÇÃO (quando os dados vão para o Firestore)
export interface EventRegistrationCreate {
    eventId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    userChurch: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

// Faça o mesmo para Event
export interface Event {
    id: string;
    title: string;
    description: string;
    date: Date;
    endDate?: Date;
    location: string;
    capacity: number;
    registered: number;
    price: number;
    churchId: string;
    churchName: string;
    status: 'active' | 'inactive' | 'cancelled';
    imageURL?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventCreate {
    title: string;
    description: string;
    date: Date;
    endDate?: Date;
    location: string;
    capacity: number;
    registered: number;
    price: number;
    churchId: string;
    churchName: string;
    status: 'active' | 'inactive' | 'cancelled';
    imageURL?: string;
    createdAt: FieldValue;
    updatedAt: FieldValue;
}