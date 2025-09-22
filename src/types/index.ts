import { FieldValue } from 'firebase/firestore';

// Tipo para LEITURA (quando os dados vêm do Firestore)
export interface EventRegistration {
    id: string;
    eventId: string;
    userId: string;
    userType: 'user' | 'senior';
    seniorId?: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    userChurch: string;
    churchName: string;
    userCpf: string;
    pastorName: string;
    status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    paymentDate?: Date;
    registeredBy: string; // ID do secretário
    registeredByName: string;
    registrationType: 'self' | 'secretary';
    paymentId: string;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    rejectedBy?: string;
    createdAt: Date;
    updatedAt: Date;

}

export interface EventWithRegistrations extends Event {
    registrations: EventRegistration[];
    paidCount: number;
    pendingCount: number;
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
    maxParticipants: number;
    currentParticipants: number;
    price: number;
    churchId: string;
    churchName: string;
    status: 'active' | 'canceled' | 'completed';
    createdAt: Date;
    updatedAt: Date;
    imageURL?: string;
    createdBy?: string;
}

export interface EventCreate {
    title: string;
    description: string;
    date: Date;
    endDate?: Date;
    location: string;
    maxParticipants: number;
    currentParticipants: number;
    price: number;
    churchId: string;
    churchName: string;
    status: 'active' | 'inactive' | 'canceled';
    imageURL?: string;
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

//Interfaces de Pagamentos
export interface PaymentData {
    registrationId: string;
    eventId: string;
    amount: number;
    description: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    paymentId?: string;
}

// Adicione ao seu arquivo types.ts
import { User as FirebaseUser } from 'firebase/auth';

export interface User {
    id: string;
    uid: string;
    churchId: string;
    cpf: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    churchName?: string;
}

export interface Church {
    id: string;
    name: string;
    address: string;
    region: string;
    pastorId: string | null;
    pastorName: string | null;
    createdAt: Date;
    updatedAt?: Date;
}

export type UserRole = 'membro' | 'secretario_local' | 'pastor' | 'secretario_regional';

export interface AuthContextType {
    currentUser: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

export interface EventCardProps {
    event: Event;
    currentUser: FirebaseUser | null;
    userRegistrations: EventRegistration[];
    loadingRegistrations: boolean;
    registeringEventId: string | null;
    isProfileComplete: boolean;
    onSubscribe: (eventId: string) => void;
    onLogin: () => void;
}



// Tipo para dados de data do Firebase
export interface FirebaseTimestamp {
    seconds: number;
    nanoseconds: number;
    toDate: () => Date;
}

export interface FirebaseError {
    code: string;
    message: string;
};


// Tipo para dados que podem vir do Firebase
export type MaybeFirebaseDate = Date | string | FirebaseTimestamp | null | undefined;

//Interface de Idosos
export interface Senior {
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpf: string;
    church: string;
    pastor: string;
    birthDate?: string;
    address?: string;
    healthInfo?: string;
    churchId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
} 