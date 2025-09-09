import { Timestamp } from 'firebase/firestore';

export type UserRole = 'pastor' | 'secretario_regional' | 'secretario_local' | 'membro';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    churchId?: string;
    photoURL?: string;
    createdAt: Date;
}

export interface Church {
    id: string;
    name: string;
    address: string;
    pastorId?: string;
    region: string;
    createdAt: Date;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    imageURL?: string;
    maxParticipants?: number;
    currentParticipants: number;
    status: 'active' | 'ended' | 'cancelled';
    createdAt: Date;
    createdBy: string;
}

export interface EventRegistration {
    id: string;
    eventId: string;
    userId: string;
    registrationDate: Date;
    status: 'confirmed' | 'pending' | 'cancelled';
}