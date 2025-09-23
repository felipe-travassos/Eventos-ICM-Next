# 📚 Documentação Completa - Sistema de Eventos ICM

## 🎯 Visão Geral

Este conjunto de documentos fornece um guia completo para utilização do Sistema de Eventos ICM. A documentação foi desenvolvida após análise detalhada da aplicação e está organizada para atender diferentes níveis de usuários e necessidades.

---

## 📋 Índice de Documentos

### 1. 📖 [Manual do Usuário](./MANUAL_USUARIO.md)
**Documento principal com visão geral completa do sistema**

**Conteúdo:**
- Visão geral da aplicação
- Tipos de usuários e permissões
- Primeiros passos no sistema
- Funcionalidades principais
- Fluxos de trabalho
- Arquitetura e tecnologias
- Políticas e procedimentos

**Para quem:** Todos os usuários, especialmente novos usuários

---

### 2. 🎓 [Tutoriais Detalhados](./TUTORIAIS_DETALHADOS.md)
**Guias passo a passo para cada funcionalidade**

**Conteúdo:**
- Tutorial completo para Membros
- Tutorial completo para Secretários Locais
- Tutorial completo para Pastores
- Tutorial completo para Secretários Regionais
- Tutoriais de funcionalidades específicas (PIX, QR Code, etc.)

**Para quem:** Usuários que precisam de instruções detalhadas

---

### 3. 📊 [Diagramas e Fluxogramas](./DIAGRAMAS_FLUXO.md)
**Representações visuais dos processos do sistema**

**Conteúdo:**
- Arquitetura do sistema
- Hierarquia de usuários
- Fluxos de inscrição e pagamento
- Diagramas de componentes
- Fluxogramas de processos
- Estrutura de dados

**Para quem:** Usuários visuais, administradores, desenvolvedores

---

### 4. ⚡ [Guia Rápido](./GUIA_RAPIDO.md)
**Referência rápida para usuários experientes**

**Conteúdo:**
- URLs principais
- Atalhos de teclado
- Ações rápidas por tipo de usuário
- Campos obrigatórios
- Códigos de status
- Dicas de performance

**Para quem:** Usuários experientes que precisam de referência rápida

---

### 5. 🛠️ [Troubleshooting e FAQ](./TROUBLESHOOTING_FAQ.md)
**Solução de problemas e perguntas frequentes**

**Conteúdo:**
- Problemas técnicos comuns e soluções
- Perguntas frequentes por categoria
- Situações de emergência
- Contatos de suporte
- Ferramentas de diagnóstico
- Códigos de erro

**Para quem:** Usuários com problemas, suporte técnico

---

## 🚀 Como Usar Esta Documentação

### Para Novos Usuários
1. **Comece com:** [Manual do Usuário](./MANUAL_USUARIO.md) - Seção "Primeiros Passos"
2. **Continue com:** [Tutoriais Detalhados](./TUTORIAIS_DETALHADOS.md) - Tutorial do seu tipo de usuário
3. **Consulte quando necessário:** [Troubleshooting e FAQ](./TROUBLESHOOTING_FAQ.md)

### Para Usuários Experientes
1. **Use:** [Guia Rápido](./GUIA_RAPIDO.md) para referências rápidas
2. **Consulte:** [Diagramas e Fluxogramas](./DIAGRAMAS_FLUXO.md) para entender processos
3. **Recorra ao:** [Troubleshooting e FAQ](./TROUBLESHOOTING_FAQ.md) quando houver problemas

### Para Administradores
1. **Estude:** [Manual do Usuário](./MANUAL_USUARIO.md) - Seções de administração
2. **Domine:** [Tutoriais Detalhados](./TUTORIAIS_DETALHADOS.md) - Tutoriais de Pastor/Secretário Regional
3. **Tenha à mão:** [Troubleshooting e FAQ](./TROUBLESHOOTING_FAQ.md) para suporte aos usuários

### Para Treinamentos
1. **Base teórica:** [Manual do Usuário](./MANUAL_USUARIO.md)
2. **Prática guiada:** [Tutoriais Detalhados](./TUTORIAIS_DETALHADOS.md)
3. **Recursos visuais:** [Diagramas e Fluxogramas](./DIAGRAMAS_FLUXO.md)
4. **Resolução de dúvidas:** [Troubleshooting e FAQ](./TROUBLESHOOTING_FAQ.md)

---

## 🎯 Funcionalidades Documentadas

### ✅ Funcionalidades Básicas
- [x] Cadastro e login de usuários
- [x] Gerenciamento de perfil
- [x] Visualização de eventos
- [x] Sistema de inscrições
- [x] Pagamentos via PIX
- [x] Check-in com QR Code

### ✅ Funcionalidades Administrativas
- [x] Criação e gerenciamento de eventos
- [x] Gestão de usuários e permissões
- [x] Administração de igrejas
- [x] Relatórios e estatísticas
- [x] Sistema de check-in
- [x] Gestão de idosos

### ✅ Funcionalidades Avançadas
- [x] Diferentes tipos de usuários
- [x] Hierarquia de permissões
- [x] Integração com MercadoPago
- [x] Sistema responsivo
- [x] Notificações em tempo real
- [x] Exportação de relatórios

---

## 🔧 Informações Técnicas

### Tecnologias Documentadas
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Firebase (Firestore, Authentication)
- **Pagamentos:** MercadoPago PIX
- **UI/UX:** Componentes responsivos, design moderno
- **Notificações:** Sonner (toast notifications)

### Estrutura da Aplicação
```
src/
├── app/                 # Páginas e rotas (App Router)
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (Auth, etc.)
├── lib/                # Configurações e utilitários
├── types/              # Definições TypeScript
└── utils/              # Funções auxiliares
```

### Tipos de Usuários
1. **Membro** - Funcionalidades básicas
2. **Secretário Local** - + Inscrever outros da igreja
3. **Pastor** - + Criar eventos e gerenciar igreja
4. **Secretário Regional** - + Acesso total ao sistema

---

## 📞 Suporte e Contato

### Canais de Suporte
- **Email:** suporte@eventosicm.com.br
- **WhatsApp:** (27) 99999-9999
- **Telefone:** (27) 3333-3333

### Horários de Atendimento
- **Suporte Geral:** Segunda a Sexta, 8h às 18h
- **Suporte Técnico:** Segunda a Sexta, 9h às 17h
- **Emergências:** 24h durante eventos

### Recursos Online
- **Site:** www.eventosicm.com.br
- **Fórum:** forum.eventosicm.com.br
- **Base de Conhecimento:** help.eventosicm.com.br
- **Treinamentos:** Mensais via Zoom

---

## 📝 Notas de Versão

### Versão Atual: 2.0
- Sistema completo com todas as funcionalidades
- Pagamentos PIX integrados
- Check-in por QR Code
- Interface responsiva
- Múltiplos tipos de usuários

### Documentação
- **Criada em:** Dezembro 2024
- **Baseada na versão:** 2.0 do sistema
- **Última atualização:** Dezembro 2024
- **Próxima revisão:** Março 2025

---

## 🎓 Como Contribuir

### Melhorias na Documentação
1. Identifique lacunas ou informações desatualizadas
2. Sugira melhorias via email: docs@eventosicm.com.br
3. Participe das revisões trimestrais
4. Compartilhe feedback dos usuários

### Sugestões de Conteúdo
- Novos tutoriais
- Casos de uso específicos
- Melhorias nos diagramas
- Exemplos práticos adicionais

---

*Documentação desenvolvida com base na análise completa da aplicação*
*Sistema de Eventos ICM - Versão 2.0*
*© 2024 - Igreja Cristã Maranata*