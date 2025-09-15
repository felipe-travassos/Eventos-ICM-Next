import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Mock do Firebase Auth e Firestore
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
}));

// Componente de teste para acessar o contexto
const TestComponent = () => {
  const { currentUser, userData, loading, login, logout, register, resetPassword } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="currentUser">{currentUser ? 'logged-in' : 'logged-out'}</div>
      <div data-testid="userData">{userData ? JSON.stringify(userData) : 'null'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password', 'Test User')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => resetPassword('test@example.com')}>Reset Password</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com o estado de carregamento', () => {
    // Configurar o mock para não disparar o callback imediatamente
    (onAuthStateChanged as jest.Mock).mockImplementation(() => {
      return () => {}; // Retorna uma função de limpeza
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verificar o estado inicial
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('currentUser').textContent).toBe('logged-out');
    expect(screen.getByTestId('userData').textContent).toBe('null');
  });

  it('deve atualizar o estado quando o usuário faz login', async () => {
    // Configurar o mock para simular um usuário logado
    const mockUser = { uid: 'user123' };
    const mockUserData = {
      uid: 'user123',
      churchId: '',
      cpf: '',
      name: 'Test User',
      email: 'test@example.com',
      phone: '',
      role: 'user',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    };
    
    // Mock do onAuthStateChanged para disparar o callback com o usuário
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock do getDoc para retornar dados do usuário
    const mockDocSnap = {
      exists: () => true,
      data: () => ({ id: 'user123', name: 'Test User', email: 'test@example.com', role: 'user' }),
    };
    (doc as jest.Mock).mockReturnValue('userDocRef');
    (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar que o estado seja atualizado
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('currentUser').textContent).toBe('logged-in');
      const userData = JSON.parse(screen.getByTestId('userData').textContent || '{}');
      expect(userData).toMatchObject({
        uid: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      });
    });}
  });

  it('deve chamar signInWithEmailAndPassword quando login é chamado', async () => {
    // Configurar o mock para não disparar o callback imediatamente
    (onAuthStateChanged as jest.Mock).mockImplementation(() => {
      return () => {};
    });

    // Mock do signInWithEmailAndPassword para resolver com sucesso
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Clicar no botão de login
    await act(async () => {
      screen.getByText('Login').click();
    });

    // Verificar se a função foi chamada com os parâmetros corretos
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
  });

  // Mais testes podem ser adicionados para register, logout e resetPassword
});