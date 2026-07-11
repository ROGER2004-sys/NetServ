import React, { useState, useEffect } from 'react';
import { Bell, Settings, HelpCircle, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Header = ({ title = 'NetServMonitor', searchPlaceholder = 'Search infrastructure, nodes, or IPs...' }) => {
  const { userProfile, currentUser, updateUserProfile } = useAuth();
  const { notifications } = useNotifications();
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setDisplayNameValue(userProfile?.displayName || currentUser?.email?.split('@')[0] || '');
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
          width: 320,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 25px 70px rgba(15,23,42,0.12)',
          zIndex: 5000,
          padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Mon profil</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Modifier vos informations personnelles</div>
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
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#475569' }}>Nom d'affichage</label>
            <input
              type="text"
              value={displayNameValue}
              onChange={(e) => setDisplayNameValue(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, marginBottom: 6, color: '#475569' }}>Email</div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
              {currentUser?.email || 'Non disponible'}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, marginBottom: 6, color: '#475569' }}>Rôle</div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
              {role}
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={savingProfile || !displayNameValue.trim()}
            onClick={async () => {
              setSavingProfile(true);
              try {
                const updates = { displayName: displayNameValue.trim() };
                await updateUserProfile(updates);
                setShowProfile(false);
              } catch (err) {
                console.error('Error updating profile:', err);
              } finally {
                setSavingProfile(false);
              }
            }}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10 }}
          >
            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
