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
  MoreVertical, TrendingUp, TrendingDown
} from 'lucide-react';

// Export context so other pages can share equipment state
export const EquipmentsContext = createContext(null);

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

const DashboardPage = ({ equipments, setEquipments }) => {
  const [latencyData, setLatencyData] = useState(generateLatencyData());
  const [latencyPeriod, setLatencyPeriod] = useState('24H');
  const [cpuData, setCpuData] = useState([]);

  // Computed KPIs from equipments state
  const totalNodes = equipments.length;
  const onlineNodes = equipments.filter(e => e.status === 'online').length;
  const warningNodes = equipments.filter(e => e.status === 'warning').length;
  const offlineNodes = equipments.filter(e => e.status === 'offline').length;
  const activeAlerts = warningNodes + offlineNodes;
  const avgCpu = totalNodes > 0 ? Math.round(equipments.reduce((s, e) => s + (e.cpu_usage || 0), 0) / totalNodes) : 0;
  const throughput = (42.5 + (Math.random() * 2 - 1)).toFixed(1);
  const systemHealth = totalNodes > 0 ? ((onlineNodes / totalNodes) * 100).toFixed(2) : "0.00";

  // Simulate live data updates (latency and cpu fluctuation)
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyData(generateLatencyData());
      
      // Update CPU Data based on real equipment data + small fluctuation
      if (equipments.length > 0) {
        const newCpuData = equipments.slice(0, 8).map((eq) => {
          const fluctuation = Math.floor(Math.random() * 6) - 3; // -3 to +2
          let val = (eq.cpu_usage || 0) + fluctuation;
          if (val < 0) val = 0;
          if (val > 100) val = 100;
          return { name: eq.name.substring(0, 8), value: val };
        });
        setCpuData(newCpuData);
      } else {
        setCpuData([]);
      }
    }, 2000); // 2 second interval for live feel
    return () => clearInterval(interval);
  }, [equipments]);

  const getStatusClass = (status) => {
    if (status === 'online') return 'status-online';
    if (status === 'offline') return 'status-offline';
    if (status === 'warning') return 'status-warning';
    if (status === 'maintenance') return 'status-maintenance';
    return 'status-info';
  };

  return (
    <AppLayout title="NetServMonitor" searchPlaceholder="Search infrastructure, nodes, or IPs...">
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
            <div style={{ fontSize: 28, fontWeight: 800, color: Number(systemHealth) < 99.9 ? '#ef4444' : '#0f172a' }}>{systemHealth}%</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              <span>⊙</span> Target: 99.99%
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: Number(systemHealth) < 99.9 ? 'linear-gradient(135deg, #ef444422, #ef444411)' : 'linear-gradient(135deg, #14b8a622, #14b8a611)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={22} color={Number(systemHealth) < 99.9 ? '#ef4444' : '#14b8a6'} />
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
                <YAxis tick={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'CPU']} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {cpuData.map((entry, i) => (
                    <Cell key={i} fill={entry.value > 80 ? '#ef4444' : '#22c55e'} />
                  ))}
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
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>RAM Utilization</h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>68.2 GB</span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 4, height: 10, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #1e3a6e, #3b82f6)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e3a6e', display: 'inline-block' }} />
                System (45%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0', display: 'inline-block' }} />
                Cache (25%)
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
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginRight: 5 }} />
              <strong>{offlineNodes + warningNodes}</strong> Error
            </div>
            <button className="btn-primary" id="filter-view-btn" style={{ padding: '6px 14px', fontSize: 12 }}>
              ≡ Filter View
            </button>
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
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {equipments.slice(0, 8).map(eq => (
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
                <td style={{ fontSize: 12 }}>{eq.uptime}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(eq.status)}`}>
                    {eq.status === 'online' && '●'} {eq.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <MoreVertical size={16} />
                  </button>
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
