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

/**
 * Atualiza os dados do perfil do usuário no Firestore
 * @param userId - ID do usuário a ser atualizado
 * @param data - Objeto contendo os campos a serem atualizados (cpf, telefone, churchId)
 * @throws {Error} Se ocorrer um erro durante a atualização
 * @example
 * await updateProfileData('user123', {
 *   cpf: '123.456.789-00',
 *   phone: '(11) 99999-9999',
 *   churchId: 'ITBHv3pVDuBrc3CyzOp4'
 * });
 */
export const updateProfileData = async (userId: string, data: {
  cpf?: string;
  phone?: string;
  churchId?: string;
}) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date() // Adiciona timestamp de atualização
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error; // Propaga o erro para o chamador
  }
};

/**
 * Busca todas as igrejas cadastradas na coleção 'churches'
 * @returns {Promise<Church[]>} Array de objetos Church ou array vazio em caso de erro
 * @example
 * const churches = await getChurches();
 * churches.forEach(church => console.log(church.name));
 */
export const getChurches = async (): Promise<Church[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'churches'));
    const churches = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        address: data.address || '',
        pastorId: data.pastorId || '',
        pastorName: data.pastorName || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || undefined
      } as Church;
    });

    console.log('Igrejas carregadas:', churches);
    return churches;
  } catch (error) {
    console.error('Erro ao buscar igrejas:', error);
    return [];
  }
}

/**
 * Busca todos os usuários cadastrados, ordenados por nome (apenas para administradores)
 * @returns {Promise<User[]>} Array de objetos User
 * @throws {Error} Se ocorrer um erro durante a busca
 * @example
 * const users = await getUsers();
 * users.forEach(user => console.log(user.name, user.role));
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), orderBy('name', 'asc'))
    );

    const users: User[] = [];

    for (const userDoc of querySnapshot.docs) {
      const data = userDoc.data();
      let churchName = null;

      if (data.churchId) {
        try {
          const churchDoc = await getDoc(doc(db, 'churches', data.churchId as string));
          if (churchDoc.exists()) {
            const churchData = churchDoc.data() as { name?: string };
            churchName = churchData.name || null;
          }
        } catch (error) {
          console.error(`Erro ao buscar igreja ${data.churchId}:`, error);
        }
      }

      users.push({
        id: userDoc.id,
        name: data.name || '',
        email: data.email || '',
        role: (data.role as UserRole) || 'member',
        cpf: data.cpf || '',
        phone: data.phone || '',
        churchId: data.churchId || null,
        churchName: churchName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || undefined
      } as User);
    }

    return users;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};

/**
 * Atualiza a função (role) de um usuário e gerencia vínculos com igreja
 * @param userId - ID do usuário a ser atualizado
 * @param newRole - Nova função do usuário (admin, pastor, member)
 * @returns {Promise<void>}
 * @throws {Error} Se ocorrer um erro durante a atualização
 * @example
 * await updateUserRole('user123', 'pastor'); // Torna o usuário um pastor
 * await updateUserRole('user456', 'member'); // Remove privilégios de pastor
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  try {
    // Apenas atualiza a role do usuário
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar função do usuário:', error);
    throw error;
  }
};

/**
 * Busca usuários por função (role) específica, ordenados por nome
 * @param role - Função pela qual filtrar (admin, pastor, member)
 * @returns {Promise<User[]>} Array de usuários com a role especificada
 * @throws {Error} Se ocorrer um erro durante a busca
 * @example
 * const pastors = await getUsersByRole('pastor');
 * const admins = await getUsersByRole('admin');
 */
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const users: User[] = [];

    for (const userDoc of querySnapshot.docs) {
      const data = userDoc.data();
      let churchName = null;

      if (data.churchId) {
        try {
          const churchDoc = await getDoc(doc(db, 'churches', data.churchId as string));
          if (churchDoc.exists()) {
            const churchData = churchDoc.data() as { name?: string };
            churchName = churchData.name || null;
          }
        } catch (error) {
          console.error(`Erro ao buscar igreja ${data.churchId}:`, error);
        }
      }

      users.push({
        id: userDoc.id,
        name: data.name || '',
        email: data.email || '',
        role: (data.role as UserRole) || 'member',
        cpf: data.cpf || '',
        phone: data.phone || '',
        churchId: data.churchId || null,
        churchName: churchName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || undefined
      } as User);
    }

    return users;
  } catch (error) {
    console.error(`Erro ao buscar usuários com role ${role}:`, error);
    throw error;
  }
};

/**
 * Busca um usuário específico pelo ID
 * @param userId - ID do usuário a ser buscado
 * @returns {Promise<User | null>} Objeto User se encontrado, null se não existir
 * @throws {Error} Se ocorrer um erro durante a busca
 * @example
 * const user = await getUserById('user123');
 * if (user) {
 *   console.log('Usuário encontrado:', user.name);
 * } else {
 *   console.log('Usuário não encontrado');
 * }
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    let churchName = null;

    if (data.churchId) {
      try {
        const churchDoc = await getDoc(doc(db, 'churches', data.churchId as string));
        if (churchDoc.exists()) {
          const churchData = churchDoc.data();
          churchName = churchData.name || null;
        }
      } catch (error) {
        console.error(`Erro ao buscar igreja ${data.churchId}:`, error);
      }
    }

    return {
      id: userDoc.id,
      name: data.name || '',
      email: data.email || '',
      role: (data.role as UserRole) || 'member',
      cpf: data.cpf || '',
      phone: data.phone || '',
      churchId: data.churchId || null,
      churchName: churchName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || undefined
    } as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};
