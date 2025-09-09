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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, UserRole } from '@/types';
import Navbar from '@/components/layout/Navbar';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false); // ← Novo estado para controle de SSR

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email: string, password: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Criar documento do usuário no Firestore com role padrão 'membro'
        const userDoc = {
            id: user.uid,
            name,
            email,
            role: 'membro' as UserRole,
            createdAt: new Date()
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    useEffect(() => {
        setIsClient(true); // ← Marca que estamos no cliente

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Buscar dados do usuário no Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data() as User);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        login,
        register,
        logout,
        resetPassword
    };

    // Durante SSR (renderização do servidor), retorne apenas children sem Navbar
    if (!isClient) {
        return (
            <AuthContext.Provider value={value}>
                <main>{children}</main>
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && (
                <>
                    {currentUser && <Navbar />}
                    <main className={currentUser ? "container mx-auto p-4" : ""}>
                        {children}
                    </main>
                </>
            )}
        </AuthContext.Provider>
    );
};