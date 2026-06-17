import { createUnitAction } from "@/app/(app)/unidades/actions";

// Renderiza o cadastro de casa/unidade com validação no servidor.
export function UnitCreateForm() {
  return (
    <form action={createUnitAction} className="glass-card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Nome da casa/unidade</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="name"
            placeholder="Hector Pizzaria"
            maxLength={120}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Cidade</span>
          <input
            className="w-full glass-input rounded-md px-3 py-2 outline-none ring-ambered/30 focus:ring-4"
            name="city"
            placeholder="Gramado"
            maxLength={80}
          />
        </label>
      </div>

      <button className="mt-4 btn-primary rounded-md px-4 py-2 text-sm font-medium">
        Criar casa
      </button>
    </form>
  );
}
