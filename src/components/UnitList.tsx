import type { Unit } from "@/lib/types";

// Exibe casas/unidades cadastradas para uso em pendências e processos.
export function UnitList({ units }: { units: Unit[] }) {
  if (units.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 p-6 text-sm text-moss">
        Nenhuma casa cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {units.map((unit) => (
        <article className="glass-card p-4" key={unit.id}>
          <h2 className="text-lg font-semibold text-ink">{unit.name}</h2>
          <p className="mt-1 text-sm text-moss">{unit.city ?? "Cidade não informada"}</p>
        </article>
      ))}
    </div>
  );
}
