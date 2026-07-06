export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-surface
        border border-border
        rounded-card
        p-6
        transition-all
        duration-300
        hover:bg-surface-hover
        hover:border-primary/40
        hover:shadow-card
        ${className}
      `}
    >
      {children}
    </div>
  );
}