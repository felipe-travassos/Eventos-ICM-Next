# Guia de Testes Unitários - Eventos ICM

Este guia explica como executar e criar testes unitários para o projeto Eventos ICM.

## Índice

1. [Introdução aos Testes Unitários](#introdução-aos-testes-unitários)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Executando os Testes](#executando-os-testes)
4. [Criando Novos Testes](#criando-novos-testes)
5. [Mocks e Simulações](#mocks-e-simulações)
6. [Boas Práticas](#boas-práticas)

## Introdução aos Testes Unitários

Os testes unitários são uma prática fundamental no desenvolvimento de software que consiste em testar pequenas partes do código (unidades) de forma isolada. No contexto deste projeto, utilizamos o Jest como framework de testes e o React Testing Library para testar componentes React.

Benefícios dos testes unitários:

- Identificar bugs precocemente
- Facilitar refatorações
- Documentar o comportamento esperado do código
- Aumentar a confiança nas alterações
- Melhorar o design do código

## Estrutura de Testes

Os testes estão organizados na pasta `src/__tests__/` seguindo uma estrutura que espelha a organização do código fonte:

```
src/
  __tests__/
    components/     # Testes para componentes React
    contexts/       # Testes para contextos React
    lib/            # Testes para funções de biblioteca
    utils/          # Testes para funções utilitárias
    api/            # Testes para rotas de API
```

Cada arquivo de teste segue o padrão de nomenclatura `[nome-do-arquivo].test.tsx` ou `[nome-do-arquivo].test.ts`.

## Executando os Testes

Para executar os testes, você pode usar os seguintes comandos:

```bash
# Executar todos os testes
npm test

# Executar testes em modo de observação (útil durante o desenvolvimento)
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

O relatório de cobertura será gerado na pasta `coverage/` e pode ser visualizado abrindo o arquivo `coverage/lcov-report/index.html` no navegador.

## Criando Novos Testes

### Testando Componentes React

Para testar um componente React, siga estas etapas:

1. Crie um arquivo de teste na pasta `src/__tests__/components/`
2. Importe o componente e as bibliotecas necessárias
3. Use o React Testing Library para renderizar o componente e interagir com ele
4. Escreva asserções para verificar o comportamento esperado

Exemplo:

```tsx
// src/__tests__/components/MeuComponente.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MeuComponente from '@/components/MeuComponente';

describe('MeuComponente', () => {
  it('deve renderizar corretamente', () => {
    render(<MeuComponente />);
    expect(screen.getByText('Texto Esperado')).toBeInTheDocument();
  });

  it('deve responder a interações do usuário', () => {
    render(<MeuComponente />);
    fireEvent.click(screen.getByText('Clique Aqui'));
    expect(screen.getByText('Clicado!')).toBeInTheDocument();
  });
});
```

### Testando Funções

Para testar funções utilitárias ou de biblioteca:

1. Crie um arquivo de teste na pasta `src/__tests__/utils/` ou `src/__tests__/lib/`
2. Importe a função a ser testada
3. Escreva casos de teste para diferentes cenários

Exemplo:

```ts
// src/__tests__/utils/formatters.test.ts
import { formatCurrency, formatDate } from '@/utils/formatters';

describe('Funções de formatação', () => {
  describe('formatCurrency', () => {
    it('deve formatar valores corretamente', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });
  });

  describe('formatDate', () => {
    it('deve formatar datas corretamente', () => {
      const date = new Date('2023-01-15');
      expect(formatDate(date)).toBe('15/01/2023');
    });
  });
});
```

### Testando Rotas de API

Para testar rotas de API:

1. Crie um arquivo de teste na pasta `src/__tests__/api/`
2. Importe a função de manipulador da rota
3. Simule requisições e respostas
4. Verifique se o manipulador responde corretamente

Exemplo:

```ts
// src/__tests__/api/minha-rota.test.ts
import { GET } from '@/app/api/minha-rota/route';
import { NextRequest, NextResponse } from 'next/server';

// Mock do NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('API Route: /api/minha-rota', () => {
  it('deve retornar dados corretos', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/minha-rota?param=valor',
    };

    await GET(mockRequest as unknown as NextRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

## Mocks e Simulações

O Jest permite simular (mock) dependências externas, como APIs, bibliotecas e contextos. Isso é útil para isolar o código que está sendo testado.

### Simulando Módulos

```ts
// Simular um módulo inteiro
jest.mock('@/lib/firebase/config', () => ({
  db: {},
  auth: {},
}));

// Simular funções específicas
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));
```

### Simulando Hooks

```tsx
// Simular hooks personalizados
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    currentUser: { uid: '123' },
    userData: { name: 'Teste' },
    loading: false,
  }),
}));
```

### Simulando Funções

```ts
// Simular implementação de função
const mockFn = jest.fn().mockImplementation(() => 'resultado');

// Simular resolução de promessa
const mockAsyncFn = jest.fn().mockResolvedValue({ data: 'resultado' });

// Simular rejeição de promessa
const mockErrorFn = jest.fn().mockRejectedValue(new Error('erro'));
```

## Boas Práticas

1. **Teste comportamentos, não implementações**: Foque no que o código deve fazer, não em como ele faz.

2. **Mantenha os testes independentes**: Cada teste deve poder ser executado isoladamente.

3. **Use nomes descritivos**: Os nomes dos testes devem descrever claramente o que está sendo testado.

4. **Siga o padrão AAA**: Arrange (preparar), Act (agir), Assert (verificar).

5. **Teste casos de erro**: Não teste apenas o caminho feliz, teste também como o código lida com erros.

6. **Mantenha os testes simples**: Um teste deve verificar uma única coisa.

7. **Limpe os mocks**: Use `beforeEach(() => { jest.clearAllMocks(); })` para limpar os mocks entre os testes.

8. **Evite testes frágeis**: Evite testar detalhes de implementação que podem mudar frequentemente.

9. **Mantenha a cobertura alta**: Tente manter uma cobertura de testes acima de 80%.

10. **Execute os testes regularmente**: Integre os testes ao seu fluxo de trabalho de desenvolvimento.

---

Este guia é um ponto de partida para os testes unitários no projeto. À medida que o projeto cresce, os testes podem ser expandidos e refinados conforme necessário.