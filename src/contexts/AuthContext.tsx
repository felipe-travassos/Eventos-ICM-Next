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
import { useRouter } from 'next/navigation'; // ← Correção aqui
import Layout from '@/components/layout/Layout';
import Footer from '@/components/layout/Footer';

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
    const [isClient, setIsClient] = useState(false);
    const router = useRouter(); // ← Hook useRouter

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
        try {
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
            router.push('/'); // ← Usando useRouter corretamente
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    useEffect(() => {
        setIsClient(true);

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
                    <Layout showContainer={!!currentUser}>
                        {children}
                    </Layout>
                    <Footer />
                </>
            )}
        </AuthContext.Provider>
    );
};