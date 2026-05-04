import React from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* Main content area — offset by sidebar width using CSS, responsive to collapse */}
      <main className="ml-[68px] flex-1 transition-all duration-300 lg:ml-[240px]">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
