import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebugAuth from '@/components/DebugAuth';
import { useAuth } from '@/contexts/AuthContext';

// Mock do hook useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('DebugAuth Component', () => {
  // Teste para o estado de carregamento
  it('deve mostrar o estado de carregamento corretamente', () => {
    // Configurar o mock para simular o estado de carregamento
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: null,
      userData: null,
      loading: true,
    });

    render(<DebugAuth />);
    
    // Verificar se o texto de carregamento está correto
    expect(screen.getByText('Loading: true')).toBeInTheDocument();
    expect(screen.getByText('CurrentUser: Not Logged In')).toBeInTheDocument();
    expect(screen.getByText('UserData: Null')).toBeInTheDocument();
    expect(screen.getByText('User ID: None')).toBeInTheDocument();
  });

  // Teste para o estado de usuário logado
  it('deve mostrar informações do usuário quando logado', () => {
    // Configurar o mock para simular um usuário logado
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: '123456' },
      userData: { name: 'Teste' },
      loading: false,
    });

    render(<DebugAuth />);
    
    // Verificar se as informações do usuário estão corretas
    expect(screen.getByText('Loading: false')).toBeInTheDocument();
    expect(screen.getByText('CurrentUser: Logged In')).toBeInTheDocument();
    expect(screen.getByText('UserData: Exists')).toBeInTheDocument();
    expect(screen.getByText('User ID: 123456')).toBeInTheDocument();
  });
});