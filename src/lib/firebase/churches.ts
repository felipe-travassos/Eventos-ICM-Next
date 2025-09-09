// lib/firebase/churches.ts
import { 
  doc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './config';

export const linkPastorToChurch = async (pastorId: string, churchId: string) => {
  try {
    // Primeiro, buscar dados do pastor
    const pastorDoc = await getDoc(doc(db, 'users', pastorId));
    if (!pastorDoc.exists()) {
      throw new Error('Pastor não encontrado');
    }

    const pastorData = pastorDoc.data();

    // Atualizar a igreja com o pastorId
    await updateDoc(doc(db, 'churches', churchId), {
      pastorId,
      pastorName: pastorData.name,
      updatedAt: new Date()
    });

    console.log('Pastor vinculado à igreja com sucesso');
  } catch (error) {
    console.error('Erro ao vincular pastor à igreja:', error);
    throw error;
  }
};

// Função para desvincular pastor da igreja (se necessário)
export const unlinkPastorFromChurch = async (churchId: string) => {
  try {
    await updateDoc(doc(db, 'churches', churchId), {
      pastorId: null,
      pastorName: null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao desvincular pastor da igreja:', error);
    throw error;
  }
};