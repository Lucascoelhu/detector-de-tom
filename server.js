// ─────────────────────────────────────────────────────────────────────────────
// VocalPitch — Backend (Node.js + Express)
// Deploy: Firebase Cloud Functions OU Vercel Serverless OU qualquer Node host
//
// Dependências:  npm install express cors mercadopago firebase-admin dotenv
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const admin        = require('firebase-admin');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── FIREBASE ADMIN ──────────────────────────────────────────────────────────
// Gere a chave em: Firebase Console → Configurações → Contas de Serviço
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:    process.env.FIREBASE_PROJECT_ID,
    clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const db = admin.firestore();

// ─── MERCADO PAGO ─────────────────────────────────────────────────────────────
// Obtenha o Access Token em: https://www.mercadopago.com.br/developers
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
const preference = new Preference(mpClient);
const payment    = new Payment(mpClient);

// ─── CRIAR PREFERÊNCIA DE PAGAMENTO ─────────────────────────────────────────
// Chamado pelo frontend ao clicar em "Assinar Pro"
app.post('/create-preference', async (req, res) => {
  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'uid e email obrigatórios' });

  try {
    const pref = await preference.create({
      body: {
        items: [{
          id:          'vocalpitch-pro-monthly',
          title:       'VocalPitch Pro — Assinatura Mensal',
          description: 'Detecções ilimitadas de notas e tom',
          quantity:    1,
          currency_id: 'BRL',
          unit_price:  19.90,
        }],
        payer: { email },
        external_reference: uid,          // vincula pagamento ao uid Firebase
        back_urls: {
          success: `${process.env.FRONTEND_URL}?payment_status=approved`,
          failure: `${process.env.FRONTEND_URL}?payment_status=failed`,
          pending: `${process.env.FRONTEND_URL}?payment_status=pending`,
        },
        auto_return:        'approved',
        notification_url:   `${process.env.BACKEND_URL}/mp-webhook`,
        statement_descriptor: 'VOCALPITCH',
      }
    });

    res.json({ init_point: pref.init_point, id: pref.id });
  } catch (err) {
    console.error('Erro ao criar preferência MP:', err);
    res.status(500).json({ error: 'Falha ao criar preferência de pagamento' });
  }
});

// ─── WEBHOOK MERCADO PAGO ────────────────────────────────────────────────────
// O MP chama esta rota automaticamente quando o pagamento é confirmado
app.post('/mp-webhook', async (req, res) => {
  const { type, data } = req.body;

  // Responde rapidamente para o MP não retentar
  res.sendStatus(200);

  if (type !== 'payment') return;

  try {
    const paymentData = await payment.get({ id: data.id });
    const { status, external_reference } = paymentData;

    console.log(`Pagamento ${data.id} — status: ${status} — uid: ${external_reference}`);

    if (status === 'approved' && external_reference) {
      const uid = external_reference;
      await db.collection('users').doc(uid).update({
        plan:           'pro',
        subscribedAt:   admin.firestore.FieldValue.serverTimestamp(),
        mpPaymentId:    data.id,
      });
      console.log(`✅ Usuário ${uid} atualizado para PRO`);
    }
  } catch (err) {
    console.error('Erro no webhook MP:', err);
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VocalPitch backend rodando na porta ${PORT}`));
