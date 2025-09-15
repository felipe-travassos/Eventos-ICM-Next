// lib/firebase/registrations.ts
import { db } from "./config";
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { EventRegistration } from "@/types";

export const getPendingRegistrations = async (): Promise<EventRegistration[]> => {
    const q = query(collection(db, 'registrations'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration));
};

export const approveRegistration = async (registrationId: string, approvedBy: string) => {
    const ref = doc(db, 'registrations', registrationId);
    await updateDoc(ref, {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
    });
};

export const rejectRegistration = async (registrationId: string, rejectedBy: string, reason: string) => {
    const ref = doc(db, 'registrations', registrationId);
    await updateDoc(ref, {
        status: 'rejected',
        rejectedBy,
        rejectionReason: reason,
        rejectedAt: new Date()
    });
};