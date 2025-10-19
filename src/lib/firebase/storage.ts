import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// Upload de imagem para eventos (com pasta do usuário)
export const uploadEventImage = async (file: File, userId: string): Promise<string> => {
    try {
        // Verificar se o usuário está autenticado
        if (!userId) {
            throw new Error('Usuário não autenticado');
        }

        // Criar referência com userId no path
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `events/${userId}/${fileName}`);

        // Fazer upload do arquivo
        const snapshot = await uploadBytes(storageRef, file);

        // Obter URL de download
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (err: unknown) {
        console.error('Erro detalhado ao fazer upload da imagem:', err);

        const e = err as { code?: string; message?: string };
        if (e.code === 'storage/unauthorized') {
            throw new Error('Sem permissão para fazer upload. Verifique as regras de segurança do Firebase.');
        } else if (e.code === 'storage/retry-limit-exceeded') {
            throw new Error('Tempo limite excedido. Verifique sua conexão com a internet.');
        } else {
            throw new Error('Falha no upload da imagem: ' + (e.message ?? 'Erro desconhecido'));
        }
    }
};

// Upload de imagem para eventos (sem pasta do usuário - mais simples)
export const uploadEventImageSimple = async (file: File): Promise<string> => {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `events/${fileName}`);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (err: unknown) {
        console.error('Erro no upload simples:', err);
        const e = err as { message?: string };
        throw new Error('Falha no upload da imagem: ' + (e.message ?? 'Erro desconhecido'));
    }
};

// Upload de imagem de perfil
export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
    try {
        const storageRef = ref(storage, `profiles/${userId}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (err: unknown) {
        console.error('Erro ao fazer upload da imagem de perfil:', err);
        throw new Error('Falha no upload da imagem de perfil');
    }
};

// Extrair path da imagem a partir da URL
export const extractImagePathFromURL = (url: string): string | null => {
    try {
        // A URL do Storage geralmente contém '/o/' seguido do path e '?alt=media'
        const match = url.match(/\/o\/(.+?)\?alt=media/);
        if (match && match[1]) {
            // Decodificar URL encoding (espaços como %20, etc)
            return decodeURIComponent(match[1]);
        }
        return null;
    } catch (err: unknown) {
        console.error('Erro ao extrair path da URL:', err);
        return null;
    }
};

// Deletar imagem
export const deleteImage = async (filePath: string): Promise<void> => {
    try {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
    } catch (err: unknown) {
        console.error('Erro ao deletar imagem:', err);
        throw new Error('Falha ao deletar imagem');
    }
};