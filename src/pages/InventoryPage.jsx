import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Plus, Edit2, Eye, Trash2, PauseCircle,
  Filter, Download, Server, CheckCircle, AlertTriangle, XCircle,
  ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const getStatusClass = (status) => {
  if (status === 'online') return 'status-online';
  if (status === 'offline') return 'status-offline';
  if (status === 'warning') return 'status-warning';
  if (status === 'maintenance') return 'status-maintenance';
  return 'status-info';
};

const getStatusDot = (status) => {
  if (status === 'online') return '#22c55e';
  if (status === 'offline') return '#ef4444';
  if (status === 'warning') return '#f97316';
  if (status === 'maintenance') return '#6366f1';
  return '#64748b';
};

const EMPTY_FORM = {
  name: '', ip: '', type: '', status: 'online',
  cpu_usage: '', ram_usage: '', uptime: '0d 0h 0m'
};

const InventoryPage = ({ equipments, setEquipments }) => {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered equipments
  const filtered = equipments.filter(eq => {
    const matchStatus = filterStatus === 'all' || eq.status === filterStatus;
    const matchSearch = !searchTerm ||
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.ip.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats
  const totalAssets = equipments.length;
  const onlineCount = equipments.filter(e => e.status === 'online').length;
  const alertCount = equipments.filter(e => e.status === 'warning').length;
  const criticalCount = equipments.filter(e => e.status === 'offline').length;

  // Add equipment
  const handleAdd = async () => {
    try {
      const newEq = {
        ...form,
        lastSync: 'Just now',
        cpu_threshold: 90,
        latency_threshold: 150,
        disk_threshold: 420
      };
      await addDoc(collection(db, 'equipements'), newEq);
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      showNotif(`✅ Équipement "${newEq.name}" ajouté avec succès.`);
    } catch (err) {
      console.error("Error adding doc:", err);
      showNotif(`❌ Erreur lors de l'ajout`, 'warning');
    }
  };

  // Edit equipment
  const openEdit = (eq) => {
    setSelectedEq(eq);
    setForm({ ...eq });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      // Avoid passing 'id' inside the document data when updating
      const { id, ...dataToUpdate } = form;
      await updateDoc(doc(db, 'equipements', selectedEq.id), dataToUpdate);
      setShowEditModal(false);
      showNotif(`✅ Équipement "${form.name}" modifié avec succès.`);
    } catch (err) {
      console.error("Error updating doc:", err);
      showNotif(`❌ Erreur lors de la modification`, 'warning');
    }
  };

  // Delete
  const handleDelete = async (id, name) => {
    if (window.confirm(`Supprimer "${name}" de l'inventaire ?`)) {
      try {
        await deleteDoc(doc(db, 'equipements', id));
        showNotif(`🗑️ Équipement "${name}" supprimé.`, 'warning');
      } catch (err) {
        console.error("Error deleting doc:", err);
      }
    }
  };

  // View details
  const openView = (eq) => {
    setSelectedEq(eq);
    setShowViewModal(true);
  };

  // Maintenance mode
  const toggleMaintenance = async (id, name) => {
    const eq = equipments.find(e => e.id === id);
    if (!eq) return;
    const newStatus = eq.status === 'maintenance' ? 'online' : 'maintenance';
    try {
      await updateDoc(doc(db, 'equipements', id), { status: newStatus });
      showNotif(`🔧 "${name}" passé en mode ${newStatus === 'maintenance' ? 'Maintenance' : 'Online'}.`);
    } catch (err) {
      console.error("Error toggling maintenance:", err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('_usage')) {
      const filteredValue = value.replace(/[^0-9]/g, '');
      setForm(prev => ({ ...prev, [name]: filteredValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout title="Inventory" searchPlaceholder="Rechercher un actif ou une IP...">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: 16
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={28} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Accès Restreint</h2>
          <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 360 }}>
            La gestion de l'inventaire est réservée aux <strong>Administrateurs Système</strong>.
            Contactez votre administrateur pour obtenir les droits nécessaires.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Inventory" searchPlaceholder="Rechercher un actif ou une IP...">
      {/* Notification toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 300,
          background: notification.type === 'warning' ? '#fef3c7' : '#dcfce7',
          border: `1px solid ${notification.type === 'warning' ? '#fde68a' : '#bbf7d0'}`,
          borderRadius: 10, padding: '12px 18px',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          color: notification.type === 'warning' ? '#92400e' : '#15803d',
          animation: 'slideUp 0.3s'
        }}>
          {notification.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, display: 'flex', gap: 6 }}>
        <span>System Core</span><span>/</span><span style={{ color: '#475569', fontWeight: 500 }}>Inventory</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Gestion des Équipements</h1>
        <button
          id="add-equipment-btn"
          className="btn-primary"
          onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}
        >
          <Plus size={16} />
          Ajouter un équipement
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Assets', value: totalAssets, color: '#3b82f6', icon: Server },
          { label: 'Online', value: onlineCount, color: '#22c55e', icon: CheckCircle },
          { label: 'Alerts', value: alertCount, color: '#f97316', icon: AlertTriangle },
          { label: 'Critical', value: criticalCount, color: '#ef4444', icon: XCircle }
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="kpi-card">
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {value.toLocaleString()}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: `${color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={20} color={color} />
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-secondary" id="filter-btn" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Filter size={13} /> Filter
          </button>
          <button className="btn-secondary" id="export-btn" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Download size={13} /> Export
          </button>
          <input
            className="form-input"
            style={{ width: 220, marginLeft: 8, padding: '7px 12px', fontSize: 12 }}
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            id="inventory-search"
          />
          <select
            className="form-select"
            style={{ width: 140, padding: '7px 10px', fontSize: 12 }}
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            id="filter-status-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} assets
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>NAME</th>
              <th>IP ADDRESS</th>
              <th>TYPE</th>
              <th>LAST SYNC</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(eq => (
              <tr key={eq.id}>
                <td>
                  <span className={`status-badge ${getStatusClass(eq.status)}`}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: getStatusDot(eq.status), display: 'inline-block'
                    }} />
                    {eq.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: '#1e293b' }}>{eq.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{eq.ip}</td>
                <td>{eq.type}</td>
                <td style={{ color: eq.lastSync === '2 hours ago' ? '#ef4444' : '#64748b', fontWeight: eq.lastSync === '2 hours ago' ? 600 : 400 }}>
                  {eq.lastSync}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      id={`edit-${eq.id}-btn`}
                      onClick={() => openEdit(eq)}
                      className="icon-btn"
                      title="Modifier"
                      style={{ width: 28, height: 28, color: '#64748b' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      id={`view-${eq.id}-btn`}
                      onClick={() => openView(eq)}
                      className="icon-btn"
                      title="Voir"
                      style={{ width: 28, height: 28, color: '#64748b' }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      id={`maintenance-${eq.id}-btn`}
                      onClick={() => toggleMaintenance(eq.id, eq.name)}
                      className="icon-btn"
                      title={eq.status === 'maintenance' ? 'Reprendre' : 'Mode Maintenance'}
                      style={{ width: 28, height: 28, color: eq.status === 'maintenance' ? '#6366f1' : '#64748b' }}
                    >
                      <PauseCircle size={14} />
                    </button>
                    <button
                      id={`delete-${eq.id}-btn`}
                      onClick={() => handleDelete(eq.id, eq.name)}
                      className="icon-btn"
                      title="Supprimer"
                      style={{ width: 28, height: 28, color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
          <div className="pagination">
            <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} id="page-first-btn"><ChevronFirst size={14} /></button>
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} id="page-prev-btn"><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  id={`page-${page}-btn`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && <span className="page-btn" style={{ cursor: 'default' }}>...</span>}
            {totalPages > 5 && (
              <button className="page-btn" onClick={() => setCurrentPage(totalPages)} id={`page-${totalPages}-btn`}>{totalPages}</button>
            )}
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} id="page-next-btn"><ChevronRight size={14} /></button>
            <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} id="page-last-btn"><ChevronLast size={14} /></button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="➕ Ajouter un équipement">
        <EquipmentForm
          onSubmit={handleAdd}
          submitLabel="Ajouter"
          form={form}
          onChange={handleFormChange}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`✏️ Modifier — ${selectedEq?.name}`}>
        <EquipmentForm
          onSubmit={handleEdit}
          submitLabel="Enregistrer"
          form={form}
          onChange={handleFormChange}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`👁️ Détails — ${selectedEq?.name}`}>
        {selectedEq && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Nom', selectedEq.name],
              ['Adresse IP', selectedEq.ip],
              ['Type', selectedEq.type],
              ['Statut', selectedEq.status.toUpperCase()],
              ['CPU Usage', `${selectedEq.cpu_usage}%`],
              ['RAM Usage', `${selectedEq.ram_usage}%`],
              ['Uptime', selectedEq.uptime],
              ['Dernière sync', selectedEq.lastSync]
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};

const EquipmentForm = ({ onSubmit, submitLabel, form, onChange, onCancel }) => (
  <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div className="form-group" style={{ gridColumn: '1/-1' }}>
        <label className="form-label">Nom de l'équipement</label>
        <input className="form-input" name="name" value={form.name} onChange={onChange} placeholder="Ex: Core-Router-01" required />
      </div>
      <div className="form-group">
        <label className="form-label">Adresse IP</label>
        <input className="form-input" name="ip" value={form.ip} onChange={onChange} placeholder="192.168.1.1" required />
      </div>
      <div className="form-group">
        <label className="form-label">Type</label>
        <input className="form-input" name="type" value={form.type} onChange={onChange} placeholder="Cisco Catalyst 9500" required />
      </div>
      <div className="form-group">
        <label className="form-label">Statut</label>
        <select className="form-select" name="status" value={form.status} onChange={onChange}>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="warning">Warning</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">CPU Usage (%)</label>
        <input className="form-input" type="text" inputMode="numeric" pattern="[0-9]*" name="cpu_usage" value={form.cpu_usage} onChange={onChange} />
      </div>
      <div className="form-group">
        <label className="form-label">RAM Usage (%)</label>
        <input className="form-input" type="text" inputMode="numeric" pattern="[0-9]*" name="ram_usage" value={form.ram_usage} onChange={onChange} />
      </div>
      <div className="form-group" style={{ gridColumn: '1/-1' }}>
        <label className="form-label">Uptime</label>
        <input className="form-input" name="uptime" value={form.uptime} onChange={onChange} placeholder="12d 4h 22m" />
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
      <button type="button" className="btn-secondary" onClick={onCancel}>
        Annuler
      </button>
      <button type="button" className="btn-primary" onClick={onSubmit} id="eq-form-submit-btn">
        {submitLabel}
      </button>
    </div>
  </>
);

export default InventoryPage;
