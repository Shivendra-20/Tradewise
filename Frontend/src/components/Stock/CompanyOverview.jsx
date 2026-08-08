import {
  Building2,
  Globe,
  BriefcaseBusiness,
  Users,
  Calendar,
  Landmark,
} from "lucide-react";

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-4 transition hover:bg-(--surface-2)">
      <div className="flex items-center gap-2 text-(--text-secondary)">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <p className="mt-3 text-base font-semibold text-(--text-primary)">
        {value || "-"}
      </p>
    </div>
  );
}

export default function CompanyOverview({ stock }) {
  const companyName = stock?.companyName || stock?.name || stock?.symbol || "-";
  const exchange = stock?.exchange || "-";
  const sector = stock?.sector || "-";
  const industry = stock?.industry || "-";
  const employees = stock?.employees || "-";
  const founded = stock?.founded || "-";
  const description = stock?.description || "No description available.";
  const website = stock?.website || "#";

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-6 shadow-lg">

      {/* Header */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-(--text-primary)">Company Overview</h2>
        <p className="mt-1 text-sm text-(--text-secondary)">Basic information about the company.</p>
      </div>

      {/* Info Grid */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <InfoCard icon={<Building2 size={18} />} label="Company" value={companyName} />

        <InfoCard icon={<Landmark size={18} />} label="Exchange" value={exchange} />

        <InfoCard icon={<BriefcaseBusiness size={18} />} label="Sector" value={sector} />

        <InfoCard icon={<BriefcaseBusiness size={18} />} label="Industry" value={industry} />

        <InfoCard icon={<Users size={18} />} label="Employees" value={employees} />

        <InfoCard icon={<Calendar size={18} />} label="Founded" value={founded} />

      </div>

      {/* Description */}

      <div className="mt-8 rounded-2xl border border-(--border-color) bg-(--surface-1) p-5">

        <h3 className="mb-3 text-lg font-semibold">About Company</h3>

        <p className="leading-7 text-(--text-secondary)">{description}</p>

      </div>

      {/* Website */}

      {website && website !== "#" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-(--border-color) bg-(--surface-1) p-4">

          <div className="rounded-xl bg-blue-500/10 p-3">
            <Globe size={20} className="text-blue-500" />
          </div>

          <div className="flex-1">
            <p className="text-sm text-(--text-secondary)">Official Website</p>

            <a href={website} target="_blank" rel="noreferrer" className="font-semibold text-blue-500 hover:underline">
              {website}
            </a>
          </div>

        </div>
      )}

    </div>
  );
}
