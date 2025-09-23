# Configuração de Webhooks - Mercado Pago

## 📋 Visão Geral

Os webhooks do Mercado Pago permitem que sua aplicação receba notificações automáticas sobre mudanças no status dos pagamentos, eliminando a necessidade de consultas manuais constantes.

## 🔧 Configuração

### 1. Endpoint Implementado

O endpoint para receber webhooks está em:
```
POST /api/webhooks/mercadopago
```

**URL completa para produção:**
```
https://seu-dominio.com/api/webhooks/mercadopago
```

**URL para desenvolvimento local (usando ngrok):**
```
https://abc123.ngrok.io/api/webhooks/mercadopago
```

### 2. Variáveis de Ambiente

Adicione no seu arquivo `.env.local`:

```env
# Token de acesso do Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui

# Chave secreta para validação de webhooks (opcional, mas recomendado)
MERCADOPAGO_WEBHOOK_SECRET=sua_chave_secreta_aqui
```

### 3. Configuração no Painel do Mercado Pago

1. **Acesse o painel do Mercado Pago:**
   - Produção: https://www.mercadopago.com.br/developers/panel
   - Sandbox: https://www.mercadopago.com.br/developers/panel/credentials

2. **Navegue para "Webhooks" ou "Notificações IPN"**

3. **Configure a URL do webhook:**
   ```
   URL: https://seu-dominio.com/api/webhooks/mercadopago
   Eventos: payment (pagamentos)
   ```

4. **Defina uma chave secreta (recomendado):**
   - Gere uma chave secreta forte
   - Adicione ela na variável `MERCADOPAGO_WEBHOOK_SECRET`

## 🔒 Segurança

### Validação de Assinatura

O webhook implementa validação de assinatura HMAC-SHA256 conforme documentação do Mercado Pago:

1. **Headers verificados:**
   - `x-signature`: Assinatura HMAC
   - `x-request-id`: ID único da requisição

2. **Processo de validação:**
   ```
   manifest = "id:{data.id};request-id:{x-request-id};ts:{timestamp};"
   signature = HMAC-SHA256(manifest, webhook_secret)
   ```

### Headers de Segurança

O endpoint verifica os seguintes headers:
- `x-signature`: Assinatura da requisição
- `x-request-id`: ID único da requisição

## 📊 Eventos Processados

### Pagamentos (type: "payment")

O webhook processa automaticamente:

- ✅ **approved**: Pagamento aprovado
- ❌ **rejected**: Pagamento rejeitado  
- ⏸️ **cancelled**: Pagamento cancelado
- ⏳ **pending**: Pagamento pendente

### Dados Atualizados no Firestore

Para cada notificação, o sistema atualiza:

```typescript
{
  paymentStatus: string,           // Status do pagamento
  mercadoPagoStatus: string,       // Status original do MP
  statusDetail: string,            // Detalhes do status
  lastWebhookUpdate: timestamp,    // Última atualização via webhook
  webhookProcessed: boolean,       // Flag de processamento
  
  // Para pagamentos aprovados:
  paidAt: timestamp,
  approvedAmount: number,
  netReceivedAmount: number,
  mercadoPagoPayer: object,
  mercadoPagoItems: array,
  
  // Para pagamentos rejeitados:
  paymentError: string,
  rejectedAt: timestamp
}
```

## 🧪 Teste Local com ngrok

Para testar webhooks localmente:

1. **Instale o ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Execute sua aplicação:**
   ```bash
   npm run dev
   ```

3. **Em outro terminal, exponha a porta 3000:**
   ```bash
   ngrok http 3000
   ```

4. **Use a URL do ngrok no painel do Mercado Pago:**
   ```
   https://abc123.ngrok.io/api/webhooks/mercadopago
   ```

## 🔍 Logs e Monitoramento

### Logs Implementados

O webhook gera logs detalhados:

```
🔔 Webhook recebido: {dados_completos}
✅ Assinatura do webhook validada
📊 Dados do pagamento recebidos: {id, status, external_reference}
✅ Inscrição atualizada via webhook: {registrationId, status}
```

### Verificação de Funcionamento

Teste o endpoint:
```bash
curl https://seu-dominio.com/api/webhooks/mercadopago
```

Resposta esperada:
```json
{
  "message": "Endpoint de webhook do Mercado Pago ativo",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "production",
  "hasWebhookSecret": true
}
```

## ⚠️ Considerações Importantes

1. **Idempotência**: O webhook pode receber a mesma notificação múltiplas vezes
2. **Timeout**: O Mercado Pago espera resposta em até 30 segundos
3. **Retry**: Notificações falhadas são reenviadas automaticamente
4. **HTTPS**: Webhooks só funcionam com URLs HTTPS em produção

## 🚀 Vantagens dos Webhooks

- ✅ **Atualizações em tempo real** - Status atualizado instantaneamente
- ✅ **Redução de consultas** - Menos chamadas à API do Mercado Pago
- ✅ **Melhor UX** - Usuários veem confirmação imediata
- ✅ **Economia de recursos** - Menos processamento no servidor
- ✅ **Confiabilidade** - Sistema de retry automático

## 🔧 Troubleshooting

### Webhook não está sendo chamado
- Verifique se a URL está correta no painel do MP
- Confirme que a URL é HTTPS (obrigatório em produção)
- Teste a conectividade da URL

### Assinatura inválida
- Verifique se `MERCADOPAGO_WEBHOOK_SECRET` está correto
- Confirme que a chave no painel do MP é a mesma do `.env`

### Pagamentos não são atualizados
- Verifique os logs do webhook
- Confirme que `external_reference` está sendo enviado corretamente
- Verifique se o documento existe no Firestore