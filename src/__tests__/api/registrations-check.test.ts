import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Importar a função GET da rota
import { GET } from '@/app/api/registrations/check/route';

// Mock do Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('API Route: /api/registrations/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar erro 400 quando parâmetros estão faltando', async () => {
    // Criar uma requisição sem parâmetros
    const mockRequest = {
      url: 'http://localhost:3000/api/registrations/check',
    };
    
    // Mock do NextResponse.json
    (NextResponse.json as jest.Mock).mockReturnValue({ status: 400 });

    await GET(mockRequest as unknown as NextRequest);

    // Verificar se NextResponse.json foi chamado com o erro correto
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Parâmetros faltando' },
      { status: 400 }
    );
  });

  it('deve retornar null quando não encontrar inscrição', async () => {
    // Criar uma requisição com parâmetros
    const mockRequest = {
      url: 'http://localhost:3000/api/registrations/check?eventId=event123&seniorId=senior456',
    };
    
    // Mock do snapshot vazio
    const mockSnapshot = {
      empty: true,
      docs: [],
    };
    
    // Configurar mocks
    (query as jest.Mock).mockReturnValue('mockQuery');
    (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
    (NextResponse.json as jest.Mock).mockReturnValue(null);

    await GET(mockRequest as unknown as NextRequest);

    // Verificar se as funções do Firestore foram chamadas corretamente
    expect(collection).toHaveBeenCalledWith(db, 'registrations');
    expect(where).toHaveBeenCalledWith('eventId', '==', 'event123');
    expect(where).toHaveBeenCalledWith('seniorId', '==', 'senior456');
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith('mockQuery');
    
    // Verificar se NextResponse.json foi chamado com null
    expect(NextResponse.json).toHaveBeenCalledWith(null);
  });

  it('deve retornar dados da inscrição quando encontrar', async () => {
    // Criar uma requisição com parâmetros
    const mockRequest = {
      url: 'http://localhost:3000/api/registrations/check?eventId=event123&seniorId=senior456',
    };
    
    // Mock dos dados da inscrição
    const mockRegistration = {
      eventId: 'event123',
      seniorId: 'senior456',
      status: 'pending',
      createdAt: { toDate: () => new Date('2023-01-01') },
      updatedAt: { toDate: () => new Date('2023-01-02') },
      approvedAt: { toDate: () => new Date('2023-01-03') },
    };
    
    // Mock do snapshot com dados
    const mockSnapshot = {
      empty: false,
      docs: [{
        id: 'reg123',
        data: () => mockRegistration,
      }],
    };
    
    // Configurar mocks
    (query as jest.Mock).mockReturnValue('mockQuery');
    (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
    (NextResponse.json as jest.Mock).mockReturnValue({ registration: 'data' });

    await GET(mockRequest as unknown as NextRequest);

    // Verificar se NextResponse.json foi chamado com os dados corretos
    expect(NextResponse.json).toHaveBeenCalledWith({
      id: 'reg123',
      ...mockRegistration,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      approvedAt: expect.any(Date),
    });
  });

  it('deve retornar erro 500 quando ocorre uma exceção', async () => {
    // Criar uma requisição com parâmetros
    const mockRequest = {
      url: 'http://localhost:3000/api/registrations/check?eventId=event123&seniorId=senior456',
    };
    
    // Configurar mock para lançar erro
    (query as jest.Mock).mockImplementation(() => {
      throw new Error('Erro de teste');
    });
    
    // Mock do console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await GET(mockRequest as unknown as NextRequest);

    // Verificar se o erro foi registrado
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao verificar inscrição:', expect.any(Error));
    
    // Verificar se NextResponse.json foi chamado com o erro
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Erro interno' },
      { status: 500 }
    );

    // Restaurar o console.error
    consoleSpy.mockRestore();
  });
});