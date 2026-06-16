import type { LucideIcon } from "lucide-react";

// Mostra um indicador resumido do dashboard com ícone e tom visual.
export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral"
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClasses = {
    neutral: "bg-white text-ink",
    warning: "bg-amber-50 text-amber-900",
    danger: "bg-red-50 text-red-800"
  };

  return (
    <article className={`rounded-lg border border-moss/15 p-4 shadow-soft ${toneClasses[tone]}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-linen">
        <Icon size={20} />
      </div>
      <p className="text-sm text-moss">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </article>
  );
}
