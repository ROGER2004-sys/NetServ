import React, { useState, useEffect, createContext } from 'react';
import AppLayout from '../components/layout/AppLayout';
import AIChatbot from '../components/chatbot/AIChatbot';

// Removed initialEquipments import
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Server, Activity, Shield, AlertTriangle,
  TrendingUp, TrendingDown
} from 'lucide-react';

// Export context so other pages can share equipment state
export const EquipmentsContext = createContext(null);

const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0d 0h 0m 0s';
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${mins}m ${secs}s`;
};

// Generate latency data points
const generateLatencyData = () => {
  const now = new Date();
  return Array.from({ length: 20 }, (_, i) => {
    const t = new Date(now - (19 - i) * 12 * 60 * 1000);
    const h = t.getHours().toString().padStart(2, '0');
    const m = t.getMinutes().toString().padStart(2, '0');
    return {
      time: `${h}:${m}`,
      latency: Math.floor(15 + Math.random() * 40 + (i === 12 ? 25 : 0))
    };
  });
};

const DashboardPage = ({ equipments, setEquipments, isGlobalMonitoringActive }) => {
  const [latencyData, setLatencyData] = useState(generateLatencyData());
  const [latencyPeriod, setLatencyPeriod] = useState('24H');
  const [filterStatus, setFilterStatus] = useState('all');

  // Computed KPIs from equipments state
  const totalNodes = equipments.length;
  const onlineNodes = equipments.filter(e => e.status === 'online').length;
  const warningNodes = equipments.filter(e => e.status === 'warning').length;
  const offlineNodes = equipments.filter(e => e.status === 'offline').length;
  const maintenanceNodes = equipments.filter(e => e.status === 'maintenance').length;
  const activeAlerts = warningNodes + offlineNodes;

  // CPU data dynamic computation
  const abbreviate = (name) => {
    if (!name) return 'UNK';
    const p = name.split(/[-_ ]/);
    if (p.length > 1) {
      return (p[0].substring(0, 2) + p[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 3).toUpperCase();
  };

  const cpuData = equipments.map(eq => {
    const rawName = eq.nom || eq.name || 'Generic';
    return {
      name: abbreviate(rawName),
      fullName: rawName,
      value: Number(eq.cpu) || Number(eq.cpu_usage) || 0
    };
  });
  const avgCpu = totalNodes > 0 ? Math.round(cpuData.reduce((s, e) => s + e.value, 0) / totalNodes) : 0;

  const avgRam = totalNodes > 0 ? Math.round(equipments.reduce((s, e) => s + (Number(e.ram) || Number(e.ram_usage) || 0), 0) / totalNodes) : 0;

  const throughput = (42.5 + (Math.random() * 2 - 1)).toFixed(1);

  // System Health Computation
  let systemHealthScore = 100;
  if (avgCpu >= 80) {
    const cpuPenalty = ((avgCpu - 80) / 20) * 25;
    systemHealthScore -= cpuPenalty;
  }
  systemHealthScore -= (10 * activeAlerts); // 10% penalty per active alert
  systemHealthScore = Math.max(0, systemHealthScore);

  let healthColor = '#22c55e'; // Green
  if (systemHealthScore <= 75) {
    healthColor = '#ef4444'; // Red
  } else if (systemHealthScore <= 89) {
    healthColor = '#f97316'; // Orange
  }

  // Simulate live data updates (latency)
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyData(generateLatencyData());
    }, 2000); // 2 second interval for live feel
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status) => {
    if (status === 'online') return 'status-online';
    if (status === 'offline') return 'status-offline';
    if (status === 'warning') return 'status-warning';
    if (status === 'maintenance') return 'status-maintenance';
    return 'status-info';
  };

  return (
    <AppLayout title="NetServMonitor" searchPlaceholder="Search infrastructure, nodes, or IPs..." isGlobalMonitoringActive={isGlobalMonitoringActive}>
      {/* Bandeau état de surveillance globale */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 10, marginBottom: 16,
        background: isGlobalMonitoringActive
          ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.05))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.05))',
        border: `1px solid ${isGlobalMonitoringActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: isGlobalMonitoringActive ? '#22c55e' : '#ef4444',
          display: 'inline-block',
          boxShadow: isGlobalMonitoringActive ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(239,68,68,0.4)',
          animation: isGlobalMonitoringActive ? 'pulse 2s infinite' : 'none'
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: isGlobalMonitoringActive ? '#15803d' : '#b91c1c' }}>
          {isGlobalMonitoringActive
            ? '🟢 Surveillance automatique active — L\'agent pingue tous les équipements'
            : '🔴 Surveillance arrêtée — Mode statique, les statuts ne sont pas mis à jour automatiquement'}
        </span>
      </div>

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>System</span>
        <span>›</span>
        <span style={{ color: '#475569', fontWeight: 500 }}>Dashboard</span>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Active Nodes */}
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>Active Nodes</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{onlineNodes.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <TrendingUp size={12} />
              +{Math.floor(Math.random() * 5 + 8)} from last hr
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #22c55e22, #22c55e11)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Server size={22} color="#22c55e" />
          </div>
        </div>

        {/* Total Throughput */}
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>Total Throughput</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{throughput} GB/s</div>
            <div style={{ fontSize: 12, color: '#f97316', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <TrendingDown size={12} />
              -2% peak
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f122, #6366f111)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={22} color="#6366f1" />
          </div>
        </div>

        {/* System Health */}
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>System Health</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: healthColor }}>{systemHealthScore.toFixed(0)}%</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              <span>⊙</span> Target: 99.99%
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: `linear-gradient(135deg, ${healthColor}22, ${healthColor}11)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={22} color={healthColor} />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>Active Alerts</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: activeAlerts > 5 ? '#ef4444' : '#0f172a' }}>
              {String(activeAlerts).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <TrendingDown size={12} />
              -5 from yesterday
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #ef444422, #ef444411)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
        {/* Network Latency */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Network Latency (Global)</h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Real-time aggregate across all data centers</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['1H', '24H', '7D'].map(p => (
                <button
                  key={p}
                  id={`latency-period-${p}`}
                  onClick={() => setLatencyPeriod(p)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: latencyPeriod === p ? '#1e3a6e' : 'white',
                    color: latencyPeriod === p ? 'white' : '#475569',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={latencyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}ms`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v) => [`${v}ms`, 'Latency']}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#1e3a6e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#1e3a6e' }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <span>0ms</span>
            <span>Peak: {Math.max(...latencyData.map(d => d.latency))}ms</span>
          </div>
        </div>

        {/* Right column: CPU + RAM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* CPU Core Load */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>CPU Core Load</h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{avgCpu}%</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={cpuData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v) => [`${v}%`, 'CPU']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {cpuData.map((entry, i) => {
                    let barColor = '#22c55e'; // Green
                    if (entry.value >= 90) barColor = '#ef4444'; // Red
                    else if (entry.value >= 76) barColor = '#f97316'; // Orange
                    return <Cell key={i} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
              Avg: {avgCpu}% across {totalNodes} nodes
            </div>
          </div>

          {/* RAM Utilization */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>RAM Utilization (Moyenne)</h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>{avgRam}%</span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 4, height: 10, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ width: `${avgRam}%`, height: '100%', background: 'linear-gradient(90deg, #1e3a6e, #3b82f6)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e3a6e', display: 'inline-block' }} />
                Moyenne globale sur {totalNodes} équipement(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Infrastructure Status */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Live Infrastructure Status</h3>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Currently monitoring {totalNodes} nodes</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
              <span className="live-dot" style={{ marginRight: 5 }} />
              <strong>{onlineNodes}</strong> Online
            </div>
            <div style={{ background: '#ffedd5', border: '1px solid #fed7aa', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f97316', marginRight: 5 }} />
              <strong>{warningNodes}</strong> Warning
            </div>
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginRight: 5 }} />
              <strong>{offlineNodes}</strong> Offline
            </div>
            <div style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#6366f1', marginRight: 5 }} />
              <strong>{maintenanceNodes}</strong> Maint.
            </div>
            <select
              className="btn-primary"
              id="filter-view-select"
              style={{ padding: '6px 24px 6px 14px', fontSize: 12, cursor: 'pointer', outline: 'none' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all" style={{ color: '#0f172a', background: '#fff' }}>≡ Filter View</option>
              <option value="online" style={{ color: '#0f172a', background: '#fff' }}>Online</option>
              <option value="offline" style={{ color: '#0f172a', background: '#fff' }}>Offline</option>
              <option value="warning" style={{ color: '#0f172a', background: '#fff' }}>Warning</option>
              <option value="maintenance" style={{ color: '#0f172a', background: '#fff' }}>Maintenance</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>NODE IDENTITY</th>
              <th>IP ADDRESS</th>
              <th>LOAD (CPU/RAM)</th>
              <th>UPTIME</th>
              <th>STATUS</th>
              <th>TYPE</th>
            </tr>
          </thead>
          <tbody>
            {equipments
              .filter(eq => filterStatus === 'all' || eq.status === filterStatus)
              .slice(0, 8)
              .map(eq => (
                <tr key={eq.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, background: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Server size={14} color="#64748b" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{eq.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{eq.type}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{eq.ip}</td>
                  <td>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      CPU: {eq.cpu_usage}% &nbsp;&nbsp; RAM: {eq.ram_usage}%
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: 2, height: 4, width: 100, overflow: 'hidden' }}>
                      <div style={{
                        width: `${eq.cpu_usage}%`, height: '100%',
                        background: eq.cpu_usage > 80 ? '#ef4444' : '#22c55e', borderRadius: 2
                      }} />
                    </div>
                  </td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{formatUptime(eq.uptime)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(eq.status)}`}>
                      {eq.status === 'online' && '●'} {eq.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      {eq.type}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Floating Chatbot */}
      <AIChatbot />
    </AppLayout>
  );
};

export default DashboardPage;
