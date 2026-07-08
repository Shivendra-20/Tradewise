import { useState } from "react";
import DashboardNavbar from "../Dashboard/DashNavbar.jsx";
import Sidebar from "../common/Sidebar.jsx";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-72">
          <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
         <main className="mx-auto w-full max-w-[1700px] px-5 py-6 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}