import React from 'react';

const Badge = ({ children, variant = 'info', className = '' }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success': return 'status-online';
      case 'danger': return 'status-offline';
      case 'warning': return 'status-warning';
      case 'maintenance': return 'status-maintenance';
      case 'info': return 'status-info';
      default: return 'status-info';
    }
  };

  return (
    <span className={`status-badge ${getVariantClass()} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
