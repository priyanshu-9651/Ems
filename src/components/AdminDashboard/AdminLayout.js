import React from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main-content">
        {children}
      </main>
    </div>
  );
}