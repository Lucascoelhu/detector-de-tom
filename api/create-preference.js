const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uid, email } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid obrigatório' });

  const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });

  try {
    const payment = new Payment(mpClient);
    const result = await payment.create({
      body: {
        transaction_amount: 29.90,
        description: 'Detector de Tom Pro — Acesso Vitalício',
        payment_method_id: 'pix',
        external_reference: uid,
        payer: {
          email: email || 'guest@detector-de-tom.vercel.app',
          first_name: 'Usuario',
          last_name: 'VocalPitch',
        },
      }
    });

    res.json({
      payment_id: result.id,
      qr_code: result.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (err) {
    console.error('Erro MP:', err);
    res.status(500).json({ error: 'Falha ao gerar Pix', detail: err.message });
  }
}
