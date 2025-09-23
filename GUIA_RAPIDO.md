# Guia Rápido - Sistema de Eventos ICM

## 🚀 Acesso Rápido

### URLs Principais
- **Sistema**: `http://localhost:3000`
- **Login**: `/login`
- **Registro**: `/register`
- **Perfil**: `/profile`
- **Minhas Inscrições**: `/my-registrations`

### Atalhos de Teclado
- `Ctrl + /` - Busca rápida
- `Esc` - Fechar modais
- `Enter` - Confirmar ações

---

## 👤 Ações por Tipo de Usuário

### 🔵 Membro
```
✅ Ver eventos → Página inicial
✅ Inscrever-se → Botão "Inscrever-se"
✅ Pagar → QR Code PIX automático
✅ Ver inscrições → Menu "Minhas Inscrições"
✅ Atualizar perfil → Menu "Meu Perfil"
```

### 🟡 Secretário Local
```
✅ Tudo do membro +
✅ Inscrever outros → Botão flutuante azul
✅ Cadastrar idosos → Modal "Adicionar Idoso"
✅ Ver inscrições igreja → Admin → Inscrições
```

### 🟠 Pastor
```
✅ Tudo do secretário +
✅ Criar eventos → Admin → Eventos → "Novo Evento"
✅ Gerenciar igreja → Admin → Igrejas
✅ Check-in → Admin → Check-in → [Evento]
```

### 🔴 Secretário Regional
```
✅ Acesso total
✅ Gerenciar usuários → Admin → Usuários
✅ Alterar funções → Admin → Usuários → "Alterar Função"
✅ Relatórios globais → Admin → Inscrições
```

---

## ⚡ Fluxos Rápidos

### Inscrição Individual (2 min)
1. Login → Perfil completo? → Evento → Inscrever → PIX → Pago ✅

### Inscrição por Secretário (1 min)
1. Botão azul → Evento → Buscar pessoa → Confirmar ✅

### Criar Evento (3 min)
1. Admin → Eventos → Novo → Preencher → Criar ✅

### Check-in (30 seg)
1. Admin → Check-in → Escanear QR → Confirmar ✅

---

## 🎯 Campos Obrigatórios

### Perfil Completo
- ✅ Nome (automático do registro)
- ✅ Email (automático do registro)
- ✅ CPF (11 dígitos)
- ✅ Telefone (com DDD)
- ✅ Igreja (selecionar da lista)

### Novo Evento
- ✅ Título
- ✅ Descrição
- ✅ Data e Hora
- ✅ Local
- ✅ Preço (0 para gratuito)
- ✅ Vagas máximas

### Nova Pessoa (Secretário)
- ✅ Nome completo
- ✅ CPF
- ✅ Telefone
- ✅ Email
- ✅ Igreja

---

## 🔧 Soluções Rápidas

### ❌ Não consigo me inscrever
```
1. Perfil completo? → Complete em "Meu Perfil"
2. Logado? → Faça login
3. Vagas disponíveis? → Verifique contador
```

### ❌ PIX não aparece
```
1. Aguarde 5 segundos
2. Recarregue a página
3. Verifique dados do perfil
```

### ❌ QR Code não funciona
```
1. Permita acesso à câmera
2. Use busca manual (nome/CPF)
3. Melhore iluminação
```

### ❌ Pagamento não confirmou
```
1. Aguarde até 2 minutos
2. Verifique em "Minhas Inscrições"
3. PIX pode demorar em alguns bancos
```

---

## 📊 Status e Significados

### Inscrições
- 🟢 **Confirmada**: Pago e garantido
- 🟡 **Pendente**: Aguardando pagamento
- 🔴 **Cancelada**: Inscrição cancelada
- ⚪ **Rejeitada**: Não aprovada

### Eventos
- 🟢 **Ativo**: Inscrições abertas
- 🟡 **Realizado**: Evento aconteceu
- 🔴 **Cancelado**: Evento cancelado
- ⚪ **Finalizado**: Arquivado

### Pagamentos
- 🟢 **Pago**: Confirmado
- 🟡 **Pendente**: Aguardando
- 🔴 **Reembolsado**: Devolvido

---

## 🎨 Códigos de Cores

### Interface
- **Azul**: Ações principais
- **Verde**: Sucesso/Confirmado
- **Amarelo**: Atenção/Pendente
- **Vermelho**: Erro/Cancelado
- **Cinza**: Neutro/Desabilitado

### Toasts (Notificações)
- 🟢 **Verde**: Sucesso
- 🔴 **Vermelho**: Erro
- 🟡 **Amarelo**: Aviso
- 🔵 **Azul**: Informação

---

## 📱 Responsividade

### Desktop (> 1024px)
- Menu horizontal completo
- 3 eventos por linha
- Sidebar de administração

### Tablet (768-1024px)
- Menu adaptado
- 2 eventos por linha
- Botões maiores

### Mobile (< 768px)
- Menu hambúrguer (☰)
- 1 evento por linha
- Botões touch-friendly

---

## 🔐 Permissões Rápidas

| Ação | Membro | Sec. Local | Pastor | Sec. Regional |
|------|--------|------------|--------|---------------|
| Ver eventos | ✅ | ✅ | ✅ | ✅ |
| Inscrever-se | ✅ | ✅ | ✅ | ✅ |
| Inscrever outros | ❌ | ✅ | ✅ | ✅ |
| Criar eventos | ❌ | ❌ | ✅ | ✅ |
| Gerenciar igreja | ❌ | ❌ | ✅ | ✅ |
| Alterar funções | ❌ | ❌ | ❌ | ✅ |
| Ver todas igrejas | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Dicas de Performance

### Para Usuários
- Complete o perfil uma vez
- Mantenha dados atualizados
- Use navegadores modernos
- Limpe cache se houver problemas

### Para Administradores
- Crie eventos com antecedência
- Monitore vagas regularmente
- Faça check-in antecipado
- Exporte relatórios periodicamente

---

## 📞 Contatos de Emergência

### Problemas Técnicos
1. Consultar manual completo
2. Verificar troubleshooting
3. Contatar secretário local
4. Escalar para pastor
5. Contatar secretário regional

### Problemas de Pagamento
1. Aguardar 2 minutos
2. Verificar no banco
3. Contatar secretário
4. Suporte MercadoPago (se necessário)

---

## 🔄 Atualizações Recentes

### v2.0 (Janeiro 2024)
- ✅ Sistema de toasts (Sonner)
- ✅ Melhorias na UX
- ✅ Otimização de performance
- ✅ Correções de bugs

### Próximas Funcionalidades
- 📧 Notificações por email
- 📊 Dashboard avançado
- 🎫 Ingressos digitais
- 📱 App mobile nativo

---

*Guia Rápido - Sistema de Eventos ICM v2.0*