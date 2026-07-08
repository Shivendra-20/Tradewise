export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--surface-1)] p-6 shadow-[0_0_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-green-500/40 hover:shadow-[0_0_50px_rgba(34,197,94,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}