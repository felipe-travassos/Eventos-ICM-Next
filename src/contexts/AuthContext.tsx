// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, UserRole } from '@/types';

import { useRouter } from 'next/navigation';


interface AuthContextType {
    currentUser: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserData: (newData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email: string, password: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc: User = {
            id: user.uid,
            uid: user.uid,
            churchId: '',
            cpf: '',
            name,
            email,
            phone: '',
            role: 'membro' as UserRole,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
            router.push('/');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const updateUserData = (newData: Partial<User>) => {
        if (userData) {
            setUserData({ ...userData, ...newData });
        }
    };


    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    // Use onSnapshot para listener em tempo real
                    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
                        if (doc.exists()) {
                            const data = doc.data();
                            setUserData({
                                id: doc.id,
                                uid: user.uid,
                                churchId: data.churchId || '',
                                cpf: data.cpf || '',
                                name: data.name || '',
                                email: data.email || '',
                                phone: data.phone || '',
                                role: data.role || 'membro',
                                createdAt: data.createdAt?.toDate() || new Date(),
                                updatedAt: data.updatedAt?.toDate() || new Date()
                            });
                        } else {
                            setUserData(null);
                        }
                    });

                    // Retorne a função de unsubscribe para limpar o listener
                    return unsubscribeUser;
                } catch (error) {
                    console.error('Erro ao buscar dados do usuário:', error);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribeAuth;
    }, []);

    const contextValue: AuthContextType = {
        currentUser,
        userData,
        loading,
        login,
        register,
        updateUserData,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};