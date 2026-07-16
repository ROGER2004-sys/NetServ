import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';


import { updateDoc, deleteDoc, doc, onSnapshot, collection, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNotifications } from '../contexts/NotificationContext';
import {
  SlidersHorizontal, Bell, Mail,
  CheckCircle, Circle, Download, LayoutGrid, Info,
  ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

const ALERTS_PER_PAGE = 6;

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const AlertsPage = ({ equipments, isGlobalMonitoringActive }) => {
  const { isAdmin, userProfile } = useAuth();
  const canManageAlerts = isAdmin || String(userProfile?.role || '').toLowerCase().includes('technicien');
  const { pushNotification } = useNotifications();
  const [alerts, setAlerts] = useState([]);
  const [alertsPage, setAlertsPage] = useState(1);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [thresholds, setThresholds] = useState({ cpu: 90, latency: 150, disk: 420 });
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    setAlertsPage(1);
  }, [filterSeverity]);

  // Listen to global email notification settings in Firestore
  useEffect(() => {
    // Check localStorage first for immediate local fallback
    const localVal = localStorage.getItem('emailNotificationsEnabled') === 'true';
    setEmailEnabled(localVal);

    const unsubscribe = onSnapshot(doc(db, 'settings', 'notifications'), (docSnap) => {
      if (docSnap.exists()) {
        const val = Boolean(docSnap.data().emailEnabled);
        setEmailEnabled(val);
        localStorage.setItem('emailNotificationsEnabled', String(val));
      }
    }, (err) => {
      console.warn("Firestore settings listen failed, using localStorage fallback:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleEmail = async () => {
    if (!canManageAlerts) {
      pushNotification({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas les droits pour modifier les canaux de notification.',
        type: 'error'
      });
      return;
    }
    const nextVal = !emailEnabled;
    setEmailEnabled(nextVal);
    localStorage.setItem('emailNotificationsEnabled', String(nextVal));

    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        emailEnabled: nextVal
      }, { merge: true });
      pushNotification({
        title: 'Paramètre mis à jour',
        message: `Notifications par e-mail ${nextVal ? 'activées' : 'désactivées'}.`,
        type: 'info'
      });
    } catch (err) {
      console.error('Error toggling email setting in Firestore:', err);
      pushNotification({
        title: 'Enregistré localement',
        message: `Notifications par e-mail ${nextVal ? 'activées' : 'désactivées'} (Sauvegardé localement).`,
        type: 'info'
      });
    }
  };



  // Active critical count
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.acquitted).length;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const fetchedAlerts = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          severity: data.severity || 'INFO',
          timestamp: data.timestamp || '',
          resource: data.resource || 'Unknown',
          title: data.title || 'No title',
          description: data.description || '',
          acquitted: Boolean(data.acquitted)
        };
      });

      const sortedAlerts = [...fetchedAlerts].sort((a, b) => {
        const getSortableTimestamp = (value) => {
          if (!value) return 0;
          if (typeof value === 'number') return value;
          if (value?.toDate) return value.toDate().getTime();
          if (typeof value === 'string') {
            const parsed = Number(String(value).replace(/[^0-9]/g, ''));
            return Number.isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        };

        return getSortableTimestamp(b.timestamp) - getSortableTimestamp(a.timestamp);
      });

      setAlerts(sortedAlerts);
    });

    return () => unsubscribe();
  }, []);

  // Acquit an alert
  const handleAcquit = async (id) => {
    if (!canManageAlerts) return;
    try {
      await updateDoc(doc(db, 'alerts', id), { acquitted: true });
      pushNotification({
        title: 'Alerte acquittée',
        message: 'L’alerte a été marquée comme acquittée.',
        type: 'info'
      });
    } catch (err) {
      console.error('Error updating alert:', err);
    }
  };

  const handleTerminate = async (id) => {
    if (!canManageAlerts) return;
    try {
      await deleteDoc(doc(db, 'alerts', id));
      pushNotification({
        title: 'Alerte terminée',
        message: 'L’alerte a été supprimée du flux.',
        type: 'info'
      });
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  // Load thresholds for selected equipment (only when selection changes to avoid resetting during edit)
  useEffect(() => {
    if (selectedEqId) {
      const eq = equipments.find(e => e.id === selectedEqId);
      if (eq) {
        setThresholds({
          cpu: eq.cpu_threshold !== undefined ? eq.cpu_threshold : 90,
          latency: eq.latency_threshold !== undefined ? eq.latency_threshold : 150,
          disk: eq.disk_threshold !== undefined ? eq.disk_threshold : 420
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEqId]);

  // Commit thresholds
  const handleCommit = async () => {
    if (!selectedEqId) return;
    try {
      await updateDoc(doc(db, 'equipements', selectedEqId), {
        cpu_threshold: thresholds.cpu,
        latency_threshold: thresholds.latency,
        disk_threshold: thresholds.disk
      });
      setCommitSuccess(true);
      setTimeout(() => setCommitSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating thresholds:", err);
    }
  };

  // Slider style helper
  const sliderStyle = (value, max) => ({
    '--val': `${(value / max) * 100}%`
  });

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });

  const totalAlertsPages = Math.ceil(filteredAlerts.length / ALERTS_PER_PAGE);
  const paginatedAlerts = filteredAlerts.slice(
    (alertsPage - 1) * ALERTS_PER_PAGE,
    alertsPage * ALERTS_PER_PAGE
  );

  return (
    <AppLayout title="NetServMonitor" searchPlaceholder="Global search entities..." isGlobalMonitoringActive={isGlobalMonitoringActive}>
      {/* Breadcrumb + critical badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>System</span><span>›</span><span style={{ color: '#475569', fontWeight: 500 }}>Alerts & Notifications</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {criticalCount > 0 && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 12, fontWeight: 600, color: '#dc2626',
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              {criticalCount} ACTIVE CRITICAL
            </div>
          )}
          <button
            className="btn-secondary"
            id="configure-filters-btn"
            style={{
              fontSize: 12,
              padding: '6px 14px',
              borderColor: showFilters ? '#1e3a6e' : '#e2e8f0',
              background: showFilters ? '#eff6ff' : 'white',
              color: showFilters ? '#1e3a6e' : '#475569',
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            ≡ Configure Filters {filterSeverity !== 'ALL' && `(${filterSeverity})`}
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 18,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          animation: 'slideDown 0.2s ease-out',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} />
            Severity Filter:
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'All Severities', value: 'ALL', color: '#64748b' },
              { label: 'CRITICAL', value: 'CRITICAL', color: '#ef4444' },
              { label: 'WARNING', value: 'WARNING', color: '#f97316' },
              { label: 'INFO', value: 'INFO', color: '#3b82f6' }
            ].map(opt => (
              <button
                key={opt.value}
                id={`filter-sev-${opt.value.toLowerCase()}-btn`}
                onClick={() => setFilterSeverity(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1.5px solid ${filterSeverity === opt.value ? opt.color : '#e2e8f0'}`,
                  background: filterSeverity === opt.value ? `${opt.color}15` : 'white',
                  color: filterSeverity === opt.value ? opt.color : '#64748b',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18 }}>
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Threshold Logic */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={16} color="#64748b" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Threshold Logic</h3>
              </div>
              <Info size={14} color="#94a3b8" />
            </div>

            {/* Equipment selector */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 10, marginBottom: 6 }}>SÉLECTIONNER UN ÉQUIPEMENT</label>
              <select
                id="threshold-equipment-select"
                className="form-select"
                value={selectedEqId}
                onChange={e => setSelectedEqId(e.target.value)}
                style={{ fontSize: 12 }}
              >
                <option value="">-- Choisir un équipement --</option>
                {equipments.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name} ({eq.ip})</option>
                ))}
              </select>
              {!selectedEqId && (
                <div style={{ fontSize: 11, color: '#f97316', marginTop: 4 }}>
                  ⚠ Sélectionnez d'abord un équipement
                </div>
              )}
            </div>

            {/* CPU Slider */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 10 }}>CPU UTILIZATION (%)</label>
                <div style={{
                  background: '#eff6ff', color: '#1e3a6e',
                  padding: '2px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700
                }}>
                  {thresholds.cpu}%
                </div>
              </div>
              <input
                id="cpu-threshold-slider"
                type="range" min="0" max="100"
                className="range-slider"
                style={sliderStyle(thresholds.cpu, 100)}
                value={thresholds.cpu}
                disabled={!selectedEqId || !canManageAlerts}
                onChange={e => setThresholds(prev => ({ ...prev, cpu: Number(e.target.value) }))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                <span>WARN @ 75%</span>
                <span>CRIT @ 90%</span>
              </div>
            </div>

            {/* Latency Slider */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 10 }}>NODE LATENCY (MS)</label>
                <div style={{
                  background: '#eff6ff', color: '#1e3a6e',
                  padding: '2px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700
                }}>
                  {thresholds.latency}ms
                </div>
              </div>
              <input
                id="latency-threshold-slider"
                type="range" min="0" max="500"
                className="range-slider"
                style={sliderStyle(thresholds.latency, 500)}
                value={thresholds.latency}
                disabled={!selectedEqId || !canManageAlerts}
                onChange={e => setThresholds(prev => ({ ...prev, latency: Number(e.target.value) }))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                <span>WARN @ 100ms</span>
                <span>CRIT @ 150ms</span>
              </div>
            </div>

            {/* Disk Slider */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 10 }}>DISK READ/WRITE (MB/S)</label>
                <div style={{
                  background: '#eff6ff', color: '#1e3a6e',
                  padding: '2px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700
                }}>
                  {thresholds.disk}
                </div>
              </div>
              <input
                id="disk-threshold-slider"
                type="range" min="0" max="1000"
                className="range-slider"
                style={sliderStyle(thresholds.disk, 1000)}
                value={thresholds.disk}
                disabled={!selectedEqId || !canManageAlerts}
                onChange={e => setThresholds(prev => ({ ...prev, disk: Number(e.target.value) }))}
              />
            </div>

            {/* Commit button */}
            {canManageAlerts ? (
              <button
                id="commit-thresholds-btn"
                onClick={handleCommit}
                disabled={!selectedEqId}
                style={{
                  width: '100%', padding: '11px',
                  background: !selectedEqId ? '#94a3b8' : 'linear-gradient(135deg, #0a1628, #1e3a6e)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: !selectedEqId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {commitSuccess ? '✅ Seuils enregistrés !' : 'Commit Threshold Changes'}
              </button>
            ) : (
              <div style={{ marginTop: 8, color: '#475569', fontSize: 12, lineHeight: 1.4 }}>
                Vous n'avez pas les droits pour modifier la logique de seuils.
              </div>
            )}
          </div>

          {/* Notification Channels */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={16} color="#64748b" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Notification Channels</h3>
            </div>

            <div
              className="notif-channel"
              id="channel-email"
              style={{
                borderColor: emailEnabled ? '#22c55e' : '#e2e8f0',
                background: emailEnabled ? '#f0fdf4' : '#f8fafc',
                userSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', opacity: canManageAlerts ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: canManageAlerts ? 'pointer' : 'not-allowed' }} onClick={handleToggleEmail}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: emailEnabled ? '#dcfce7' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}>
                    <Mail size={16} color={emailEnabled ? '#22c55e' : '#64748b'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Email Relay</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Active: mehdiezzahraoui35@gmail.com</div>
                  </div>
                </div>
                <div style={{ cursor: canManageAlerts ? 'pointer' : 'not-allowed' }} onClick={handleToggleEmail}>
                  {emailEnabled ? (
                    <CheckCircle size={18} color="#22c55e" style={{ transition: 'all 0.2s' }} />
                  ) : (
                    <Circle size={18} color="#cbd5e1" style={{ transition: 'all 0.2s' }} />
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Live Feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Feed header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Live Monitoring Feed</h3>
              <div style={{
                background: '#dcfce7', border: '1px solid #bbf7d0',
                borderRadius: 20, padding: '3px 10px',
                fontSize: 11, fontWeight: 600, color: '#15803d',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <span className="live-dot" />
                LIVE CONNECTED
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="icon-btn" id="download-feed-btn"><Download size={15} /></button>
              <button className="icon-btn" id="grid-view-btn"><LayoutGrid size={15} /></button>
            </div>
          </div>

          {/* Table header */}
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>SEVERITY</th>
                <th style={{ width: 110 }}>TIMESTAMP</th>
                <th style={{ width: 130 }}>RESOURCE</th>
                <th>DESCRIPTION</th>
                <th style={{ width: 140 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.map(alert => (
                <tr key={alert.id} className={`alert-row ${alert.severity.toLowerCase()}-row`}>
                  <td>
                    <span className={`severity-${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{formatDisplayValue(alert.timestamp)}</td>
                  <td style={{ fontWeight: 600, color: '#1e293b', fontSize: 12 }}>{alert.resource}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: alert.severity === 'CRITICAL' ? '#dc2626' : alert.severity === 'WARNING' ? '#d97706' : '#475569', fontSize: 13 }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{alert.description}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {alert.acquitted ? (
                        <button className="btn-acquitted" id={`acquit-done-${alert.id}`}>
                          Acquitté
                        </button>
                      ) : canManageAlerts ? (
                        <button
                          className="btn-acquit"
                          id={`acquit-${alert.id}-btn`}
                          onClick={() => handleAcquit(alert.id)}
                        >
                          Acquitter
                        </button>
                      ) : (
                        <div style={{ color: '#64748b', fontSize: 12 }}>Lecture seule</div>
                      )}
                      {canManageAlerts && (
                        <button
                          className="btn-acquitt"
                          style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                          onClick={() => handleTerminate(alert.id)}
                        >
                          Terminer
                        </button>
                      )}
                      <button className="icon-btn" style={{ width: 28, height: 28 }}>
                        <ExternalLink size={13} color="#94a3b8" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Feed footer */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 12, color: '#94a3b8'
          }}>
            <span>EVENTS PROCESSED: 142,901 &nbsp;&nbsp; MTTR: 12.4n</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>PAGE {alertsPage} OF {Math.max(1, totalAlertsPages)}</span>
              <button
                className="icon-btn"
                style={{ width: 26, height: 26 }}
                onClick={() => setAlertsPage(p => Math.max(1, p - 1))}
                disabled={alertsPage === 1}
                id="alerts-prev-btn"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                className="icon-btn"
                style={{ width: 26, height: 26 }}
                onClick={() => setAlertsPage(p => Math.min(totalAlertsPages, p + 1))}
                disabled={alertsPage === totalAlertsPages}
                id="alerts-next-btn"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AlertsPage;
