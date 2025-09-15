import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventCard from '@/components/events/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Event, EventRegistration } from '@/types';

// Mock dos hooks
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock do componente Image do Next.js
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} src={props.src || ''} alt={props.alt || ''} />;
  },
}));

// Mock do Intl.DateTimeFormat
const mockFormat = jest.fn().mockReturnValue('31/12/2023 12:00');
const originalDateTimeFormat = Intl.DateTimeFormat;
beforeAll(() => {
  // @ts-ignore
  global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
    format: mockFormat
  }));
});

afterAll(() => {
  global.Intl.DateTimeFormat = originalDateTimeFormat;
});

describe('EventCard Component', () => {
  // Mock de um evento para testes
  const mockEvent: Event = {
    id: 'event123',
    title: 'Evento de Teste',
    description: 'Descrição do evento de teste',
    date: new Date('2023-12-31'),
    location: 'Local de Teste',
    price: 50,
    maxParticipants: 100,
    currentParticipants: 50,
    imageURL: 'https://example.com/image.jpg',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user123',
    type: 'conference',
    church: 'Igreja Teste'
  };

  // Mock da função onSubscribe
  const mockOnSubscribe = jest.fn().mockResolvedValue(undefined);

  // Mock do router
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar o mock do useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Configurar o mock do useAuth com um usuário logado
    (useAuth as jest.Mock).mockReturnValue({
      userData: { uid: 'user123', name: 'Usuário Teste' },
      currentUser: { uid: 'user123' },
      loading: false
    });
  });

  it('deve renderizar as informações do evento corretamente', () => {
    render(
      <EventCard 
        event={mockEvent} 
        showRegistration={true}
        onSubscribe={mockOnSubscribe}
        userRegistrations={[]}
      />
    );

    // Verificar se as informações do evento estão sendo exibidas
    expect(screen.getByText('Evento de Teste')).toBeInTheDocument();
    expect(screen.getByText(/descrição do evento de teste/i)).toBeInTheDocument();
    expect(screen.getByText(/local de teste/i)).toBeInTheDocument();
    // Verificar se o preço está sendo exibido (pode variar a formatação)
    expect(screen.getByText(/50/)).toBeInTheDocument();
    // Verificar se a informação de participantes está sendo exibida
    expect(screen.getByText(/50.*100/)).toBeInTheDocument();
  });

  it('deve chamar onSubscribe quando o botão de inscrição é clicado', async () => {
    render(
      <EventCard 
        event={mockEvent} 
        showRegistration={true}
        onSubscribe={mockOnSubscribe}
        userRegistrations={[]}
      />
    );

    // Clicar no botão de inscrição
    const button = screen.getByRole('button', { name: /inscrever/i });
    fireEvent.click(button);

    // Verificar se onSubscribe foi chamado com o ID do evento
    expect(mockOnSubscribe).toHaveBeenCalledWith('event123');

    // Esperar que a mensagem de sucesso apareça
    await waitFor(() => {
      expect(screen.getByText(/inscrição realizada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('deve redirecionar para o login quando o usuário não está logado', () => {
    // Configurar o mock do useAuth sem usuário logado
    (useAuth as jest.Mock).mockReturnValue({
      userData: null,
      currentUser: null,
      loading: false
    });
    
    render(
      <EventCard 
        event={mockEvent} 
        showRegistration={true}
        onSubscribe={mockOnSubscribe}
        userRegistrations={[]}
      />
    );

    // Clicar no botão de inscrição
    const button = screen.getByRole('button', { name: /inscrever/i });
    fireEvent.click(button);

    // Verificar se o router.push foi chamado com o caminho de login
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
  });

  it('deve mostrar status de inscrição quando o usuário já está inscrito', () => {
    // Configurar o mock do useAuth com usuário logado
    (useAuth as jest.Mock).mockReturnValue({
      userData: { uid: 'user123', name: 'Usuário Teste' },
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    // Mock de inscrição do usuário
    const userRegistrations: EventRegistration[] = [
      {
        id: 'reg123',
        userId: 'user123',
        eventId: 'event123',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentStatus: 'paid'
      }
    ];
    
    render(
      <EventCard 
        event={mockEvent} 
        showRegistration={true}
        onSubscribe={mockOnSubscribe}
        userRegistrations={userRegistrations}
      />
    );

    // Verificar se o status de inscrição é exibido
    expect(screen.getByText(/inscrito/i)).toBeInTheDocument();
  });
    });

    render(
      <EventCard 
        event={mockEvent} 
        showRegistration={true}
        onSubscribe={mockOnSubscribe}
      />
    );

    // Clicar no botão de inscrição
    fireEvent.click(screen.getByText('Inscrever-se'));

    // Verificar se o router.push foi chamado para redirecionar para o login
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login?redirect='));
    
    // Verificar que onSubscribe não foi chamado
    expect(mockOnSubscribe).not.toHaveBeenCalled();
  });

  it('deve mostrar status de inscrição quando o usuário já está inscrito', () => {
    // Mock de inscrições do usuário
    const mockUserRegistrations = [
      {
        id: 'reg123',
        eventId: 'event123',
        userId: 'user123',
        status: 'pending',
        createdAt: new Date(),
      }
    ];

    render(
      <EventCard 
        event={mockEvent} 
        showRegistration={true}
        onSubscribe={mockOnSubscribe}
        userRegistrations={mockUserRegistrations}
      />
    );

    // Verificar se o status de inscrição é exibido
    expect(screen.getByText('Inscrição pendente')).toBeInTheDocument();
    
    // Verificar que o botão de inscrição não está disponível
    expect(screen.queryByText('Inscrever-se')).not.toBeInTheDocument();
  });
});