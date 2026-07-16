import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = ({ children, title, searchPlaceholder, isGlobalMonitoringActive }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} searchPlaceholder={searchPlaceholder} isGlobalMonitoringActive={isGlobalMonitoringActive} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
