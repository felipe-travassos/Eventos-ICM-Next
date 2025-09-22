// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

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

    // ✅ Referência para controlar o unsubscribe
    const unsubscribeRef = useRef<(() => void) | null>(null);

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

    /**
     * Componente de contexto para reset de senha
     */
    const resetPassword = async (email: string) => {
        try {
            // Validação básica do email
            if (!email || !email.includes('@')) {
                throw new Error('Por favor, insira um email válido');
            }

            // Verifica se o email está formatado corretamente
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Formato de email inválido');
            }

            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error: any) {
            console.error('Erro no resetPassword:', error);

            // Tratamento específico de erros do Firebase
            let errorMessage = 'Erro ao enviar email de redefinição';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Nenhuma conta encontrada com este email';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Erro de conexão. Verifique sua internet';
                    break;
                default:
                    errorMessage = error.message || 'Erro desconhecido';
            }

            throw new Error(errorMessage);
        }
    };

    const updateUserData = (newData: Partial<User>) => {
        if (userData) {
            setUserData({ ...userData, ...newData });
        }
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            // ✅ Limpar listener anterior antes de criar um novo
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }

            if (user) {
                try {
                    // ✅ Usar getDoc em vez de onSnapshot para evitar updates em tempo real
                    const userDoc = await getDoc(doc(db, 'users', user.uid));

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData({
                            id: userDoc.id,
                            uid: user.uid,
                            churchId: data.churchId || '',
                            cpf: data.cpf || '',
                            name: data.name || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            role: data.role || 'membro',
                            createdAt: data.createdAt?.toDate() || new Date(),
                            updatedAt: data.updatedAt?.toDate() || new Date(),
                            churchName: data.churchName || ''
                        });
                    } else {
                        setUserData(null);
                    }
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
            {!loading && children}
        </AuthContext.Provider>
    );
};