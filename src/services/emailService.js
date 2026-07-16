import emailjs from '@emailjs/browser';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const EMAILJS_SERVICE_ID  = 'service_rns2ptj';
const EMAILJS_TEMPLATE_ID = 'template_pi8rtp4';
const EMAILJS_PUBLIC_KEY  = 'gyGVj23u1CEYktV-6';

const DEFAULT_EMAIL_RECIPIENT = 'mehdiezzahraoui35@gmail.com';

// Initialize EmailJS once at module load
emailjs.init(EMAILJS_PUBLIC_KEY);

const getGlobalSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error fetching global settings for email:", err);
  }
  return null;
};

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
  const settings = await getGlobalSettings();
  const isEnabled = settings?.emailNotificationsEnabled ?? false;
  
  if (!isEnabled) return;

  const rawEmails = settings?.techEmails && settings.techEmails.trim() !== '' 
    ? settings.techEmails 
    : DEFAULT_EMAIL_RECIPIENT;

  // Splitting emails to handle multiple recipients correctly with EmailJS
  const emails = rawEmails.split(',').map(e => e.trim()).filter(e => e !== '');

  const promises = emails.map(email => 
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      // Match template variables exactly
      title:    `[NetServMonitor] Alerte ${severity} — ${equipName} (${equipIp})`,
      name:     `NetServMonitor`,
      email:    email,
      message:  `Sévérité : ${severity}\nÉquipement : ${equipName} (${equipIp})\nType : ${equipType || 'Inconnu'}\nDétail : ${description}\nDate : ${new Date().toLocaleString()}`,
    })
  );

  return Promise.allSettled(promises);
};

/**
 * Sends a test email to validate the EmailJS configuration.
 */
export const sendTestEmail = async () => {
  const settings = await getGlobalSettings();
  
  const rawEmails = settings?.techEmails && settings.techEmails.trim() !== '' 
    ? settings.techEmails 
    : DEFAULT_EMAIL_RECIPIENT;

  const emails = rawEmails.split(',').map(e => e.trim()).filter(e => e !== '');

  const promises = emails.map(email => 
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      title:    '[NetServMonitor] 🧪 Test de Notification',
      name:     'NetServMonitor',
      email:    email,
      message:  `Ceci est un e-mail de test pour valider la configuration.\nDate : ${new Date().toLocaleString()}`,
    })
  );

  return Promise.allSettled(promises);
};
