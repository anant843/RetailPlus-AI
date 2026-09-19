import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B1020] text-[#F8FAFC]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden transition-[margin] duration-200 ease-out"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '13rem' }}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5 bg-[#0B1020]">
          <div className="w-full space-y-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
