# NetServMonitor — Plan d'Implémentation Complet

## Contexte
Application web de supervision réseau enterprise avec React (Create React App), Tailwind CSS et Firebase (Auth + Firestore). Basée sur 5 maquettes fournies : Login, Dashboard, Inventory, Alerts, Reports.

---

## Architecture Technique

### Stack
- **Framework**: Create React App (React 18+)
- **Styling**: Tailwind CSS v3 + CSS custom
- **Routing**: React Router DOM v6
- **Firebase**: Authentication + Cloud Firestore
- **Icônes**: lucide-react
- **Charts**: recharts (pour les graphes du Dashboard et Reports)
- **PDF Export**: jsPDF (simulation d'export PDF)

### Structure de fichiers cible

```
src/
├── firebase/
│   └── config.js              # Configuration Firebase
├── contexts/
│   └── AuthContext.js         # Context global Auth + user       
├── hooks/
│   └── useEquipments.js       # Hook custom pour gérer l'état des équipements
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── AppLayout.jsx
│   ├── ui/
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── Spinner.jsx
│   └── chatbot/
│       └── AIChatbot.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── InventoryPage.jsx
│   ├── AlertsPage.jsx
│   └── ReportsPage.jsx
├── App.js
├── index.js
└── index.css
```

---

## Modèle de Données

### Firestore — Collection `users`
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "role": "Technicien Support | Opérateur NOC | Responsable IT | DSI",
  "isAdmin": false,
  "createdAt": "timestamp"
}
```

### JSON Local — Équipements (état initial useState)
```json
[
  {
    "id": "eq-001",
    "name": "Core-Router-Alpha-01",
    "ip": "192.168.1.1",
    "type": "Cisco Catalyst 9500",
    "status": "online",
    "cpu_usage": 12,
    "ram_usage": 45,
    "uptime": "12d 4h 22m",
    "lastSync": "2 mins ago"
  }
]
```

---

## Pages & Logique

### 1. LoginPage / RegisterPage
- Formulaire login avec Firebase `signInWithEmailAndPassword`
- Formulaire inscription avec `createUserWithEmailAndPassword` + `setDoc` dans Firestore
- Sélection de rôle (dropdown): Technicien Support, Opérateur NOC, Responsable IT, DSI
- `isAdmin` toujours `false` à la création (l'admin est pré-configuré)
- Bouton SSO (désactivé visuellement)
- "Demander un accès" → bascule vers RegisterPage

### 2. DashboardPage
- KPIs dynamiques calculés depuis l'état equipments JSON
- Graphe latence réseau (recharts LineChart simulé avec données aléatoires)
- Graphe CPU Core Load (recharts BarChart)
- Jauge RAM Utilization
- Tableau Live Infrastructure Status (depuis équipements JSON)
- Chatbot IA flottant (fenêtre coulissante) avec simulation de réponses textuelles

### 3. InventoryPage (Admin only - isAdmin: true)
- Tableau CRUD complet des équipements (chargé depuis useState JSON)
- Bouton "Ajouter un équipement" → Modal avec formulaire
- Icônes Edit (✏️), Vue (👁️), Supprimer (🗑️) par ligne
- Bouton Mode Pause/Maintenance → change status en "maintenance"
- Compteurs (Total Assets, Online, Alerts, Critical) dynamiques
- Pagination simulée
- Masqué/bloqué si `isAdmin: false`

### 4. AlertsPage
- Panel gauche: Threshold Logic
  - Dropdown sélection d'équipement (depuis JSON)
  - Curseurs CPU, Latence, Disk (activés seulement après sélection)
  - Bouton "Commit Threshold Changes" → sauvegarde en état local par équipement
  - Notification Channels avec email fixe: `tech@onda.ma`
- Panel droit: Live Monitoring Feed
  - Liste d'incidents avec sévérité (CRITICAL, WARNING, INFO)
  - Bouton "Acquitter" → change état → badge "Acquitté" grisé
  - Pagination et statistiques dynamiques

### 5. ReportsPage
- Sélecteur de période (7J, 30J, Dernier Trimestre, Personnalisé)
- Jauge SLA Disponibilité (calculée depuis équipements):
  - Si SLA < 99.9% → indicateur visuel "BREACH" rouge
  - Si SLA ≥ 99.9% → indicateur "OK" vert
- Graphe répartition des incidents (recharts BarChart)
- Panneau de prévisualisation du rapport "Executive Report"
- Bouton Export PDF → simulation avec `jsPDF` ou `window.print()`

---

## AuthContext
- Écoute `onAuthStateChanged`
- Après login, récupère le doc Firestore de l'utilisateur (`getDoc`)
- Expose: `currentUser`, `userProfile` (avec `isAdmin`), `loading`
- Protège les routes: non-authentifié → redirect vers `/login`

---

## Composants UI
- **Sidebar**: navigation active, indicateur page courante, bouton "+ New Request"
- **Header**: barre de recherche globale, icône notifications, avatar utilisateur
- **Modal**: réutilisable pour add/edit équipements
- **AIChatbot**: fenêtre flottante avec historique de messages, réponses simulées basées sur keywords

---

## Ordre d'Installation des Dépendances

```bash
npm install firebase react-router-dom lucide-react recharts jspdf tailwindcss @tailwindcss/forms
npx tailwindcss init
```

---

## Questions Ouvertes

> [!IMPORTANT]
> **Firebase Config**: Voulez-vous fournir vos clés Firebase (apiKey, projectId, etc.) ou dois-je utiliser des placeholders que vous remplacerez ?

> [!IMPORTANT]
> **Admin préconfiguration**: L'admin (isAdmin: true) doit-il être créé manuellement dans Firestore, ou souhaitez-vous un script/page de setup initial ?

> [!NOTE]
> **Recharts**: Les graphes seront simulés avec des données aléatoires dynamiques (setInterval) pour imiter le temps réel. Êtes-vous d'accord avec cette approche ?

---

## Plan d'Exécution

1. ✅ Installation des dépendances (Firebase, Router, Tailwind, Recharts, lucide-react, jsPDF)
2. ✅ Configuration Tailwind + thème couleurs (bleu marine #0a1628, vert #22c55e)
3. ✅ Firebase config + AuthContext
4. ✅ JSON équipements initial + hook useEquipments
5. ✅ Composants layout (Sidebar, Header, AppLayout)
6. ✅ LoginPage + RegisterPage
7. ✅ DashboardPage (KPIs + Charts + Chatbot)
8. ✅ InventoryPage (CRUD + Admin guard)
9. ✅ AlertsPage (Thresholds + Live Feed + Acquitter)
10. ✅ ReportsPage (SLA + Export PDF)
11. ✅ Routing + Protection des routes
12. ✅ Tests et vérification
