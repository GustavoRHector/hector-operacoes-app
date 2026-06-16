import type { Unit } from "@/lib/types";

// Exibe casas/unidades cadastradas para uso em pendências e processos.
export function UnitList({ units }: { units: Unit[] }) {
  if (units.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-moss/25 bg-white p-6 text-sm text-moss">
        Nenhuma casa cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {units.map((unit) => (
        <article className="rounded-lg border border-moss/15 bg-white p-4 shadow-soft" key={unit.id}>
          <h2 className="text-lg font-semibold text-ink">{unit.name}</h2>
          <p className="mt-1 text-sm text-moss">{unit.city ?? "Cidade não informada"}</p>
        </article>
      ))}
    </div>
  );
}
