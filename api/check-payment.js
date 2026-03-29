const { MercadoPagoConfig, Payment } = require('mercadopago');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { payment_id, uid } = req.query;
  if (!payment_id || !uid) return res.status(400).json({ error: 'payment_id e uid obrigatórios' });

  const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });

  try {
    const payment = new Payment(mpClient);
    const result  = await payment.get({ id: payment_id });

    if (result.status === 'approved' && result.external_reference === uid) {
      // Se for um UID real do Firebase (não guest_), atualiza o plano
      if (!uid.startsWith('guest_')) {
        const ref = admin.firestore().collection('users').doc(uid);
        const snap = await ref.get();
        if (snap.exists) {
          await ref.update({ plan: 'pro', purchasedAt: new Date(), paymentId: payment_id });
        }
      }
      // Pagamento aprovado — frontend vai abrir modal de cadastro
      return res.json({ approved: true, payment_id });
    }

    res.json({ approved: false, status: result.status });
  } catch (err) {
    console.error('Erro check payment:', err);
    res.status(500).json({ error: 'Falha ao verificar pagamento', detail: err.message });
  }
}
