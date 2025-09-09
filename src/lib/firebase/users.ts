// lib/firebase/users.ts
import {
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from './config';
import { Church, User, UserRole } from '@/types';

export const updateProfileData = async (userId: string, data: {

  cpf?: string;
  phone?: string;
  churchId?: string;
}) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

// Função para buscar todos as igrejas
export const getChurches = async (): Promise<Church[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'churches'));
    const churches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Church[];

    console.log('Igrejas carregadas:', churches); // Debug
    return churches;
  } catch (error) {
    console.error('Erro ao buscar igrejas:', error);
    return [];
  }
}

// Função para buscar todos os usuários (apenas para administradores)
export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), orderBy('name', 'asc'))
    );

    const users: User[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        cpf: data.cpf,
        phone: data.phone,
        churchId: data.churchId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as User);
    });

    return users;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};

// Função para atualizar a role de um usuário
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date()
    });

    // Se estiver alterando para uma role que não seja pastor, remover vínculo com igreja
    if (newRole !== 'pastor') {
      await updateDoc(doc(db, 'users', userId), {
        churchId: null
      });

      // Também remover o pastorId da igreja, se houver
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (userData?.churchId) {
        await updateDoc(doc(db, 'churches', userData.churchId), {
          pastorId: null,
          pastorName: null,
          updatedAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar função do usuário:', error);
    throw error;
  }
};

// Função para buscar usuários por role
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const users: User[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        cpf: data.cpf,
        phone: data.phone,
        churchId: data.churchId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as User);
    });

    return users;
  } catch (error) {
    console.error(`Erro ao buscar usuários com role ${role}:`, error);
    throw error;
  }
};

// Função para buscar um usuário específico
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      cpf: data.cpf,
      phone: data.phone,
      churchId: data.churchId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};