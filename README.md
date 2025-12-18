# Gerador de QR Code PIX - Madmras Ferragens

App simples para gerar QR Code PIX com valor personalizado.

## Como instalar no celular Android

### Opcao 1: Usando GitHub Pages (Recomendado)

1. Suba este repositorio para o GitHub
2. Ative o GitHub Pages nas configuracoes do repositorio (Settings > Pages)
3. Selecione a branch `main` e pasta `/ (root)`
4. Acesse a URL gerada pelo GitHub Pages no celular
5. No Chrome, toque nos tres pontos > "Adicionar a tela inicial"
6. O app sera instalado e funcionara offline

### Opcao 2: Hospedagem em servidor local

1. Instale um servidor web simples (ex: Python):
   ```bash
   cd pasta-do-projeto
   python -m http.server 8000
   ```

2. Descubra o IP do seu computador na rede WiFi

3. No celular Android (mesma rede WiFi):
   - Abra o Chrome e acesse: `http://SEU_IP:8000`
   - Toque nos tres pontos > "Adicionar a tela inicial"

### Opcao 3: Usar servico de hospedagem gratuita

Voce pode usar servicos como:
- **Netlify**: netlify.com (arraste a pasta do projeto)
- **Vercel**: vercel.com
- **GitHub Pages**: pages.github.com

## Arquivos do projeto

- `index.html` - Pagina principal
- `style.css` - Estilos visuais
- `app.js` - Logica de geracao do PIX
- `qrcode.min.js` - Biblioteca de QR Code
- `manifest.json` - Configuracao do PWA
- `sw.js` - Service Worker (funciona offline)
- `logo-madmraz5.png` - Logo da empresa

## Funcionalidades

- Gera QR Code PIX com valor definido
- Funciona 100% offline apos instalacao
- Botao para copiar codigo "copia e cola"
- Botao para compartilhar via WhatsApp (imagem + codigo)
- Interface responsiva para celulares

## Dados do PIX

- **Chave (CNPJ)**: 11049570000192
- **Beneficiario**: Madmras Ferragens Ltda

## Requisitos

- Navegador Chrome no Android
- Conexao com internet apenas para primeira instalacao
