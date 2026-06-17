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
  // Cor do ícone/valor por tom; o cartão em si é sempre vidro sobre a aurora.
  const toneClasses = {
    neutral: "text-celeste",
    warning: "text-magic-amber",
    danger: "text-magic-red"
  };

  return (
    <article className="glass-card p-4">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md glass-chip ${toneClasses[tone]}`}
      >
        <Icon size={20} />
      </div>
      <p className="text-sm text-moss">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${toneClasses[tone]}`}>{value}</p>
    </article>
  );
}
