import crypto from 'node:crypto';
import http from 'node:http';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

function normalizeCiPhone(raw: string): string {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('225')) return digits;
  if (digits.length === 10) return `225${digits}`;
  return digits;
}

async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      gateways: {
        paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
        cinetpay: Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID),
        wave: Boolean(process.env.WAVE_API_KEY),
        whatsappCloud: Boolean(
          process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
        ),
        smsWebhook: Boolean(process.env.SMS_WEBHOOK_URL),
      },
    });
  });

  // Initialize a Mobile Money or Card payment session
  app.post('/api/payments/init', async (req, res) => {
    try {
      const { orderId, orderNumber, amountXof, customerEmail, customerPhone, paymentMethod } =
        req.body || {};

      if (!orderNumber || !amountXof || Number(amountXof) < 100) {
        return res.status(400).json({ error: 'Paramètres de paiement invalides.' });
      }

      const amount = Math.round(Number(amountXof));
      const cleanRef = `PAY-${orderNumber}-${Date.now().toString(36).toUpperCase()}`;

      // 1. Live Paystack integration if key is configured
      if (process.env.PAYSTACK_SECRET_KEY) {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customerEmail || 'client@chezloulou.ci',
            amount: amount * 100, // XOF subunit / 100
            currency: 'XOF',
            reference: cleanRef,
            metadata: { orderId, orderNumber, customerPhone, paymentMethod },
          }),
        });
        const paystackData = (await paystackRes.json()) as {
          status?: boolean;
          message?: string;
          data?: { authorization_url?: string; reference?: string };
        };
        if (paystackRes.ok && paystackData.status && paystackData.data?.authorization_url) {
          return res.json({
            provider: 'paystack',
            mode: 'live_gateway',
            reference: paystackData.data.reference || cleanRef,
            checkoutUrl: paystackData.data.authorization_url,
            instructions: 'Finalisez le paiement sécurisé sur la page Paystack (Mobile Money ou Carte).',
          });
        }
      }

      // 2. Live CinetPay integration if keys are configured
      if (process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const cinetRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: process.env.CINETPAY_API_KEY,
            site_id: process.env.CINETPAY_SITE_ID,
            transaction_id: cleanRef,
            amount,
            currency: 'XOF',
            description: `Commande ${orderNumber} - Chez LouLou Abidjan`,
            notify_url: `${appUrl}/api/payments/webhook`,
            return_url: appUrl,
            channels: 'ALL',
          }),
        });
        const cinetData = (await cinetRes.json()) as {
          code?: string;
          data?: { payment_url?: string };
        };
        if (cinetRes.ok && cinetData.code === '201' && cinetData.data?.payment_url) {
          return res.json({
            provider: 'cinetpay',
            mode: 'live_gateway',
            reference: cleanRef,
            checkoutUrl: cinetData.data.payment_url,
            instructions: 'Finalisez votre paiement Wave, Orange Money, MTN MoMo ou Carte via CinetPay.',
          });
        }
      }

      // 3. Direct Ivory Coast Mobile Money instructions & verifiable reference
      const providerInstructions: Record<string, string> = {
        wave: `Ouvrez votre application Wave Côte d’Ivoire, envoyez ${amount} FCFA au numéro boutique et saisissez l’ID de transaction Wave ci-dessous.`,
        orange_money: `Composez #144*1*1# sur votre ligne Orange CI pour régler ${amount} FCFA, puis saisissez la référence SMS reçue.`,
        mtn_momo: `Composez *133# sur votre ligne MTN CI pour valider le transfert de ${amount} FCFA, puis saisissez l’ID de transaction.`,
        card: `Réglez par carte ou lien sécurisé avec la référence ${cleanRef}, puis confirmez l’autorisation.`,
        cash_on_delivery: `Paiement en espèces ou Mobile Money à la réception du colis.`,
      };

      return res.json({
        provider: paymentMethod || 'wave',
        mode: 'direct_mobile_money',
        reference: cleanRef,
        checkoutUrl: null,
        instructions:
          providerInstructions[String(paymentMethod || 'wave')] ||
          providerInstructions.wave,
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Erreur d’initialisation du paiement.',
      });
    }
  });

  // Verify a payment reference against configured gateway or direct CI format
  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { reference, provider } = req.body || {};
      const refStr = String(reference || '').trim();
      if (refStr.length < 6 || refStr.length > 128) {
        return res.status(400).json({
          verified: false,
          error: 'Référence de transaction invalide (minimum 6 caractères).',
        });
      }

      if (provider === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(refStr)}`,
          {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
          }
        );
        const data = (await verifyRes.json()) as {
          status?: boolean;
          data?: { status?: string; amount?: number };
        };
        if (verifyRes.ok && data.status && data.data?.status === 'success') {
          return res.json({
            verified: true,
            status: 'paid',
            provider: 'paystack',
            reference: refStr,
          });
        }
        return res.json({
          verified: false,
          status: 'pending_verification',
          message: 'Transaction Paystack non encore confirmée.',
        });
      }

      if (provider === 'cinetpay' && process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID) {
        const verifyRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: process.env.CINETPAY_API_KEY,
            site_id: process.env.CINETPAY_SITE_ID,
            transaction_id: refStr,
          }),
        });
        const data = (await verifyRes.json()) as {
          code?: string;
          data?: { status?: string };
        };
        if (verifyRes.ok && data.code === '00' && data.data?.status === 'ACCEPTED') {
          return res.json({
            verified: true,
            status: 'paid',
            provider: 'cinetpay',
            reference: refStr,
          });
        }
        return res.json({
          verified: false,
          status: 'pending_verification',
          message: 'Paiement CinetPay en attente de confirmation.',
        });
      }

      // Direct Mobile Money transaction reference submitted for verification
      return res.json({
        verified: true,
        status: 'pending_verification',
        provider: provider || 'mobile_money',
        reference: refStr,
        message:
          'Référence enregistrée. La boutique vérifie le dépôt Mobile Money avant expédition.',
      });
    } catch (err) {
      return res.status(500).json({
        verified: false,
        error: err instanceof Error ? err.message : 'Erreur de vérification.',
      });
    }
  });

  // Payment Gateway Webhook receiver (Paystack / CinetPay / Wave)
  app.post('/api/payments/webhook', (req, res) => {
    const paystackSig = req.headers['x-paystack-signature'];
    if (paystackSig && process.env.PAYSTACK_SECRET_KEY) {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (hash !== paystackSig) {
        return res.status(401).json({ error: 'Signature webhook invalide.' });
      }
    }
    return res.status(200).json({ received: true });
  });

  // WhatsApp & SMS Notification dispatcher
  app.post('/api/notifications/dispatch', async (req, res) => {
    try {
      const { phone, message, channel } = req.body || {};
      const cleanPhone = normalizeCiPhone(String(phone || ''));
      const cleanMsg = String(message || '').trim().slice(0, 1000);

      if (!cleanPhone || !cleanMsg) {
        return res.status(400).json({ error: 'Numéro et message requis.' });
      }

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(cleanMsg)}`;
      const smsUrl = `sms:+${cleanPhone}?body=${encodeURIComponent(cleanMsg)}`;

      // Attempt live WhatsApp Cloud API delivery if configured
      if (
        channel === 'whatsapp' &&
        process.env.WHATSAPP_CLOUD_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID
      ) {
        const waRes = await fetch(
          `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'text',
              text: { body: cleanMsg },
            }),
          }
        );
        if (waRes.ok) {
          return res.json({ status: 'sent', channel: 'whatsapp', whatsappUrl, smsUrl });
        }
      }

      // Attempt SMS webhook delivery if configured
      if (channel === 'sms' && process.env.SMS_WEBHOOK_URL) {
        const smsRes = await fetch(process.env.SMS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: `+${cleanPhone}`, message: cleanMsg }),
        });
        if (smsRes.ok) {
          return res.json({ status: 'sent', channel: 'sms', whatsappUrl, smsUrl });
        }
      }

      return res.json({
        status: 'manual_link',
        channel: channel || 'whatsapp',
        whatsappUrl,
        smsUrl,
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Erreur d’envoi de notification.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: express.RequestHandler | null = null;
    const viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          ws: { server: httpServer },
        },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
      return vite.middlewares;
    })();

    app.use(async (req, res, next) => {
      try {
        const mw = viteMiddleware || (await viteReadyPromise);
        return mw(req, res, next);
      } catch (err) {
        return next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chez LouLou server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start Chez LouLou server:', err);
  process.exit(1);
});
