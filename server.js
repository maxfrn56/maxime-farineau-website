/**
 * MAXIME FARINEAU — Site + API contact (Railway, local, Node)
 *
 *   npm install && cp .env.example .env
 *   npm run dev          → local : site + http://localhost:3001/send
 *   npm start            → Railway / production (PORT imposé par l’hébergeur)
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { handleContactPost } = require('./lib/contact-handler');

const app = express();
const PORT = process.env.PORT || 3001;
const ROOT = __dirname;
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  process.env.SITE_URL,
  process.env.SITE_URL?.replace(/\/$/, ''),
].filter(Boolean);

app.use(express.json({ limit: '32kb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin === o || origin.startsWith(o))) {
        return callback(null, true);
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('CORS not allowed'));
    },
    methods: ['POST', 'OPTIONS'],
  })
);

app.post('/send', handleContactPost);
app.post('/api/send', handleContactPost);

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    resend: Boolean(process.env.RESEND_API_KEY),
  });
});

/* Fichiers statiques (portfolio) */
app.use(express.static(ROOT, { index: 'index.html', extensions: ['html'] }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Portfolio + contact → http://0.0.0.0:${PORT}`);
  console.log(`  → POST /send et /api/send`);
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠  RESEND_API_KEY manquante — configurez les variables Railway / .env');
  } else {
    console.log(`  → emails → ${process.env.CONTACT_TO || 'contact@maximefarineau.com'}`);
    console.log(`  → from ${process.env.RESEND_FROM || '(défaut Resend)'}`);
  }
  if (isProd && process.env.SITE_URL) {
    console.log(`  → SITE_URL ${process.env.SITE_URL}`);
  }
});
