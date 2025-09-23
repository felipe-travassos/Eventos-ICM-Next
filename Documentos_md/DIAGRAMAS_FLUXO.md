# Diagramas e Fluxogramas - Sistema de Eventos ICM

## 📊 Visão Geral dos Fluxos

Este documento apresenta os principais fluxos e diagramas do Sistema de Eventos ICM para facilitar o entendimento das funcionalidades.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE EVENTOS ICM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Frontend  │    │   Backend   │    │  Pagamentos │     │
│  │  (Next.js)  │◄──►│ (Firebase)  │◄──►│(MercadoPago)│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │Autenticação │    │Banco Dados  │    │Armazenamento│     │
│  │(Firebase    │    │(Firestore)  │    │(Firebase    │     │
│  │    Auth)    │    │             │    │  Storage)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Hierarquia de Usuários

```
                    ┌─────────────────────┐
                    │  Secretário Regional │
                    │    (Acesso Total)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │       Pastor        │
                    │  (Gerencia Igreja)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Secretário Local   │
                    │ (Inscreve Membros)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │       Membro        │
                    │ (Inscrições Próprias)│
                    └─────────────────────┘
```

---

## 🔄 Fluxo de Inscrição Individual

```
┌─────────────┐
│   INÍCIO    │
└──────┬──────┘
       │
       ▼
┌─────────────┐    NÃO   ┌─────────────┐
│ Usuário     │◄─────────┤ Está        │
│ Logado?     │          │ Logado?     │
└──────┬──────┘          └─────────────┘
       │ SIM                    │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Perfil      │          │ Fazer       │
│ Completo?   │          │ Login       │
└──────┬──────┘          └─────────────┘
       │ SIM
       ▼
┌─────────────┐
│ Visualizar  │
│ Eventos     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Selecionar  │
│ Evento      │
└──────┬──────┘
       │
       ▼
┌─────────────┐    NÃO   ┌─────────────┐
│ Há Vagas    │◄─────────┤ Evento      │
│ Disponíveis?│          │ Lotado      │
└──────┬──────┘          └─────────────┘
       │ SIM
       ▼
┌─────────────┐
│ Confirmar   │
│ Inscrição   │
└──────┬──────┘
       │
       ▼
┌─────────────┐    GRATUITO  ┌─────────────┐
│ Evento é    │─────────────►│ Inscrição   │
│ Pago?       │              │ Confirmada  │
└──────┬──────┘              └─────────────┘
       │ PAGO
       ▼
┌─────────────┐
│ Gerar       │
│ PIX         │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Realizar    │
│ Pagamento   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Pagamento   │
│ Confirmado  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Inscrição   │
│ Finalizada  │
└─────────────┘
```

---

## 📝 Fluxo de Inscrição por Secretário

```
┌─────────────┐
│ Secretário  │
│ Acessa      │
│ Sistema     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Selecionar  │
│ Evento      │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌─────────────┐
│ Buscar      │   NÃO   │ Cadastrar   │
│ Pessoa      │◄────────┤ Nova        │
│ Existente   │         │ Pessoa      │
└──────┬──────┘         └─────────────┘
       │ SIM
       ▼
┌─────────────┐
│ Selecionar  │
│ da Lista    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Confirmar   │
│ Dados       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Criar       │
│ Inscrição   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Inscrição   │
│ Confirmada  │
│ Automaticamente │
└─────────────┘
```

---

## 🎫 Fluxo de Check-in

```
┌─────────────┐
│ Participante│
│ Chega ao    │
│ Evento      │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌─────────────┐
│ Apresenta   │   OU    │ Informa     │
│ QR Code     │◄────────┤ Nome/CPF    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│ Organizador │         │ Organizador │
│ Escaneia    │         │ Busca       │
│ QR Code     │         │ Manualmente │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────┬───────────────┘
               ▼
┌─────────────┐    NÃO   ┌─────────────┐
│ Inscrição   │◄─────────┤ Pessoa não  │
│ Encontrada? │          │ Inscrita    │
└──────┬──────┘          └─────────────┘
       │ SIM
       ▼
┌─────────────┐    NÃO   ┌─────────────┐
│ Pagamento   │◄─────────┤ Pagamento   │
│ Confirmado? │          │ Pendente    │
└──────┬──────┘          └─────────────┘
       │ SIM
       ▼
┌─────────────┐
│ Registrar   │
│ Presença    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check-in    │
│ Realizado   │
└─────────────┘
```

---

## 🎯 Fluxo de Criação de Evento

```
┌─────────────┐
│ Pastor/Admin│
│ Acessa      │
│ Painel      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Clicar      │
│ "Novo       │
│ Evento"     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Preencher   │
│ Formulário: │
│ • Título    │
│ • Descrição │
│ • Data/Hora │
│ • Local     │
│ • Preço     │
│ • Vagas     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    OPCIONAL  ┌─────────────┐
│ Upload      │─────────────►│ Adicionar   │
│ Imagem?     │              │ Banner      │
└──────┬──────┘              └─────────────┘
       │
       ▼
┌─────────────┐
│ Revisar     │
│ Informações │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Criar       │
│ Evento      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Evento      │
│ Publicado   │
│ e Ativo     │
└─────────────┘
```

---

## 💳 Fluxo de Pagamento PIX

```
┌─────────────┐
│ Usuário     │
│ Confirma    │
│ Inscrição   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Sistema     │
│ Gera PIX    │
│ via         │
│ MercadoPago │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Exibe       │
│ QR Code     │
│ e Código    │
│ Copia/Cola  │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌─────────────┐
│ Usuário     │   OU    │ Usuário     │
│ Escaneia    │◄────────┤ Copia       │
│ QR Code     │         │ Código      │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────┬───────────────┘
               ▼
┌─────────────┐
│ Realiza     │
│ Pagamento   │
│ no Banco    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ MercadoPago │
│ Confirma    │
│ Pagamento   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Webhook     │
│ Notifica    │
│ Sistema     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Status      │
│ Atualizado  │
│ para "Pago" │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Usuário     │
│ Recebe      │
│ Confirmação │
└─────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
┌─────────────┐
│ Usuário     │
│ Acessa      │
│ Sistema     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    NÃO   ┌─────────────┐
│ Possui      │◄─────────┤ Criar       │
│ Conta?      │          │ Nova Conta  │
└──────┬──────┘          └──────┬──────┘
       │ SIM                    │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Fazer       │          │ Preencher   │
│ Login       │          │ Formulário  │
└──────┬──────┘          │ Registro    │
       │                 └──────┬──────┘
       ▼                        │
┌─────────────┐                 ▼
│ Inserir     │          ┌─────────────┐
│ Email e     │          │ Criar       │
│ Senha       │          │ Conta       │
└──────┬──────┘          └──────┬──────┘
       │                        │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Firebase    │          │ Enviar      │
│ Valida      │          │ Email       │
│ Credenciais │          │ Verificação │
└──────┬──────┘          └──────┬──────┘
       │                        │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Login       │          │ Verificar   │
│ Realizado   │          │ Email       │
└──────┬──────┘          └──────┬──────┘
       │                        │
       └───────┬────────────────┘
               ▼
┌─────────────┐
│ Usuário     │
│ Autenticado │
└──────┬──────┘
       │
       ▼
┌─────────────┐    NÃO   ┌─────────────┐
│ Perfil      │◄─────────┤ Completar   │
│ Completo?   │          │ Perfil      │
└──────┬──────┘          └─────────────┘
       │ SIM
       ▼
┌─────────────┐
│ Acesso      │
│ Liberado    │
└─────────────┘
```

---

## 📊 Estrutura de Dados

### Usuário (User)
```
User {
  id: string
  uid: string (Firebase Auth)
  name: string
  email: string
  phone: string
  cpf: string
  role: 'membro' | 'secretario_local' | 'pastor' | 'secretario_regional'
  churchId: string
  churchName: string
  createdAt: Date
  updatedAt: Date
}
```

### Evento (Event)
```
Event {
  id: string
  title: string
  description: string
  date: Date
  endDate?: Date
  location: string
  price: number
  maxParticipants: number
  currentParticipants: number
  status: 'active' | 'canceled' | 'completed' | 'ended'
  churchId: string
  churchName: string
  imageURL?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### Inscrição (EventRegistration)
```
EventRegistration {
  id: string
  eventId: string
  userId: string
  userType: 'user' | 'senior'
  seniorId?: string
  userName: string
  userEmail: string
  userPhone: string
  userCpf: string
  userChurch: string
  churchName: string
  pastorName: string
  status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentId: string
  registeredBy: string
  registeredByName: string
  registrationType: 'self' | 'secretary'
  checkedIn?: boolean
  checkedInAt?: Date
  checkedInBy?: string
  createdAt: Date
  updatedAt: Date
}
```

### Igreja (Church)
```
Church {
  id: string
  name: string
  address: string
  region: string
  pastorId: string | null
  pastorName: string | null
  createdAt: Date
  updatedAt?: Date
}
```

---

## 🎯 Estados dos Componentes

### Estados de Inscrição
```
┌─────────────┐    Pagamento    ┌─────────────┐
│   PENDING   │─────────────────►│    PAID     │
│ (Pendente)  │                 │   (Pago)    │
└──────┬──────┘                 └─────────────┘
       │
       │ Cancelamento
       ▼
┌─────────────┐
│  CANCELLED  │
│ (Cancelado) │
└─────────────┘
```

### Estados de Evento
```
┌─────────────┐    Início    ┌─────────────┐    Fim    ┌─────────────┐
│   ACTIVE    │─────────────►│  COMPLETED  │──────────►│    ENDED    │
│   (Ativo)   │              │ (Realizado) │           │ (Finalizado)│
└──────┬──────┘              └─────────────┘           └─────────────┘
       │
       │ Cancelamento
       ▼
┌─────────────┐
│  CANCELLED  │
│ (Cancelado) │
└─────────────┘
```

---

## 🔄 Ciclo de Vida de um Evento

```
1. CRIAÇÃO
   ├── Pastor/Admin cria evento
   ├── Define parâmetros (data, preço, vagas)
   └── Status: ACTIVE

2. INSCRIÇÕES
   ├── Usuários se inscrevem
   ├── Pagamentos são processados
   └── Vagas são preenchidas

3. REALIZAÇÃO
   ├── Check-in dos participantes
   ├── Evento acontece
   └── Status: COMPLETED

4. FINALIZAÇÃO
   ├── Relatórios são gerados
   ├── Dados são arquivados
   └── Status: ENDED
```

---

## 📱 Responsividade e Dispositivos

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]              [Menu Principal]        [Usuário]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Evento 1  │  │   Evento 2  │  │   Evento 3  │     │
│  │             │  │             │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────────┐
│ [Logo]        [Menu]        [Usuário]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │   Evento 1  │  │   Evento 2  │       │
│  │             │  │             │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  ┌─────────────┐                        │
│  │   Evento 3  │                        │
│  │             │                        │
│  └─────────────┘                        │
└─────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────────┐
│ [☰]  [Logo]      [Usuário]  │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐ │
│  │       Evento 1          │ │
│  │                         │ │
│  └─────────────────────────┘ │
│                             │
│  ┌─────────────────────────┐ │
│  │       Evento 2          │ │
│  │                         │ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

---

*Diagramas desenvolvidos para o Sistema de Eventos ICM*
*Versão 1.0 - Janeiro 2024*