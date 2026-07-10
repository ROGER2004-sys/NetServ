import React, { useState } from 'react';
import { Bell, Settings, HelpCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title = 'NetServMonitor', searchPlaceholder = 'Search infrastructure, nodes, or IPs...' }) => {
  const { userProfile, currentUser } = useAuth();
  const [searchVal, setSearchVal] = useState('');

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
      <div className="header-actions">
        <button className="icon-btn" id="notifications-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="badge-dot" />
        </button>
        <button className="icon-btn" id="settings-btn" aria-label="Settings">
          <Settings size={18} />
        </button>
        <button className="icon-btn" id="help-btn" aria-label="Help">
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
