import React, { useState, useEffect } from 'react';
import { Bell, Settings, HelpCircle, Search, X, Mail, UserCircle2, Briefcase, Phone, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Header = ({ title = 'NetServMonitor', searchPlaceholder = 'Search infrastructure, nodes, or IPs...' }) => {
  const { userProfile, currentUser, updateUserProfile } = useAuth();
  const { notifications } = useNotifications();
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [departmentValue, setDepartmentValue] = useState('');
  const [bioValue, setBioValue] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    setDisplayNameValue(userProfile?.displayName || currentUser?.email?.split('@')[0] || '');
    setEmailValue(userProfile?.email || currentUser?.email || '');
    setPhoneValue(userProfile?.phone || '');
    setDepartmentValue(userProfile?.department || '');
    setBioValue(userProfile?.bio || '');
  }, [userProfile, currentUser]);

  const displayName = userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const role = userProfile?.isAdmin ? 'Root Privilege' : (userProfile?.role || 'Operator');
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="app-header">
      {/* Title */}
      <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a', whiteSpace: 'nowrap', marginRight: '16px' }}>
        {title}
      </div>

      {/* Search */}
      <div className="header-search">
        <Search className="search-icon" size={15} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          id="global-search"
        />
      </div>

      {/* Actions */}
      <div className="header-actions" style={{ position: 'relative' }}>
        <button
          className="icon-btn"
          id="notifications-btn"
          aria-label="Notifications"
          onClick={() => setShowNotifications((open) => !open)}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 16, height: 16,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              lineHeight: 1
            }}>
              {notifications.length}
            </span>
          )}
        </button>

        {/* Notification pane */}
        {showNotifications && (
          <div style={{
            position: 'absolute', top: 52, right: 0,
            width: 320,
            maxHeight: 420,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            boxShadow: '0 25px 70px rgba(15,23,42,0.12)',
            overflow: 'hidden',
            zIndex: 5000
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notifications</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{notifications.length} nouvel(le)(s)</div>
              </div>
              <button
                className="icon-btn"
                style={{ padding: 4 }}
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 18, color: '#64748b', fontSize: 12 }}>Aucune notification pour le moment.</div>
              ) : notifications.slice().reverse().map((item) => (
                <div key={item.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{item.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="icon-btn" id="settings-btn" aria-label="Settings" style={{ marginLeft: 10 }}>
          <Settings size={18} />
        </button>
        <button className="icon-btn" id="help-btn" aria-label="Help" style={{ marginLeft: 10 }}>
          <HelpCircle size={18} />
        </button>

        {/* User Avatar */}
        <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
          <div className="avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#cbd5e1', color: '#0f172a', fontWeight: 700, borderRadius: '50%' }}>
            {initials}
          </div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{role}</div>
          </div>
        </div>
      </div>

      {showProfile && (
        <div style={{
          position: 'absolute', top: 70, right: 20,
          width: 360,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 18,
          boxShadow: '0 25px 70px rgba(15,23,42,0.12)',
          zIndex: 5000,
          padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Profil utilisateur</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Gérez vos informations professionnelles</div>
            </div>
            <button
              className="icon-btn"
              style={{ padding: 4 }}
              onClick={() => setShowProfile(false)}
              aria-label="Close profile"
            >
              <X size={16} />
            </button>
          </div>

          {profileMessage && (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: '#ecfdf3', color: '#047857', fontSize: 12 }}>
              {profileMessage}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Nom d'affichage</label>
              <div style={{ position: 'relative' }}>
                <UserCircle2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={displayNameValue}
                  onChange={(e) => setDisplayNameValue(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Téléphone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="Ex. +33 6 12 34 56 78"
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Département</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={departmentValue}
                  onChange={(e) => setDepartmentValue(e.target.value)}
                  placeholder="Réseaux, Sécurité, Support..."
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Rôle</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={userProfile?.role || role}
                  readOnly
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Biographie</label>
              <div style={{ position: 'relative' }}>
                <FileText size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                <textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  rows={3}
                  placeholder="Décrivez votre mission ou votre expertise"
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={savingProfile || !displayNameValue.trim() || !emailValue.trim()}
            onClick={async () => {
              setSavingProfile(true);
              setProfileMessage('');
              try {
                const updates = {
                  displayName: displayNameValue.trim(),
                  email: emailValue.trim().toLowerCase(),
                  phone: phoneValue.trim(),
                  department: departmentValue.trim(),
                  bio: bioValue.trim()
                };
                await updateUserProfile(updates);
                setProfileMessage('Profil mis à jour avec succès.');
              } catch (err) {
                console.error('Error updating profile:', err);
                setProfileMessage('Impossible de mettre à jour le profil pour le moment.');
              } finally {
                setSavingProfile(false);
              }
            }}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, marginTop: 16 }}
          >
            {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
