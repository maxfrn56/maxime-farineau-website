/**
 * Logique partagée — envoi formulaire contact via Resend
 * Utilisé par server.js (Express) et api/send.js (Vercel)
 */

const { Resend } = require('resend');

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validate(body) {
  const { name, email, message } = body || {};
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Nom invalide.';
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Email invalide.';
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return 'Message trop court (min. 10 caractères).';
  }
  return null;
}

function buildEmailHtml({ name, email, type, budget, message }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin:0; padding:0; background:#0A0A0A; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
    .wrapper { max-width:560px; margin:0 auto; padding:40px 24px; }
    .header  { border-bottom:1px solid #1C1C1C; padding-bottom:24px; margin-bottom:32px; }
    .label   { font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#888880; margin-bottom:6px; }
    .value   { font-size:14px; color:#F0EDE6; margin-bottom:20px; line-height:1.6; }
    .message { background:#111; border:1px solid #1C1C1C; border-left:3px solid #6ED888; padding:20px; border-radius:4px; }
    .message .value { margin-bottom:0; white-space:pre-wrap; }
    .footer  { margin-top:40px; padding-top:24px; border-top:1px solid #1C1C1C; font-size:11px; color:#555550; }
    h1 { font-size:28px; color:#F0EDE6; margin:0 0 4px; letter-spacing:.04em; font-weight:400; }
    .tag { font-size:11px; color:#6ED888; font-family:monospace; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="tag">// contact_form.submit()</div>
      <h1>Nouveau message portfolio</h1>
    </div>
    <div class="label">Nom</div>
    <div class="value">${escHtml(name)}</div>
    <div class="label">Email</div>
    <div class="value"><a href="mailto:${escHtml(email)}" style="color:#6ED888">${escHtml(email)}</a></div>
    <div class="label">Type de projet</div>
    <div class="value">${escHtml(type)}</div>
    <div class="label">Budget estimé</div>
    <div class="value">${escHtml(budget)}</div>
    <div class="label">Message</div>
    <div class="message"><div class="value">${escHtml(message)}</div></div>
    <div class="footer">
      Portfolio Maxime Farineau — répondre à ${escHtml(email)}
    </div>
  </div>
</body>
</html>`;
}

async function sendContactEmail(body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('RESEND_API_KEY non configurée sur le serveur.');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const resend = new Resend(apiKey);
  const { name, email, type = 'Non précisé', budget = 'Non précisé', message } = body;
  const to = process.env.CONTACT_TO || 'contact@maximefarineau.com';
  const from =
    process.env.RESEND_FROM ||
    'Maxime Farineau <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `[Portfolio] ${type} — ${name}`,
    html: buildEmailHtml({
      name: name.trim(),
      email: email.trim(),
      type,
      budget,
      message: message.trim(),
    }),
  });

  if (error) {
    const err = new Error(error.message || 'Erreur Resend');
    err.code = 'RESEND_ERROR';
    err.details = error;
    throw err;
  }

  return data;
}

/**
 * Handler Express / serverless (req, res)
 */
async function handleContactPost(req, res) {
  const validationError = validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    await sendContactEmail(req.body);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Contact]', err.code || 'error', err.message, err.details || '');
    if (err.code === 'MISSING_API_KEY') {
      return res.status(503).json({
        error: 'Service email non configuré. Contactez l’administrateur du site.',
      });
    }
    return res.status(500).json({
      error: 'Impossible d’envoyer l’email. Réessayez dans un instant.',
    });
  }
}

module.exports = {
  validate,
  buildEmailHtml,
  sendContactEmail,
  handleContactPost,
};
