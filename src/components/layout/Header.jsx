import React, { useState } from 'react';
import { Bell, Settings, HelpCircle, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Header = ({ title = 'NetServMonitor', searchPlaceholder = 'Search infrastructure, nodes, or IPs...' }) => {
  const { userProfile, currentUser } = useAuth();
  const { notifications } = useNotifications();
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

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
        <div className="user-avatar">
          <div className="avatar-img">
            {initials}
          </div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
