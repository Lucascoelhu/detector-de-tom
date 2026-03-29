# Detector de Tom — Guia de Configuração

## Visão Geral

Aplicativo web para detecção de tom musical em tempo real, com campo harmônico, diagramas de acordes e plano Pro via pagamento Pix.

```
[Usuário] → [Frontend] → [Firebase Auth + Firestore]
                       → [Backend (Node)] → [Mercado Pago]
```

---

## Pré-requisitos

- Node.js 18+
- Conta no [Firebase](https://firebase.google.com)
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- Conta no [Vercel](https://vercel.com) ou [Railway](https://railway.app) para hospedar o backend

---

## 1. Firebase

### 1.1 Criar projeto
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. **Adicionar projeto** → dê um nome → crie
3. **Autenticação** → **Começar** → ative **Email/senha**
4. **Firestore Database** → **Criar banco de dados** → modo produção

### 1.2 Chaves do frontend
1. Firebase Console → ⚙️ **Configurações do projeto** → **Seus apps** → `</>`
2. Copie o objeto `firebaseConfig` e substitua no arquivo de configuração do frontend

### 1.3 Chave do backend
1. Firebase Console → ⚙️ **Configurações do projeto** → **Contas de serviço**
2. Clique em **Gerar nova chave privada** → baixe o JSON
3. Preencha o `.env` com os valores do JSON baixado (veja `.env.example`)

### 1.4 Regras do Firestore
1. Firebase Console → **Firestore** → **Regras**
2. Cole o conteúdo de `firestore.rules` e publique

---

## 2. Mercado Pago

1. Acesse **Suas aplicações** → **Criar aplicação**
2. Copie o **Access Token de Produção** para o `.env`
3. Para testes, use o **Access Token de Teste** com os [cartões de teste oficiais](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards)

---

## 3. Backend

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencha o .env com suas chaves

# Desenvolvimento
npm run dev

# Produção
npm start
```

---

## 4. Frontend

O frontend é um arquivo HTML único — basta hospedar em qualquer serviço estático.

### Firebase Hosting (recomendado)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 5. Backend — Hospedagem

### Railway (mais fácil)
1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Adicione as variáveis de ambiente no painel
3. Copie a URL gerada e configure como `BACKEND_URL` no `.env` do frontend

### Render
1. [render.com](https://render.com) → **New Web Service** → conecte o repositório
2. Build: `npm install` · Start: `npm start`

---

## 6. Webhook do Mercado Pago

Após o backend estar no ar, registre a URL do webhook para receber confirmações de pagamento automáticas:

1. MP Developers → **Webhooks** → **Configurar notificações**
2. URL: `https://SEU-BACKEND.com/mp-webhook`
3. Eventos: **Pagamentos**

---

## Fluxo do pagamento

```
Usuário clica "Assinar Pro"
  → Frontend chama o backend para gerar o Pix
  → Usuário paga via QR Code
  → Mercado Pago dispara o webhook
  → Backend confirma e atualiza o plano no Firestore
  → App desbloqueia os recursos Pro automaticamente
```

---

## Estrutura de arquivos

```
detector-de-tom/
├── public/
│   └── index.html        ← Frontend (não compartilhe publicamente)
├── server.js             ← Backend Node.js
├── firestore.rules       ← Regras de segurança do Firestore
├── package.json
├── .env.example          ← Template — nunca suba o .env real
└── README.md
```

---

## Segurança — Pontos importantes

- **Nunca** suba o arquivo `.env` para o repositório — ele contém chaves privadas
- O arquivo `index.html` contém lógica de negócio — **não compartilhe publicamente** nem deixe em repositório público
- Configure as **Regras do Firestore** corretamente antes de ir para produção — sem regras, qualquer pessoa pode ler/escrever seus dados
- Use sempre o **Access Token de Produção** apenas em ambiente de produção
- Mantenha a chave privada do Firebase Admin (`serviceAccountKey.json`) fora do repositório

---

## Variáveis de ambiente (`.env.example`)

```env
# Mercado Pago
MP_ACCESS_TOKEN=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# URL do backend (usada pelo frontend)
BACKEND_URL=
```
