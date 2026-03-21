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
    const result = await payment.get({ id: payment_id });

    if (result.status === 'approved' && result.external_reference === uid) {
      await admin.firestore()
        .collection('users')
        .doc(uid)
        .update({ plan: 'pro', purchasedAt: new Date(), paymentId: payment_id });

      return res.json({ approved: true });
    }

    res.json({ approved: false, status: result.status });
  } catch (err) {
    console.error('Erro check payment:', err);
    res.status(500).json({ error: 'Falha ao verificar pagamento', detail: err.message, stack: err.stack });
  }
}
