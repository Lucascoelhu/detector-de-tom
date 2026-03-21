const { MercadoPagoConfig, Preference } = require('mercadopago');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'uid e email obrigatórios' });

  const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });

  try {
    const preference = new Preference(mpClient);
    const pref = await preference.create({
      body: {
        items: [{
          id: 'vocalpitch-pro-monthly',
          title: 'VocalPitch Pro — Assinatura Mensal',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 19.90,
        }],
        payer: { email },
        external_reference: uid,
        back_urls: {
          success: `${process.env.FRONTEND_URL}?payment_status=approved`,
          failure: `${process.env.FRONTEND_URL}?payment_status=failed`,
          pending: `${process.env.FRONTEND_URL}?payment_status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.FRONTEND_URL}/api/mp-webhook`,
      }
    });
    res.json({ init_point: pref.init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao criar pagamento' });
  }
}
