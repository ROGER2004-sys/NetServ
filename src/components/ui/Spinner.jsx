import React from 'react';

const Spinner = ({ size = 24, color = '#2563eb', className = '' }) => {
  return (
    <div 
      className={className}
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}40`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Spinner;
