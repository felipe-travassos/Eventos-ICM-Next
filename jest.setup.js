// jest.setup.js
import '@testing-library/jest-dom';

// Mock do Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock do Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock do Firebase
jest.mock('@/lib/firebase/config', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
  auth: {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  },
  storage: {
    ref: jest.fn(),
  },
}));

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});