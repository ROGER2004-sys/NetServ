import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { FileText, Download, Calendar, Cloud, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const SLAGauge = ({ value, target }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const isBreach = value < target;
  const color = isBreach ? '#ef4444' : '#22c55e';

  return (
    <div className="sla-gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background ring */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        {/* Progress ring */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s' }}
        />
      </svg>
      <div className="gauge-text">
        <div style={{
          fontSize: 20, fontWeight: 800,
          color: isBreach ? '#ef4444' : '#22c55e',
          lineHeight: 1,
          animation: isBreach ? 'pulse 1s ease infinite' : 'none'
        }}>
          {value}%
        </div>
        <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', fontWeight: 500, marginTop: 3 }}>
          TEMPS DE FONCTIONNEMENT
        </div>
      </div>
    </div>
  );
};

const REPORT_TYPES = [
  'Performance Infrastructure (Standard)',
  'Rapport SLA Complet',
  'Audit de Sécurité',
  'Inventaire Réseau'
];

const ReportsPage = ({ equipments, isGlobalMonitoringActive }) => {
  const [period, setPeriod] = useState('TRIMESTRE');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  const [alerts, setAlerts] = useState([]);
  const [slaTarget, setSlaTarget] = useState(99.95);

  // Load Alerts
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const fetchedAlerts = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let ts = data.timestamp;
        let dateObj = null;
        if (ts?.toDate) {
            dateObj = ts.toDate();
        } else if (typeof ts === 'number') {
            dateObj = new Date(ts);
        } else if (typeof ts === 'string') {
            const parsed = Number(String(ts).replace(/[^0-9]/g, ''));
            if (!Number.isNaN(parsed)) dateObj = new Date(parsed);
        }
        
        return {
          id: docSnap.id,
          severity: data.severity || 'INFO',
          date: dateObj || new Date(),
          resource: data.resource || 'Unknown',
          title: data.title || 'No title',
          description: data.description || '',
          acquitted: Boolean(data.acquitted)
        };
      });
      setAlerts(fetchedAlerts);
    });
    return () => unsubscribe();
  }, []);

  // Load SLA Target
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sla'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().target !== undefined) {
        setSlaTarget(Number(docSnap.data().target));
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter alerts based on selected period
  const filteredAlerts = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    let endDate = new Date();

    if (period === '7J') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30J') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'TRIMESTRE') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (period === 'CUSTOM') {
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    return alerts.filter(a => a.date >= startDate && a.date <= endDate);
  }, [alerts, period, customStartDate, customEndDate]);

  // Generate Incident Data dynamically
  const incidentData = useMemo(() => {
    const monthsData = {};
    
    // Initialiser les mois présents dans la période
    filteredAlerts.forEach(alert => {
        const monthKey = alert.date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        if (!monthsData[monthKey]) {
            monthsData[monthKey] = { month: monthKey, critique: 0, major: 0, minor: 0, order: alert.date.getTime() };
        }
        if (alert.severity === 'CRITICAL') monthsData[monthKey].critique++;
        else if (alert.severity === 'WARNING') monthsData[monthKey].major++;
        else monthsData[monthKey].minor++; // INFO and others
    });

    return Object.values(monthsData).sort((a, b) => a.order - b.order).map(item => ({
        month: item.month,
        critique: item.critique,
        major: item.major,
        minor: item.minor
    }));
  }, [filteredAlerts]);

  // Compute dynamic SLA from equipment states
  const slaValue = useMemo(() => {
    const total = equipments.length;
    if (total === 0) return 100;
    const online = equipments.filter(e => e.status === 'online' || e.status === 'warning').length;
    const raw = (online / total) * 100;
    return Math.round(raw * 100) / 100; // Round to 2 decimal places, no clamping
  }, [equipments]);

  const isSLABreach = slaValue < slaTarget;

  const handleExportPDF = async () => {
    setIsGenerating(true);
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 1500));

    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

      // Header bar
      doc.setFillColor(10, 22, 40);
      doc.rect(0, 0, 210, 35, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE REPORT', 15, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Infrastructure Network Analysis', 15, 27);

      // Cloud icon placeholder
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(175, 8, 22, 18, 3, 3, 'F');

      // Date
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text(`Généré le: ${today}`, 15, 44);

      // Green accent line
      doc.setFillColor(34, 197, 94);
      doc.rect(15, 48, 4, 16, 'F');

      // Section 1
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Résumé Exécutif', 23, 57);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const summary = `La période sélectionnée a montré un taux de disponibilité de ${slaValue}% (objectif: ${slaTarget}%), ${isSLABreach ? 'une rupture de SLA a été détectée.' : "l'objectif SLA est atteint."} ${equipments.filter(e => e.status === 'online').length} équipements sur ${equipments.length} sont opérationnels. Au cours de cette période, ${filteredAlerts.length} incidents ont été enregistrés.`;
      const lines = doc.splitTextToSize(summary, 180);
      doc.text(lines, 23, 66);

      // Section 2 — KPIs
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 90, 180, 45, 4, 4, 'F');
      doc.setFillColor(34, 197, 94);
      doc.rect(15, 90, 4, 45, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Indicateurs Clés de Performance', 23, 100);

      const kpis = [
        ['Disponibilité SLA', `${slaValue}%`, isSLABreach ? 'BREACH' : 'OK'],
        ['Nœuds Actifs', equipments.filter(e => e.status === 'online').length.toString(), '—'],
        ['Total Incidents', filteredAlerts.length.toString(), '—'],
        ['Type de Rapport', reportType, '—'],
        ['Période', period === 'CUSTOM' ? `${customStartDate} à ${customEndDate}` : period, '—'],
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      kpis.forEach(([key, val, status], i) => {
        const y = 110 + i * 7;
        doc.setTextColor(100, 116, 139);
        doc.text(key + ':', 23, y);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(val, 90, y);
        doc.setFont('helvetica', 'normal');
        if (status !== '—') {
          doc.setTextColor(status === 'OK' ? 34 : 239, status === 'OK' ? 197 : 68, status === 'OK' ? 94 : 68);
          doc.text(status, 145, y);
        }
      });

      // Section 3 — Incidents
      doc.setFillColor(10, 22, 40);
      doc.rect(0, 145, 210, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Répartition des Incidents par Mois', 15, 153);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const headers = ['Mois', 'Critique', 'Major', 'Mineur', 'Total'];
      const colWidths = [25, 30, 30, 30, 30];
      let startX = 15;
      headers.forEach((h, i) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(startX, 160, colWidths[i], 8, 'F');
        doc.setTextColor(100, 116, 139);
        doc.text(h, startX + 3, 165);
        startX += colWidths[i];
      });

      incidentData.forEach((row, rowIdx) => {
        const y = 168 + rowIdx * 8;
        startX = 15;
        [row.month, row.critique, row.major, row.minor, row.critique + row.major + row.minor].forEach((cell, i) => {
          doc.setFillColor(rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 250, rowIdx % 2 === 0 ? 255 : 252);
          doc.rect(startX, y, colWidths[i], 7, 'F');
          doc.setTextColor(15, 23, 42);
          doc.text(String(cell), startX + 3, y + 5);
          startX += colWidths[i];
        });
      });
      
      if (incidentData.length === 0) {
          doc.text("Aucun incident sur cette période.", 18, 173);
      }

      // Footer
      doc.setFillColor(10, 22, 40);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text('NetServMonitor — Enterprise Network Visibility & Performance Management', 15, 291);
      doc.text(`V2.4.0 | Confidentiel`, 175, 291);

      doc.save(`NetServMonitor_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate generation

    try {
      const headers = ['Mois', 'Critique', 'Major', 'Mineur', 'Total'];
      const rows = incidentData.map(row => [
        row.month,
        row.critique,
        row.major,
        row.minor,
        row.critique + row.major + row.minor
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `NetServMonitor_Incidents_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('CSV generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout title="NetServMonitor" searchPlaceholder="Rechercher des rapports ou logs..." isGlobalMonitoringActive={isGlobalMonitoringActive}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, display: 'flex', gap: 6 }}>
        <span>Analytics</span><span>›</span><span style={{ color: '#475569', fontWeight: 500 }}>Reports Center</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Analyses & Rapports</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Générez des rapports de performance et d'audit pour l'infrastructure{' '}
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Enterprise Node</span>.
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {[
                { label: '7\nJours', value: '7J' },
                { label: '30\nJours', value: '30J' },
                { label: 'Dernier\nTrimestre', value: 'TRIMESTRE' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  id={`period-${value}-btn`}
                  onClick={() => setPeriod(value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: period === value ? '#1e3a6e' : 'white',
                    color: period === value ? 'white' : '#475569',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.2
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                id="period-custom-btn"
                onClick={() => setPeriod('CUSTOM')}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: period === 'CUSTOM' ? '#1e3a6e' : 'white',
                  color: period === 'CUSTOM' ? 'white' : '#475569',
                  fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Calendar size={13} /> Personnalisé
              </button>
            </div>
            
            {period === 'CUSTOM' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', animation: 'fadeIn 0.2s' }}>
                    <input 
                        type="date" 
                        value={customStartDate} 
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>à</span>
                    <input 
                        type="date" 
                        value={customEndDate} 
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                </div>
            )}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* SLA Gauge */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Disponibilité SLA</h3>

          {isSLABreach && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 14px',
              fontSize: 12, fontWeight: 600, color: '#dc2626',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
            }}>
              🚨 RUPTURE DE SLA DÉTECTÉE — En dessous de l'objectif
            </div>
          )}

          <SLAGauge value={slaValue} target={slaTarget} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>OBJECTIF</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{slaTarget}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={14} color={isSLABreach ? '#ef4444' : '#22c55e'} />
                <span style={{ fontSize: 14, fontWeight: 700, color: isSLABreach ? '#ef4444' : '#22c55e' }}>
                  {isSLABreach ? 'BREACH' : 'OK'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Distribution Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Répartition des Incidents</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Analyse comparative par sévérité ({period}).</p>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              {[
                { color: '#ef4444', label: 'Critique' },
                { color: '#f97316', label: 'Major' },
                { color: '#93c5fd', label: 'Mineur' }
              ].map(({ color, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {incidentData.length > 0 ? (
                <BarChart data={incidentData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="critique" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="major" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="minor" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
            ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Aucun incident détecté sur cette période
                </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Export + Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
        {/* Export parameters */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Paramètres d'export</h3>

          <div className="form-group">
            <label className="form-label">TYPE DE RAPPORT</label>
            <select
              id="report-type-select"
              className="form-select"
              style={{ fontSize: 12 }}
              value={reportType}
              onChange={e => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">FORMAT DE SORTIE</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {/* PDF */}
              <div 
                onClick={() => setExportFormat('PDF')}
                style={{
                  flex: 1, border: exportFormat === 'PDF' ? '2px solid #1e3a6e' : '1.5px solid #e2e8f0', 
                  borderRadius: 10, padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
                  background: exportFormat === 'PDF' ? '#eff6ff' : 'white'
              }}>
                <FileText size={22} color={exportFormat === 'PDF' ? '#1e3a6e' : '#64748b'} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: exportFormat === 'PDF' ? '#1e3a6e' : '#64748b' }}>PDF Pro</div>
              </div>
              {/* Excel / CSV */}
              <div 
                onClick={() => setExportFormat('CSV')}
                style={{
                  flex: 1, border: exportFormat === 'CSV' ? '2px solid #1e3a6e' : '1.5px solid #e2e8f0', 
                  borderRadius: 10, padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
                  background: exportFormat === 'CSV' ? '#eff6ff' : 'white', color: exportFormat === 'CSV' ? '#1e3a6e' : '#64748b'
              }}>
                <div style={{
                  width: 22, height: 22, margin: '0 auto 4px',
                  background: exportFormat === 'CSV' ? '#dbeafe' : '#f1f5f9', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: exportFormat === 'CSV' ? '#1e3a6e' : '#475569'
                }}>XLS</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Excel /<br />CSV</div>
              </div>
            </div>
          </div>

          <button
            id="export-pdf-btn"
            onClick={exportFormat === 'PDF' ? handleExportPDF : handleExportCSV}
            disabled={isGenerating}
            style={{
              width: '100%', padding: '11px',
              background: isGenerating ? '#94a3b8' : 'linear-gradient(135deg, #0a1628, #1e3a6e)',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 8
            }}
          >
            {isGenerating ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Génération en cours...
              </>
            ) : exportSuccess ? (
              `✅ ${exportFormat} téléchargé !`
            ) : (
              <>
                <Download size={15} />
                Générer & Télécharger {exportFormat}
              </>
            )}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }
                   @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>

        {/* Preview panel */}
        <div className="card" style={{ background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
          {/* Preview document */}
          <div style={{
            background: 'white', borderRadius: 8, padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            maxWidth: 480
          }}>
            {/* Report header */}
            <div style={{
              background: 'linear-gradient(135deg, #0a1628, #1e3a6e)',
              borderRadius: 8, padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: 1 }}>EXECUTIVE REPORT</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Infrastructure Network Analysis</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Cloud size={20} color="rgba(255,255,255,0.8)" />
              </div>
            </div>

            {/* Section 1 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 3, background: '#22c55e', borderRadius: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>1. Résumé Exécutif</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                  La période sélectionnée a montré un taux de disponibilité de <strong style={{ color: isSLABreach ? '#dc2626' : '#22c55e' }}>{slaValue}%</strong>.
                  {isSLABreach ? (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}> ⚠ Rupture de SLA détectée.</span>
                  ) : (
                    <span> Objectif de {slaTarget}% atteint.</span>
                  )}
                  <br/>Total incidents enregistrés: <strong>{filteredAlerts.length}</strong>.
                </div>
              </div>
            </div>

            {/* KPI mini table */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
              {[
                ['SLA Disponibilité', `${slaValue}%`, isSLABreach ? '#dc2626' : '#22c55e'],
                ['Équipements Online', equipments.filter(e => e.status === 'online').length, '#1e3a6e'],
                ['Total Incidents', filteredAlerts.length, '#f97316'],
                ['Période', period === 'CUSTOM' ? `${customStartDate || '...'} à ${customEndDate || '...'}` : period, '#475569'],
              ].map(([k, v, color]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#94a3b8' }}>{k}</span>
                  <span style={{ fontWeight: 700, color }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
