/**
 * Vercel Serverless — POST /api/send
 * Variables d’environnement : RESEND_API_KEY, RESEND_FROM, CONTACT_TO, SITE_URL
 */
const { handleContactPost } = require('../lib/contact-handler');

module.exports = async (req, res) => {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, '');
  const origin = req.headers.origin;
  const allowOrigin =
    origin && siteUrl && (origin === siteUrl || origin.endsWith('.vercel.app'))
      ? origin
      : siteUrl || '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return handleContactPost(req, res);
};
