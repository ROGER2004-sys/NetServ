/**
 * NetServ Ping Agent — Surveillance Globale du Réseau
 * 
 * Cet agent écoute la configuration globale dans Firestore (settings/global).
 * - Si isGlobalMonitoringActive === true  → Ping toutes les machines toutes les 30s
 * - Si isGlobalMonitoringActive === false → Aucun ping, les statuts restent figés
 */

const ping = require('ping');
const admin = require('firebase-admin');
const path = require('path');
const https = require('https');

// ─── Initialisation Firebase Admin ─────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialisé avec succès.');
} catch (err) {
  console.error('❌ Erreur : Impossible de charger serviceAccountKey.json');
  console.error('   Téléchargez-le depuis : Console Firebase → Paramètres → Comptes de service');
  console.error('   Placez-le dans : ping-agent/serviceAccountKey.json');
  process.exit(1);
}

const db = admin.firestore();

// ─── État Global ───────────────────────────────────────────────────────────
let isMonitoringActive = false;
let pingInterval = null;
const PING_INTERVAL_MS = 30000; // 30 secondes

// ─── Fonction de Ping de Toutes les Machines ──────────────────────────────
async function checkAllMachines() {
  if (!isMonitoringActive) {
    return;
  }

  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Lancement du scan réseau...`);

  try {
    const snapshot = await db.collection('equipements').get();

    if (snapshot.empty) {
      console.log('   ℹ️  Aucun équipement trouvé dans la base.');
      return;
    }

    const pingPromises = snapshot.docs.map(async (docSnap) => {
      const machine = docSnap.data();
      const ip = machine.ip;

      if (!ip) {
        console.log(`   ⚠️  ${docSnap.id} — Pas d'adresse IP, ignoré.`);
        return;
      }

      try {
        const res = await ping.promise.probe(ip, { timeout: 2 });
        const nouveauStatut = res.alive ? 'online' : 'offline';

        // Ne mettre à jour que si le statut a changé
        // Et ne pas écraser le statut "maintenance" (géré manuellement par l'admin)
        if (machine.status === 'maintenance') {
          console.log(`   🔧 ${machine.name || ip} — En maintenance, statut préservé.`);
          return;
        }

        if (machine.status !== nouveauStatut) {
          await db.collection('equipements').doc(docSnap.id).update({
            status: nouveauStatut,
            lastSync: new Date().toISOString()
          });
          const icon = nouveauStatut === 'online' ? '🟢' : '🔴';
          console.log(`   ${icon} ${machine.name || ip} (${ip}) — ${machine.status} → ${nouveauStatut}`);

          // --- NOUVEAU : Si l'équipement tombe OFFLINE, générer alerte et email ---
          if (nouveauStatut === 'offline') {
            console.log(`   ⚠️ Génération de l'alerte pour ${machine.name || ip}...`);
            
            // 1. Ajouter une alerte dans Firestore
            await db.collection('alerts').add({
              equipment_id: docSnap.id,
              severity: 'CRITICAL',
              resource: machine.type || 'Equipment',
              title: `Équipement hors ligne : ${machine.name || ip}`,
              description: `${machine.name || ip} (${ip}) est actuellement hors ligne (ping échoué).`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              status: 'open',
              acquitted: false
            });

            // 2. Envoyer un email via EmailJS (si activé)
            const settingsSnap = await db.collection('settings').doc('global').get();
            const settings = settingsSnap.data() || {};
            
            if (settings.emailNotificationsEnabled) {
              const rawEmails = settings.techEmails && settings.techEmails.trim() !== '' 
                ? settings.techEmails 
                : 'mehdiezzahraoui35@gmail.com';
              const emails = rawEmails.split(',').map(e => e.trim()).filter(e => e !== '');
              
              for (const email of emails) {
                const emailData = JSON.stringify({
                  service_id: 'service_rns2ptj',
                  template_id: 'template_pi8rtp4',
                  user_id: 'gyGVj23u1CEYktV-6',
                  template_params: {
                    to_email: email,
                    title: `[NetServMonitor] Alerte CRITICAL — ${machine.name || ip} (${ip})`,
                    name: 'NetServMonitor Agent',
                    email: email,
                    message: `Sévérité : CRITICAL\nÉquipement : ${machine.name || ip} (${ip})\nType : ${machine.type || 'Inconnu'}\nDétail : La machine est injoignable par le ping automatique.\nDate : ${new Date().toLocaleString()}`
                  }
                });

                const req = https.request({
                  hostname: 'api.emailjs.com',
                  path: '/api/v1.0/email/send',
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(emailData)
                  }
                }, () => {
                  console.log(`   ✉️  Email envoyé à ${email}`);
                });

                req.on('error', (e) => console.error(`   ❌ Erreur email:`, e));
                req.write(emailData);
                req.end();
              }
            }
          }
        } else {
          console.log(`   ⚪ ${machine.name || ip} (${ip}) — Statut inchangé (${nouveauStatut})`);
        }
      } catch (pingErr) {
        console.error(`   ❌ Erreur ping ${machine.name || ip} (${ip}):`, pingErr.message);
      }
    });

    await Promise.all(pingPromises);
    console.log(`✅ Scan terminé. Prochain scan dans ${PING_INTERVAL_MS / 1000}s.`);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des équipements:', err.message);
  }
}

// ─── Démarrer / Arrêter le cycle de ping ──────────────────────────────────
function startPingCycle() {
  if (pingInterval) return; // Déjà en cours
  console.log('▶️  Surveillance globale DÉMARRÉE — Ping toutes les 30s');
  checkAllMachines(); // Premier scan immédiat
  pingInterval = setInterval(checkAllMachines, PING_INTERVAL_MS);
}

function stopPingCycle() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  console.log('⏸️  Surveillance globale ARRÊTÉE — Les statuts restent figés');
}

// ─── Écoute en temps réel de la configuration globale ─────────────────────
console.log('\n════════════════════════════════════════════════════');
console.log('  NetServ Ping Agent — Surveillance Réseau v1.0');
console.log('════════════════════════════════════════════════════\n');
console.log('👂 Écoute de la configuration globale (settings/global)...\n');

db.collection('settings').doc('global').onSnapshot((docSnap) => {
  if (!docSnap.exists) {
    console.log('⚠️  Document settings/global introuvable. Surveillance désactivée par défaut.');
    isMonitoringActive = false;
    stopPingCycle();
    return;
  }

  const config = docSnap.data();
  const newState = config.isGlobalMonitoringActive === true;

  if (newState !== isMonitoringActive) {
    isMonitoringActive = newState;
    if (isMonitoringActive) {
      startPingCycle();
    } else {
      stopPingCycle();
    }
  }
}, (err) => {
  console.error('❌ Erreur écoute Firestore:', err.message);
});

// ─── Gestion propre de l'arrêt ────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'agent...');
  stopPingCycle();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt de l\'agent...');
  stopPingCycle();
  process.exit(0);
});
