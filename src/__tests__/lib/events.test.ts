import { checkUserRegistration } from '@/lib/firebase/events';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Mock do Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('Funções de eventos', () => {
  describe('checkUserRegistration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve retornar true quando o usuário está inscrito no evento', async () => {
      // Configurar mocks para simular um usuário inscrito
      const mockQuerySnapshot = {
        empty: false,
      };
      
      (query as jest.Mock).mockReturnValue('mockQuery');
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await checkUserRegistration('event123', 'user456');

      // Verificar se as funções do Firestore foram chamadas corretamente
      expect(collection).toHaveBeenCalledWith(db, 'registrations');
      expect(where).toHaveBeenCalledWith('eventId', '==', 'event123');
      expect(where).toHaveBeenCalledWith('userId', '==', 'user456');
      expect(where).toHaveBeenCalledWith('status', 'in', ['pending', 'confirmed', 'paid']);
      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalledWith('mockQuery');
      
      // Verificar o resultado
      expect(result).toBe(true);
    });

    it('deve retornar false quando o usuário não está inscrito no evento', async () => {
      // Configurar mocks para simular um usuário não inscrito
      const mockQuerySnapshot = {
        empty: true,
      };
      
      (query as jest.Mock).mockReturnValue('mockQuery');
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await checkUserRegistration('event123', 'user456');

      // Verificar o resultado
      expect(result).toBe(false);
    });

    it('deve retornar false quando ocorre um erro', async () => {
      // Configurar mock para simular um erro
      (query as jest.Mock).mockReturnValue('mockQuery');
      (getDocs as jest.Mock).mockRejectedValue(new Error('Erro de teste'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await checkUserRegistration('event123', 'user456');

      // Verificar se o erro foi registrado
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao verificar inscrição do usuário:', expect.any(Error));
      
      // Verificar o resultado
      expect(result).toBe(false);

      // Restaurar o console.error
      consoleSpy.mockRestore();
    });
  });
});