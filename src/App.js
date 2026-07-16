import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from './firebase/config';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
// Removed local equipments data import
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import './index.css';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #060d1f, #0a1628)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid rgba(34,197,94,0.2)',
            borderTopColor: '#22c55e', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Chargement...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

// App inner with shared equipments state
const AppInner = () => {
  const { currentUser } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const equipmentsRef = useRef([]);
  const [isGlobalMonitoringActive, setIsGlobalMonitoringActive] = useState(false);

  // Ecoute Firestore uniquement apres connexion
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'equipements'), (snap) => {
      const incoming = [];
      snap.forEach((d) => {
        incoming.push({ id: d.id, ...d.data(), __collection__: 'equipements' });
      });
      setEquipments(incoming);
      equipmentsRef.current = incoming;
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Ecoute en temps reel de la configuration globale (settings/global)
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsGlobalMonitoringActive(data.isGlobalMonitoringActive === true);
      } else {
        setIsGlobalMonitoringActive(false);
      }
    }, (err) => {
      console.error('Error listening to global config:', err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Incremente uptime chaque seconde pour les equipements ONLINE et WARNING
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      equipmentsRef.current.forEach(eq => {
        const status = eq.status ? eq.status.toLowerCase() : '';
        if (status === 'online' || status === 'warning') {
          updateDoc(doc(db, 'equipements', eq.id), {
            uptime: increment(1)
          }).catch(err => console.error('Uptime increment error:', err));
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage equipments={equipments} setEquipments={setEquipments} isGlobalMonitoringActive={isGlobalMonitoringActive} />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <InventoryPage equipments={equipments} setEquipments={setEquipments} isGlobalMonitoringActive={isGlobalMonitoringActive} />
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <AlertsPage equipments={equipments} setEquipments={setEquipments} isGlobalMonitoringActive={isGlobalMonitoringActive} />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <ReportsPage equipments={equipments} setEquipments={setEquipments} isGlobalMonitoringActive={isGlobalMonitoringActive} />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
