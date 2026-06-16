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

const styles: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  doing: "bg-blue-100 text-blue-700",
  waiting: "bg-amber-100 text-amber-800",
  done: "bg-green-100 text-green-700",
  ok: "bg-green-100 text-green-700",
  due_soon: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-700",
  renewing: "bg-blue-100 text-blue-700",
  renewed: "bg-mist text-moss"
};

// Mostra status de forma padronizada para reduzir interpretação errada da equipe.
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styles[status])}>
      {labels[status] ?? status}
    </span>
  );
}
