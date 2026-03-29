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
  res.sendStatus(200);
  if (req.body?.type !== 'payment') return;

  try {
    const mpClient      = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const paymentClient = new Payment(mpClient);
    const data          = await paymentClient.get({ id: req.body.data.id });

    if (data.status !== 'approved') return;

    const uid       = data.external_reference; // pode ser guest_XXXXX ou UID real
    const paymentId = String(data.id);

    // Salva o pagamento aprovado na coleção 'payments' (sempre funciona)
    await admin.firestore().collection('payments').doc(paymentId).set({
      paymentId,
      externalReference: uid,
      status: 'approved',
      approvedAt: new Date(),
    });

    // Se for UID real do Firebase, atualiza o plano diretamente
    if (!uid.startsWith('guest_')) {
      const ref  = admin.firestore().collection('users').doc(uid);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({ plan: 'pro', purchasedAt: new Date(), paymentId });
      }
    }
  } catch (err) {
    console.error('Webhook erro:', err);
  }
}
