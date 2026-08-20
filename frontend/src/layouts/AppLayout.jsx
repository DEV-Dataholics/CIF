import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('cif_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('cif_sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary print:bg-white print:text-black">
      <div className="print:hidden">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'} print:ml-0 print:w-full print:block`}>
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="p-6 lg:p-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
