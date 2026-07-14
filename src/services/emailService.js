import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID  = 'service_rns2ptj';
const EMAILJS_TEMPLATE_ID = 'template_pi8rtp4';
const EMAILJS_PUBLIC_KEY  = 'gyGVj23u1CEYktV-6';

const ALERT_EMAIL_RECIPIENT = 'mehdiezzahraoui35@gmail.com';

// Initialize EmailJS once at module load
emailjs.init(EMAILJS_PUBLIC_KEY);

export const isEmailEnabled = () =>
  localStorage.getItem('emailNotificationsEnabled') === 'true';

/**
 * Sends an alert email via EmailJS.
 * Variables match the existing template_pi8rtp4 template:
 *   {{to_email}}, {{title}}, {{name}}, {{email}}
 */
export const sendAlertEmail = async ({
  severity = 'WARNING',
  equipName = '',
  equipIp = '',
  equipType = '',
  description = '',
}) => {
  if (!isEmailEnabled()) return;

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: ALERT_EMAIL_RECIPIENT,
    // Match template variables exactly
    title:    `[NetServMonitor] Alerte ${severity} — ${equipName} (${equipIp})`,
    name:     `NetServMonitor`,
    email:    ALERT_EMAIL_RECIPIENT,
    message:  `Sévérité : ${severity}\nÉquipement : ${equipName} (${equipIp})\nType : ${equipType || 'Inconnu'}\nDétail : ${description}\nDate : ${new Date().toLocaleString()}`,
  });
};

/**
 * Sends a test email to validate the EmailJS configuration.
 */
export const sendTestEmail = async () => {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: ALERT_EMAIL_RECIPIENT,
    title:    '[NetServMonitor] 🧪 Test de Notification',
    name:     'NetServMonitor',
    email:    ALERT_EMAIL_RECIPIENT,
    message:  `Ceci est un e-mail de test pour valider la configuration.\nDate : ${new Date().toLocaleString()}`,
  });
};
