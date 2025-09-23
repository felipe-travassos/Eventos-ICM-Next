# 📱 Manual Visual Simples - Sistema de Eventos ICM

## 🎯 Guia Rápido com Telas

Este manual mostra as principais telas do sistema com explicações simples de como usar cada uma.

---

## 🏠 1. Tela Inicial (Home)

**URL:** `http://localhost:3000`

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│ [LOGO ICM]              [Minhas Inscrições] [Entrar] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           🎉 EVENTOS DISPONÍVEIS 🎉                    │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   EVENTO 1  │  │   EVENTO 2  │  │   EVENTO 3  │    │
│  │ 📅 Data     │  │ 📅 Data     │  │ 📅 Data     │    │
│  │ 📍 Local    │  │ 📍 Local    │  │ 📍 Local    │    │
│  │ 💰 Preço    │  │ 💰 Preço    │  │ 💰 Preço    │    │
│  │[Inscrever-se]│  │[Inscrever-se]│  │[Inscrever-se]│    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│              ← [Anterior] [Próximo] →                  │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Ver eventos:** Role pela lista de eventos disponíveis
2. **Escolher evento:** Clique no evento que quer participar
3. **Se não tem conta:** Clique em "Entrar" → "Criar conta"
4. **Se já tem conta:** Clique em "Entrar" e faça login

---

## 🔐 2. Tela de Login

**URL:** `http://localhost:3000/login`

### 📸 Como é a tela:
```
┌─────────────────────────────────────────┐
│              [LOGO ICM]                 │
│                                         │
│           ENTRAR NO SISTEMA             │
│                                         │
│  Email: [________________]              │
│                                         │
│  Senha: [________________]              │
│                                         │
│         [ENTRAR]                        │
│                                         │
│  Esqueci minha senha | Criar conta      │
└─────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Digite seu email** no primeiro campo
2. **Digite sua senha** no segundo campo
3. **Clique em "ENTRAR"**
4. **Primeira vez?** Clique em "Criar conta"
5. **Esqueceu a senha?** Clique em "Esqueci minha senha"

---

## 📝 3. Tela de Cadastro

**URL:** `http://localhost:3000/register`

### 📸 Como é a tela:
```
┌─────────────────────────────────────────┐
│              [LOGO ICM]                 │
│                                         │
│           CRIAR CONTA                   │
│                                         │
│  Nome: [_____________________]          │
│                                         │
│  Email: [____________________]          │
│                                         │
│  Senha: [____________________]          │
│                                         │
│  Confirmar Senha: [__________]          │
│                                         │
│         [CRIAR CONTA]                   │
│                                         │
│      Já tem conta? Fazer login          │
└─────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Nome completo:** Digite seu nome completo
2. **Email válido:** Use um email que você acessa
3. **Senha forte:** Mínimo 6 caracteres
4. **Confirme a senha:** Digite a mesma senha
5. **Clique "CRIAR CONTA"**
6. **Depois:** Complete seu perfil antes de se inscrever

---

## 👤 4. Tela do Perfil

**URL:** `http://localhost:3000/profile`

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│ [LOGO]    [Minhas Inscrições] [Meu Perfil] [Sair]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  MEU PERFIL                            │
│                                                         │
│  Nome: [João da Silva________________] (já preenchido)  │
│                                                         │
│  Email: [joao@email.com_____________] (já preenchido)  │
│                                                         │
│  CPF: [___________________________] ⚠️ OBRIGATÓRIO    │
│                                                         │
│  Telefone: [______________________] ⚠️ OBRIGATÓRIO    │
│                                                         │
│  Igreja: [Selecionar Igreja ▼____] ⚠️ OBRIGATÓRIO    │
│                                                         │
│              [SALVAR ALTERAÇÕES]                       │
│                                                         │
│  ⚠️ Complete todos os campos para se inscrever         │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **CPF:** Digite apenas números (ex: 12345678901)
2. **Telefone:** Digite com DDD (ex: 27999887766)
3. **Igreja:** Escolha sua igreja na lista
4. **Clique "SALVAR ALTERAÇÕES"**
5. **Agora pode se inscrever em eventos!**

---

## 🎫 5. Tela de Inscrição

**Aparece quando você clica em "Inscrever-se" em um evento**

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│                CONFIRMAR INSCRIÇÃO                      │
│                                                         │
│  📅 EVENTO: Congresso de Jovens 2024                   │
│  📍 LOCAL: Centro de Convenções                        │
│  🕐 DATA: 15/01/2025 às 19:00                         │
│  💰 VALOR: R$ 50,00                                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  👤 SEUS DADOS:                                        │
│  Nome: João da Silva                                    │
│  Email: joao@email.com                                 │
│  CPF: 123.456.789-01                                  │
│  Telefone: (27) 99988-7766                            │
│  Igreja: ICM Vila Velha                                │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  💳 TOTAL A PAGAR: R$ 50,00                           │
│                                                         │
│         [CONFIRMAR INSCRIÇÃO]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Confira os dados** do evento
2. **Verifique seus dados** pessoais
3. **Confira o valor** a pagar
4. **Clique "CONFIRMAR INSCRIÇÃO"**
5. **Se evento pago:** Aparecerá tela de pagamento PIX

---

## 💳 6. Tela de Pagamento PIX

**Aparece após confirmar inscrição em evento pago**

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│                 PAGAMENTO VIA PIX                       │
│                                                         │
│  💰 VALOR: R$ 50,00                                    │
│  📅 EVENTO: Congresso de Jovens 2024                   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📱 OPÇÃO 1: ESCANEAR QR CODE                         │
│                                                         │
│      ┌─────────────────┐                              │
│      │  ████ ████ ████ │                              │
│      │  ████ ████ ████ │  ← QR Code                   │
│      │  ████ ████ ████ │                              │
│      └─────────────────┘                              │
│                                                         │
│  💻 OPÇÃO 2: COPIAR CÓDIGO                            │
│                                                         │
│  [00020126580014BR.GOV.BCB.PIX...] [COPIAR CÓDIGO]    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ✅ Pagamento confirmado automaticamente               │
│  ⏱️ Aguarde até 2 minutos                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Opção 1 - QR Code:**
   - Abra app do seu banco
   - Vá em PIX → Ler QR Code
   - Aponte câmera para o código
   - Confirme pagamento

2. **Opção 2 - Código PIX:**
   - Clique "COPIAR CÓDIGO"
   - Abra app do seu banco
   - Vá em PIX → Colar Código
   - Cole e confirme pagamento

3. **Aguarde confirmação** (até 2 minutos)

---

## 📋 7. Minhas Inscrições

**URL:** `http://localhost:3000/my-registrations`

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│ [LOGO]    [Minhas Inscrições] [Meu Perfil] [Sair]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               MINHAS INSCRIÇÕES                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎉 Congresso de Jovens 2024                    │   │
│  │ 📅 15/01/2025 às 19:00                        │   │
│  │ 📍 Centro de Convenções                        │   │
│  │ ✅ Status: CONFIRMADA                          │   │
│  │ 💰 Valor: R$ 50,00                            │   │
│  │                                                 │   │
│  │ [Ver QR Code] [Comprovante] [Detalhes]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🙏 Retiro Espiritual                          │   │
│  │ 📅 22/01/2025 às 08:00                        │   │
│  │ 📍 Sítio da Paz                               │   │
│  │ 🟡 Status: PENDENTE                           │   │
│  │ 💰 Valor: R$ 80,00                            │   │
│  │                                                 │   │
│  │ [Pagar Agora] [Cancelar] [Detalhes]           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Ver suas inscrições:** Todas aparecem aqui
2. **Status das inscrições:**
   - ✅ **CONFIRMADA:** Pago, vaga garantida
   - 🟡 **PENDENTE:** Precisa pagar
   - 🔴 **CANCELADA:** Cancelada

3. **Ações disponíveis:**
   - **Ver QR Code:** Para check-in no evento
   - **Comprovante:** Baixar comprovante PDF
   - **Pagar Agora:** Para pendentes
   - **Cancelar:** Se permitido

---

## 📱 8. QR Code para Check-in

**Aparece quando clica "Ver QR Code" em uma inscrição**

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│                QR CODE - CHECK-IN                       │
│                                                         │
│  🎉 EVENTO: Congresso de Jovens 2024                   │
│  👤 NOME: João da Silva                                │
│  📅 DATA: 15/01/2025 às 19:00                         │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│              SEU QR CODE:                              │
│                                                         │
│      ┌─────────────────────────┐                      │
│      │  ████ ████ ████ ████   │                      │
│      │  ████ ████ ████ ████   │                      │
│      │  ████ ████ ████ ████   │                      │
│      │  ████ ████ ████ ████   │                      │
│      └─────────────────────────┘                      │
│                                                         │
│  📱 SALVE UMA FOTO DESTE QR CODE                      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ℹ️  COMO USAR:                                        │
│  1. Chegue cedo ao local do evento                     │
│  2. Procure a mesa de credenciamento                   │
│  3. Mostre este QR Code na tela do celular            │
│  4. Aguarde o organizador escanear                     │
│  5. Sua presença será confirmada!                      │
│                                                         │
│         [BAIXAR COMPROVANTE PDF]                       │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer:
1. **Salve uma screenshot** deste QR Code
2. **No dia do evento:**
   - Chegue cedo ao local
   - Procure mesa de credenciamento
   - Mostre QR Code na tela
   - Aguarde confirmação

---

## 👥 9. Tela de Secretário (Inscrever Outros)

**Aparece para usuários com função "Secretário Local"**

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│              INSCREVER MEMBRO DA IGREJA                 │
│                                                         │
│  PASSO 1: SELECIONAR EVENTO                           │
│  Evento: [Congresso de Jovens 2024 ▼]                 │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  PASSO 2: ENCONTRAR PESSOA                            │
│                                                         │
│  🔍 Buscar: [Digite nome ou CPF_______] [🔍]          │
│                                                         │
│  📋 RESULTADOS:                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👤 Maria Silva                                  │   │
│  │ 📧 maria@email.com                             │   │
│  │ ⛪ ICM Vila Velha                              │   │
│  │ 🆔 123.456.***-**                             │   │
│  │                        [SELECIONAR]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  OU                                                     │
│                                                         │
│         [CADASTRAR NOVA PESSOA]                        │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  💡 DICA: Secretários podem inscrever sem pagamento    │
│           O valor será cobrado da igreja               │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer (Secretários):
1. **Escolha o evento** na lista
2. **Busque a pessoa:**
   - Digite nome ou CPF
   - Selecione da lista
   - OU cadastre nova pessoa
3. **Confirme a inscrição**
4. **Não precisa pagar:** Valor cobrado da igreja

---

## ⛪ 10. Tela de Pastor (Criar Evento)

**Aparece para usuários com função "Pastor"**

### 📸 Como é a tela:
```
┌─────────────────────────────────────────────────────────┐
│                   CRIAR NOVO EVENTO                     │
│                                                         │
│  Título: [_________________________________]           │
│                                                         │
│  Descrição:                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Digite aqui a descrição completa do evento...   │   │
│  │                                                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Data: [15/01/2025] Hora: [19:00]                     │
│                                                         │
│  Local: [_________________________________]            │
│                                                         │
│  Preço: R$ [______] (Digite 0 para gratuito)          │
│                                                         │
│  Vagas: [______] pessoas                               │
│                                                         │
│  Imagem: [Escolher Arquivo...] (opcional)              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│              [CRIAR EVENTO]                            │
│                                                         │
│  💡 Após criar, o evento aparecerá na página inicial   │
└─────────────────────────────────────────────────────────┘
```

### ✅ O que fazer (Pastores):
1. **Título:** Nome atrativo do evento
2. **Descrição:** Detalhes completos
3. **Data e hora:** Quando será
4. **Local:** Endereço completo
5. **Preço:** 0 = gratuito
6. **Vagas:** Quantas pessoas
7. **Clique "CRIAR EVENTO"**

---

## 🎯 Resumo Rápido

### Para MEMBROS:
1. **Criar conta** → **Completar perfil** → **Escolher evento** → **Pagar** → **Usar QR Code**

### Para SECRETÁRIOS:
1. **Tudo do membro** + **Inscrever outros da igreja**

### Para PASTORES:
1. **Tudo anterior** + **Criar eventos** + **Fazer check-in**

### Para SECRETÁRIOS REGIONAIS:
1. **Acesso total** ao sistema

---

## 📞 Precisa de Ajuda?

- **WhatsApp:** (27) 99999-9999
- **Email:** suporte@eventosicm.com.br
- **Horário:** Segunda a Sexta, 8h às 18h

---

*Manual Visual Simples - Sistema de Eventos ICM*
*Versão 2.0 - Dezembro 2024*