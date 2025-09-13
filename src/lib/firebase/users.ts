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
 *   churchId: 'church456'
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
    const churches = querySnapshot.docs.map(doc => ({
      id: doc.id, // Inclui o ID do documento
      ...doc.data() // Inclui todos os demais campos
    })) as Church[];

    console.log('Igrejas carregadas:', churches); // Log para debug
    return churches;
  } catch (error) {
    console.error('Erro ao buscar igrejas:', error);
    return []; // Retorna array vazio em caso de erro
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
      query(collection(db, 'users'), orderBy('name', 'asc')) // Ordena por nome ASC
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
        createdAt: data.createdAt.toDate(), // Converte Firestore Timestamp para Date
        updatedAt: data.updatedAt?.toDate() // Converte opcionalmente se existir
      } as User);
    });

    return users;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error; // Propaga o erro para tratamento no componente
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
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date() // Atualiza timestamp
    });

    // Se estiver alterando para uma role que não seja pastor, remover vínculo com igreja
    if (newRole !== 'pastor') {
      await updateDoc(doc(db, 'users', userId), {
        churchId: null // Remove referência à igreja
      });

      // Também remover o pastorId da igreja, se houver
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (userData?.churchId) {
        await updateDoc(doc(db, 'churches', userData.churchId), {
          pastorId: null,        // Remove referência ao pastor
          pastorName: null,      // Remove nome do pastor
          updatedAt: new Date()  // Atualiza timestamp
        });
      }
    }
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
      where('role', '==', role),     // Filtra por role
      orderBy('name', 'asc')         // Ordena por nome
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
      return null; // Retorna null se o usuário não existir
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