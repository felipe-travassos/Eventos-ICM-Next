# Manual de Utilização - Sistema de Eventos ICM

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Tipos de Usuários](#tipos-de-usuários)
3. [Primeiros Passos](#primeiros-passos)
4. [Tutoriais por Tipo de Usuário](#tutoriais-por-tipo-de-usuário)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [Fluxos de Trabalho](#fluxos-de-trabalho)
7. [Troubleshooting](#troubleshooting)
8. [FAQ - Perguntas Frequentes](#faq---perguntas-frequentes)

---

## 🎯 Visão Geral do Sistema

O **Sistema de Eventos ICM** é uma plataforma web desenvolvida para gerenciar eventos da Igreja Cristã Maranata, permitindo:

- ✅ Cadastro e gerenciamento de eventos
- ✅ Inscrições online com pagamento via PIX
- ✅ Controle de presença com QR Code
- ✅ Gestão de usuários e igrejas
- ✅ Relatórios e estatísticas
- ✅ Sistema de notificações em tempo real

### 🏗️ Arquitetura do Sistema

```
Sistema de Eventos ICM
├── Frontend (Next.js + React)
├── Backend (Firebase)
├── Autenticação (Firebase Auth)
├── Banco de Dados (Firestore)
├── Armazenamento (Firebase Storage)
└── Pagamentos (MercadoPago PIX)
```

---

## 👥 Tipos de Usuários

### 1. **Membro** 👤
- Visualizar eventos disponíveis
- Inscrever-se em eventos
- Gerenciar suas inscrições
- Atualizar perfil pessoal

### 2. **Secretário Local** 📝
- Todas as funcionalidades de membro
- Inscrever outros membros
- Visualizar inscrições da sua igreja
- Gerenciar dados de idosos

### 3. **Pastor** ⛪
- Todas as funcionalidades de secretário
- Criar e gerenciar eventos
- Gerenciar igreja vinculada
- Aprovar inscrições

### 4. **Secretário Regional** 👑
- Acesso completo ao sistema
- Gerenciar todas as igrejas
- Gerenciar todos os usuários
- Relatórios globais

---

## 🚀 Primeiros Passos

### 1. Acessando o Sistema

1. Abra seu navegador e acesse: `http://localhost:3000`
2. Você verá a tela inicial com eventos disponíveis

### 2. Criando uma Conta

1. Clique em **"Entrar"** no canto superior direito
2. Na tela de login, clique em **"Criar conta"**
3. Preencha os dados:
   - **Nome completo**
   - **Email válido**
   - **Senha** (mínimo 6 caracteres)
   - **Confirmar senha**
4. Clique em **"Criar Conta"**
5. Você receberá uma confirmação por email

### 3. Completando seu Perfil

⚠️ **Importante**: Para se inscrever em eventos, você deve completar seu perfil!

1. Após fazer login, clique em **"Meu Perfil"**
2. Preencha os campos obrigatórios:
   - **CPF** (apenas números)
   - **Telefone** (com DDD)
   - **Igreja** (selecione da lista)
3. Clique em **"Salvar Alterações"**

---

## 📚 Tutoriais por Tipo de Usuário

## 👤 Tutorial para Membros

### Como se Inscrever em um Evento

1. **Visualizar Eventos**
   - Na página inicial, veja todos os eventos disponíveis
   - Use as setas para navegar pelo carrossel de eventos

2. **Escolher um Evento**
   - Clique no evento desejado para ver detalhes
   - Verifique: data, horário, local, preço e vagas disponíveis

3. **Fazer Inscrição**
   - Clique em **"Inscrever-se"**
   - Confirme seus dados pessoais
   - Clique em **"Confirmar Inscrição"**

4. **Realizar Pagamento**
   - Será gerado um QR Code PIX automaticamente
   - Escaneie o código com seu banco
   - Ou copie o código PIX para pagamento manual
   - O pagamento é processado em tempo real

### Gerenciando suas Inscrições

1. Acesse **"Minhas Inscrições"** no menu
2. Visualize todas suas inscrições:
   - ✅ **Confirmadas**: Pagamento aprovado
   - ⏳ **Pendentes**: Aguardando pagamento
   - ❌ **Canceladas**: Inscrições canceladas

3. **Ações disponíveis**:
   - Ver detalhes do evento
   - Baixar comprovante (se pago)
   - Cancelar inscrição (se permitido)

---

## 📝 Tutorial para Secretários Locais

### Inscrevendo Outros Membros

1. **Acessar Fluxo de Secretaria**
   - Na página inicial, clique em **"Inscrever Membro"**
   - Ou use o botão flutuante azul

2. **Selecionar Evento**
   - Escolha o evento desejado na lista
   - Verifique vagas disponíveis

3. **Cadastrar Pessoa**
   - **Opção 1**: Buscar pessoa existente
     - Digite nome ou CPF na busca
     - Selecione da lista de resultados
   
   - **Opção 2**: Cadastrar nova pessoa
     - Clique em **"Cadastrar Nova Pessoa"**
     - Preencha todos os dados obrigatórios
     - Clique em **"Cadastrar"**

4. **Confirmar Inscrição**
   - Revise os dados da inscrição
   - Clique em **"Confirmar Inscrição"**
   - A inscrição será criada como "Confirmada"

### Gerenciando Idosos

1. **Cadastrar Idoso**
   - Use o modal **"Adicionar Idoso"**
   - Preencha dados pessoais e de saúde
   - Informações médicas são opcionais mas recomendadas

2. **Inscrever Idoso em Evento**
   - No fluxo de inscrição, selecione **"Idoso"**
   - Busque o idoso cadastrado
   - Complete a inscrição normalmente

---

## ⛪ Tutorial para Pastores

### Criando Eventos

1. **Acessar Administração**
   - Menu: **Admin → Eventos**

2. **Novo Evento**
   - Clique em **"Novo Evento"**
   - Preencha os dados:
     - **Título**: Nome do evento
     - **Descrição**: Detalhes e programação
     - **Data e Hora**: Quando acontecerá
     - **Local**: Endereço completo
     - **Preço**: Valor da inscrição (R$)
     - **Vagas**: Número máximo de participantes
     - **Imagem**: Upload de banner (opcional)

3. **Publicar Evento**
   - Clique em **"Criar Evento"**
   - O evento ficará disponível imediatamente

### Gerenciando Inscrições

1. **Visualizar Inscrições**
   - Menu: **Admin → Gerenciar Inscrições**
   - Selecione o evento desejado

2. **Aprovar/Rejeitar Inscrições**
   - Veja lista de inscrições pendentes
   - Clique em **"Aprovar"** ou **"Rejeitar"**
   - Adicione motivo se necessário

3. **Check-in de Participantes**
   - Acesse **"Check-in"** do evento
   - Use a câmera para escanear QR Codes
   - Ou busque por nome/CPF manualmente

---

## 👑 Tutorial para Secretários Regionais

### Gerenciando Usuários

1. **Visualizar Usuários**
   - Menu: **Admin → Usuários**
   - Use filtros por nome, email ou função

2. **Alterar Funções**
   - Encontre o usuário desejado
   - Clique em **"Alterar Função"**
   - Selecione nova função:
     - Membro → Secretário Local
     - Secretário Local → Pastor
     - Pastor → Secretário Regional

### Gerenciando Igrejas

1. **Cadastrar Igreja**
   - Menu: **Admin → Igrejas**
   - Clique em **"Nova Igreja"**
   - Preencha: nome, endereço, região
   - Vincule um pastor (opcional)

2. **Editar Igreja**
   - Clique no ícone de edição
   - Atualize dados conforme necessário
   - Altere pastor vinculado se necessário

---

## ⚙️ Funcionalidades Principais

### 🔐 Sistema de Autenticação

- **Login seguro** com email e senha
- **Recuperação de senha** via email
- **Sessões persistentes** (lembrar login)
- **Logout automático** por inatividade

### 💳 Sistema de Pagamentos

- **PIX instantâneo** via MercadoPago
- **QR Code automático** para pagamento
- **Confirmação em tempo real**
- **Comprovantes digitais**

### 📱 Sistema de Notificações

- **Toasts informativos** para ações
- **Feedback visual** em tempo real
- **Mensagens de erro** claras
- **Confirmações de sucesso**

### 📊 Relatórios e Estatísticas

- **Dashboard de eventos** com métricas
- **Relatórios de inscrições** por igreja
- **Gráficos de participação**
- **Exportação de dados**

---

## 🔄 Fluxos de Trabalho

### Fluxo de Inscrição Individual

```
Usuário → Visualiza Evento → Clica "Inscrever" → 
Confirma Dados → Gera PIX → Paga → Confirmado
```

### Fluxo de Inscrição por Secretário

```
Secretário → Seleciona Evento → Busca/Cadastra Pessoa → 
Confirma Inscrição → Automaticamente Confirmado
```

### Fluxo de Check-in

```
Participante chega → Apresenta QR Code → 
Organizador escaneia → Presença confirmada
```

### Fluxo de Criação de Evento

```
Pastor/Admin → Cria Evento → Define Parâmetros → 
Publica → Disponível para Inscrições
```

---

## 🔧 Troubleshooting

### Problemas Comuns e Soluções

#### ❌ "Não consigo fazer login"

**Possíveis causas:**
- Email ou senha incorretos
- Conta não verificada
- Problemas de conexão

**Soluções:**
1. Verifique se o email está correto
2. Use "Esqueci minha senha" se necessário
3. Verifique sua conexão com internet
4. Limpe cache do navegador

#### ❌ "Não consigo me inscrever em eventos"

**Possíveis causas:**
- Perfil incompleto
- Evento sem vagas
- Problemas de autenticação

**Soluções:**
1. Complete seu perfil (CPF, telefone, igreja)
2. Verifique se há vagas disponíveis
3. Faça logout e login novamente

#### ❌ "PIX não foi gerado"

**Possíveis causas:**
- Problemas com MercadoPago
- Dados incompletos
- Erro temporário

**Soluções:**
1. Verifique seus dados pessoais
2. Tente novamente em alguns minutos
3. Entre em contato com suporte

#### ❌ "QR Code não funciona no check-in"

**Possíveis causas:**
- Câmera sem permissão
- QR Code danificado
- Iluminação inadequada

**Soluções:**
1. Permita acesso à câmera
2. Use busca manual por nome/CPF
3. Melhore a iluminação
4. Limpe a tela do dispositivo

---

## ❓ FAQ - Perguntas Frequentes

### Sobre Inscrições

**P: Posso me inscrever em vários eventos?**
R: Sim, não há limite de inscrições simultâneas.

**P: Posso cancelar minha inscrição?**
R: Sim, acesse "Minhas Inscrições" e clique em "Cancelar". Reembolsos seguem política específica.

**P: O pagamento é obrigatório?**
R: Sim, para eventos pagos. Eventos gratuitos não requerem pagamento.

**P: Posso inscrever outras pessoas?**
R: Apenas secretários e pastores podem inscrever outras pessoas.

### Sobre Pagamentos

**P: Quanto tempo demora para confirmar o pagamento?**
R: Pagamentos PIX são confirmados em tempo real, geralmente em segundos.

**P: Posso pagar com cartão?**
R: Atualmente apenas PIX está disponível.

**P: Como obtenho o comprovante?**
R: Acesse "Minhas Inscrições" e baixe o comprovante do evento pago.

### Sobre Perfil

**P: Posso alterar meus dados após cadastro?**
R: Sim, acesse "Meu Perfil" para atualizar informações.

**P: Como altero minha igreja?**
R: No perfil, selecione uma nova igreja da lista disponível.

**P: Esqueci minha senha, o que fazer?**
R: Use "Esqueci minha senha" na tela de login.

### Sobre Eventos

**P: Como sei se há vagas disponíveis?**
R: O número de vagas é exibido em cada evento.

**P: Posso sugerir um evento?**
R: Entre em contato com seu pastor ou secretário regional.

**P: Eventos têm idade mínima?**
R: Depende do evento. Informações estão na descrição.

### Sobre Tecnologia

**P: Funciona no celular?**
R: Sim, o sistema é totalmente responsivo.

**P: Preciso instalar algum app?**
R: Não, funciona direto no navegador.

**P: Quais navegadores são suportados?**
R: Chrome, Firefox, Safari, Edge (versões recentes).

---

## 📞 Suporte e Contato

### Em caso de problemas técnicos:

1. **Primeiro**: Consulte este manual
2. **Segundo**: Verifique a seção Troubleshooting
3. **Terceiro**: Entre em contato com:
   - Seu secretário local
   - Pastor da igreja
   - Secretário regional

### Informações do Sistema:

- **Versão**: 2.0
- **Tecnologia**: Next.js + Firebase
- **Última atualização**: Janeiro 2024

---

## 🎉 Conclusão

Este manual cobre todas as funcionalidades principais do Sistema de Eventos ICM. O sistema foi desenvolvido para ser intuitivo e fácil de usar, mas sempre consulte este guia quando tiver dúvidas.

**Lembre-se:**
- ✅ Complete seu perfil antes de se inscrever
- ✅ Mantenha seus dados atualizados
- ✅ Faça pagamentos dentro do prazo
- ✅ Chegue cedo aos eventos para check-in

**Bom uso do sistema! 🙏**

---

*Manual desenvolvido para o Sistema de Eventos ICM - Igreja Cristã Maranata*
*Versão 1.0 - Janeiro 2024*