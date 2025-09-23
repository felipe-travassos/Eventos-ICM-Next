# Como Exportar Manuais em PDF

## 📄 Arquivos PDF Disponíveis

Todos os manuais foram convertidos para PDF e estão disponíveis na pasta do projeto:

### Manuais em PDF:
- **MANUAL_VISUAL_SIMPLES.pdf** (1.7 MB) - Manual simples com telas
- **MANUAL_USUARIO.pdf** (1.5 MB) - Manual completo do usuário
- **TUTORIAIS_DETALHADOS.pdf** (1.3 MB) - Tutoriais passo a passo
- **TROUBLESHOOTING_FAQ.pdf** (1.3 MB) - Solução de problemas e FAQ
- **GUIA_RAPIDO.pdf** (929 KB) - Guia de referência rápida

## 🔧 Como Foi Feito

Utilizamos a ferramenta `md-to-pdf` para converter os arquivos Markdown em PDF:

```bash
# Instalação da ferramenta
npm install -g md-to-pdf

# Conversão dos arquivos
md-to-pdf MANUAL_VISUAL_SIMPLES.md
md-to-pdf MANUAL_USUARIO.md
md-to-pdf TUTORIAIS_DETALHADOS.md
md-to-pdf TROUBLESHOOTING_FAQ.md
md-to-pdf GUIA_RAPIDO.md
```

## 📋 Para Converter Novos Arquivos

Se você quiser converter outros arquivos Markdown para PDF:

1. **Instale a ferramenta** (se ainda não tiver):
   ```bash
   npm install -g md-to-pdf
   ```

2. **Converta o arquivo**:
   ```bash
   md-to-pdf nome-do-arquivo.md
   ```

3. **O PDF será gerado** na mesma pasta com o mesmo nome.

## 🎨 Personalização do PDF

Para personalizar a aparência do PDF, você pode criar um arquivo de configuração:

```javascript
// md-to-pdf.config.js
module.exports = {
  pdf_options: {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  },
  stylesheet: 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/4.0.0/github-markdown.min.css'
}
```

## 📁 Localização dos Arquivos

Todos os PDFs estão localizados em:
```
C:\Users\ftrav\Documents\eventos-icm-nextjs\
```

## 💡 Dicas

- Os PDFs mantêm a formatação original dos Markdown
- Incluem índices clicáveis quando disponíveis
- São otimizados para impressão
- Podem ser compartilhados facilmente por email ou outras plataformas

## 🆘 Suporte

Se precisar de ajuda com a conversão ou personalização dos PDFs, entre em contato com o suporte técnico.