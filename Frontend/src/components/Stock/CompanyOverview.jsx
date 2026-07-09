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
  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-6 shadow-lg">

      {/* Header */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-(--text-primary)">
          Company Overview
        </h2>

        <p className="mt-1 text-sm text-(--text-secondary)">
          Basic information about the company.
        </p>
      </div>

      {/* Info Grid */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <InfoCard
          icon={<Building2 size={18} />}
          label="Company"
          value={stock?.companyName || "Reliance Industries Ltd"}
        />

        <InfoCard
          icon={<Landmark size={18} />}
          label="Exchange"
          value={stock?.exchange || "NSE"}
        />

        <InfoCard
          icon={<BriefcaseBusiness size={18} />}
          label="Sector"
          value={stock?.sector || "Oil & Gas"}
        />

        <InfoCard
          icon={<BriefcaseBusiness size={18} />}
          label="Industry"
          value={stock?.industry || "Refineries"}
        />

        <InfoCard
          icon={<Users size={18} />}
          label="Employees"
          value={stock?.employees || "3,90,000+"}
        />

        <InfoCard
          icon={<Calendar size={18} />}
          label="Founded"
          value={stock?.founded || "1973"}
        />

      </div>

      {/* Description */}

      <div className="mt-8 rounded-2xl border border-(--border-color) bg-(--surface-1) p-5">

        <h3 className="mb-3 text-lg font-semibold">
          About Company
        </h3>

        <p className="leading-7 text-(--text-secondary)">
          {stock?.description ||
            "Reliance Industries Limited is one of India's largest multinational companies operating across energy, petrochemicals, retail, telecommunications and digital services. The company is listed on both NSE and BSE and is among the largest constituents of the NIFTY 50 index."}
        </p>

      </div>

      {/* Website */}

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-(--border-color) bg-(--surface-1) p-4">

        <div className="rounded-xl bg-blue-500/10 p-3">
          <Globe size={20} className="text-blue-500" />
        </div>

        <div className="flex-1">
          <p className="text-sm text-(--text-secondary)">
            Official Website
          </p>

          <a
            href={stock?.website || "https://www.ril.com"}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-blue-500 hover:underline"
          >
            {stock?.website || "https://www.ril.com"}
          </a>
        </div>

      </div>

    </div>
  );
}