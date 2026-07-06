import DashboardNavbar from "../Dashboard/DashNavbar.jsx";

export default function DashboardLayout({
  children,
}) {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">

      <DashboardNavbar />

      <main className="max-w-[1600px] mx-auto px-8 py-8">

        {children}

      </main>

    </div>
  );
}