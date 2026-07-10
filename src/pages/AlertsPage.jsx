import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';

import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  SlidersHorizontal, Bell, Mail, MessageSquare, Bot,
  CheckCircle, Circle, Download, LayoutGrid, Info,
  ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

// Initial alerts feed
const INITIAL_ALERTS = [
  {
    id: 'a1',
    severity: 'CRITICAL',
    timestamp: ':22:01.342',
    resource: 'NY-CORE-SVR-04',
    title: 'Packet Loss Threshold Exceeded',
    description: 'Current: 24.5% | Limit: 5.0%',
    acquitted: false
  },
  {
    id: 'a2',
    severity: 'WARNING',
    timestamp: ':19:44.102',
    resource: 'UK-EDGE-RT-01',
    title: 'BGP Flapping Detected',
    description: '3 resets in the last 120 seconds.',
    acquitted: false
  },
  {
    id: 'a3',
    severity: 'CRITICAL',
    timestamp: ':18:12.001',
    resource: 'DB-CLUSTER-P01',
    title: 'Unresponsive Read Replica',
    description: 'Health check failed for node p01-b.',
    acquitted: false
  },
  {
    id: 'a4',
    severity: 'INFO',
    timestamp: '14:15:33.910',
    resource: 'NOC-SYS-MON',
    title: 'Automated Backup Complete',
    description: 'Success: 2.4TB migrated to S3 Vault.',
    acquitted: true
  },
  {
    id: 'a5',
    severity: 'CRITICAL',
    timestamp: ':10:55.221',
    resource: 'ASIA-HK-EDGE',
    title: 'DDoS Mitigation Triggered',
    description: 'Traffic spike: +400% above baseline.',
    acquitted: false
  },
  {
    id: 'a6',
    severity: 'WARNING',
    timestamp: ':05:12.880',
    resource: 'SVR-GEN-54',
    title: 'Thermal Increase Detected',
    description: 'Chassis temp: 38°C (Max: 40°C)',
    acquitted: true
  }
];

const ALERTS_PER_PAGE = 6;

const AlertsPage = ({ equipments }) => {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [alertsPage, setAlertsPage] = useState(1);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [thresholds, setThresholds] = useState({ cpu: 90, latency: 150, disk: 420 });
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Active critical count
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.acquitted).length;

  // Acquit an alert
  const handleAcquit = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acquitted: true } : a));
  };

  // Load thresholds for selected equipment
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
  }, [selectedEqId, equipments]);

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

  const totalAlertsPages = Math.ceil(alerts.length / ALERTS_PER_PAGE);
  const paginatedAlerts = alerts.slice(
    (alertsPage - 1) * ALERTS_PER_PAGE,
    alertsPage * ALERTS_PER_PAGE
  );

  return (
    <AppLayout title="NetServMonitor" searchPlaceholder="Global search entities...">
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
          <button className="btn-secondary" id="configure-filters-btn" style={{ fontSize: 12, padding: '6px 14px' }}>
            ≡ Configure Filters
          </button>
        </div>
      </div>

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
                disabled={!selectedEqId}
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
                disabled={!selectedEqId}
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
                disabled={!selectedEqId}
                onChange={e => setThresholds(prev => ({ ...prev, disk: Number(e.target.value) }))}
              />
            </div>

            {/* Commit button */}
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
          </div>

          {/* Notification Channels */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={16} color="#64748b" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Notification Channels</h3>
            </div>

            {[
              {
                icon: Mail, name: 'Email Relay',
                sub: 'Active: tech@onda.ma',
                active: true, id: 'channel-email'
              },
              {
                icon: MessageSquare, name: 'SMS Gateway',
                sub: 'Active: +1 (555) NOC-SERV',
                active: true, id: 'channel-sms'
              },
              {
                icon: Bot, name: 'Slack Webhook',
                sub: 'Disconnected',
                active: false, id: 'channel-slack'
              }
            ].map(({ icon: Icon, name, sub, active, id }) => (
              <div key={id} className="notif-channel" id={id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={16} color="#64748b" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>
                  </div>
                </div>
                {active
                  ? <CheckCircle size={18} color="#22c55e" />
                  : <Circle size={18} color="#cbd5e1" />
                }
              </div>
            ))}
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
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{alert.timestamp}</td>
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
                      ) : (
                        <button
                          className="btn-acquit"
                          id={`acquit-${alert.id}-btn`}
                          onClick={() => handleAcquit(alert.id)}
                        >
                          Acquitter
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
              <span>PAGE {alertsPage} OF {totalAlertsPages * 80}</span>
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
