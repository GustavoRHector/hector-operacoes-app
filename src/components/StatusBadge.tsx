import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  waiting: "Aguardando",
  done: "Concluído",
  ok: "Em dia",
  due_soon: "Próximo",
  expired: "Vencido",
  renewing: "Em renovação",
  renewed: "Renovado"
};

// Tons translúcidos sobre vidro escuro: borda + fundo na mesma cor com baixa opacidade.
const styles: Record<string, string> = {
  todo: "bg-white/10 text-white border border-white/20",
  doing: "bg-celeste/15 text-celeste border border-celeste/40",
  waiting: "bg-magic-amber/15 text-magic-amber border border-magic-amber/40",
  done: "bg-magic-green/15 text-magic-green border border-magic-green/40",
  ok: "bg-magic-green/15 text-magic-green border border-magic-green/40",
  due_soon: "bg-magic-amber/15 text-magic-amber border border-magic-amber/40",
  expired: "bg-magic-red/15 text-magic-red border border-magic-red/45",
  renewing: "bg-celeste/15 text-celeste border border-celeste/40",
  renewed: "bg-white/10 text-moss border border-white/20"
};

// Mostra status de forma padronizada para reduzir interpretação errada da equipe.
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styles[status])}>
      {labels[status] ?? status}
    </span>
  );
}
