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

export default async function handler(req, res) {
  res.sendStatus(200);
  if (req.body?.type !== 'payment') return;

  try {
    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const paymentClient = new Payment(mpClient);
    const data = await paymentClient.get({ id: req.body.data.id });

    if (data.status === 'approved' && data.external_reference) {
      await admin.firestore()
        .collection('users')
        .doc(data.external_reference)
        .update({ plan: 'pro' });
    }
  } catch (err) {
    console.error(err);
  }
}
