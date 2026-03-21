# VocalPitch — Guia de Configuração Completo

## Visão Geral da Arquitetura

```
[Usuário] → [index.html] → [Firebase Auth + Firestore]
                         → [server.js (Node)] → [Mercado Pago]
                                              → [Firebase Admin]
```

---

## 1. Configurar Firebase

### 1.1 Criar projeto
1. Acesse https://console.firebase.google.com
2. Clique em **Adicionar projeto** → dê um nome → crie
3. Vá em **Autenticação** → **Começar** → ative **Email/senha**
4. Vá em **Firestore Database** → **Criar banco de dados** → modo produção

### 1.2 Chaves do frontend (index.html)
1. Firebase Console → ⚙️ Configurações do projeto → **Seus apps** → `</>`
2. Copie o objeto `firebaseConfig` e substitua no `index.html`:
```js
const firebaseConfig = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  projectId:         "SEU_PROJETO",
  ...
};
```

### 1.3 Chave do backend (server.js)
1. Firebase Console → ⚙️ Configurações do projeto → **Contas de serviço**
2. Clique em **Gerar nova chave privada** → baixe o JSON
3. Preencha o `.env` com os valores do JSON baixado

### 1.4 Regras do Firestore
1. Firebase Console → Firestore → **Regras**
2. Cole o conteúdo de `firestore.rules` e publique

---

## 2. Configurar Mercado Pago

1. Crie uma conta em https://www.mercadopago.com.br/developers
2. Vá em **Suas aplicações** → **Criar aplicação**
3. Copie o **Access Token de Produção** para o `.env`
4. Para testar antes de cobrar de verdade, use o **Access Token de Teste**

> ⚠️ Com o token de teste, use os cartões de teste do MP:
> https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards

---

## 3. Configurar e rodar o backend

```bash
# Instalar dependências
npm install

# Copiar e preencher variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# Rodar em desenvolvimento
npm run dev

# Rodar em produção
npm start
```

---

## 4. Hospedar o frontend

### Opção A — Firebase Hosting (recomendado, gratuito)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # pasta public: ./public
firebase deploy
```

### Opção B — Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 5. Hospedar o backend

### Opção A — Railway (mais fácil, gratuito no início)
1. https://railway.app → New Project → Deploy from GitHub
2. Adicione as variáveis de ambiente no painel do Railway
3. Copie a URL gerada para `BACKEND_URL` no `.env`

### Opção B — Render
1. https://render.com → New Web Service → conecte o repositório
2. Build command: `npm install`
3. Start command: `npm start`

### Opção C — Firebase Cloud Functions
Converta o `server.js` para Cloud Function (veja a doc do Firebase Functions)

---

## 6. Configurar Webhook do Mercado Pago

Após subir o backend, registre a URL do webhook:
1. MP Developers → **Webhooks** → **Configurar notificações**
2. URL: `https://SEU-BACKEND.com/mp-webhook`
3. Eventos: **Pagamentos**

Isso garante que quando alguém pagar, o plano seja atualizado automaticamente no Firestore.

---

## Fluxo completo do usuário

```
1. Usuário abre index.html
2. Firebase verifica se está logado
3. Se não → tela de login/cadastro
4. Se sim → carrega plano do Firestore (free ou pro)
5. Free: barra de 20 detecções visível
6. Ao atingir limite → Paywall aparece
7. Usuário clica "Assinar Pro"
8. Frontend chama POST /create-preference no backend
9. Backend cria preferência no MP, retorna init_point
10. Usuário é redirecionado para o checkout do MP
11. Após pagar → MP redireciona de volta com ?payment_status=approved
12. MP também dispara webhook POST /mp-webhook
13. Backend atualiza plan = 'pro' no Firestore via Admin SDK
14. Frontend detecta payment_status=approved e atualiza UI
```

---

## Estrutura de arquivos

```
vocalpitch/
├── public/
│   └── index.html        ← Frontend completo (auth + app + paywall)
├── server.js             ← Backend Node.js (MP + Firebase Admin)
├── firestore.rules       ← Regras de segurança do Firestore
├── package.json
├── .env.example          ← Template de variáveis de ambiente
└── README.md
```
