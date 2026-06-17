import Link from "next/link";
import type { CalendarEvent } from "@/lib/types";
import { toDateKeyBR, toTimeBR } from "@/lib/utils";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

// Exibe os compromissos do mês em grade, agrupados por dia (fuso de São Paulo).
// year/month definem o mês exibido; a navegação é feita por links na página.
export function CalendarMonth({
  events,
  year,
  month
}: {
  events: CalendarEvent[];
  year: number;
  month: number; // 1-12
}) {
  // Agrupa os eventos por dia para montar cada célula sem recalcular na grade.
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = toDateKeyBR(event.starts_at);
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayKey = toDateKeyBR(new Date().toISOString());

  // Monta a sequência de células: espaços em branco antes do dia 1 e os dias do mês.
  const cells: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, key });
  }

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const monthParam = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

  return (
    <section className="glass-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
          href={`/agenda?month=${monthParam(prev.y, prev.m)}`}
        >
          ‹ Anterior
        </Link>
        <h2 className="text-lg font-semibold text-ink">
          {monthLabels[month - 1]} de {year}
        </h2>
        <Link
          className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
          href={`/agenda?month=${monthParam(next.y, next.m)}`}
        >
          Próximo ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-moss">
        {weekdayLabels.map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div className="min-h-20 rounded-md bg-mist/40" key={`empty-${index}`} />;
          }

          const dayEvents = eventsByDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;

          return (
            <div
              className={`min-h-20 rounded-md border p-1 text-left ${
                isToday ? "border-ambered bg-ambered/10" : "border-moss/10"
              }`}
              key={cell.key}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-ink" : "text-moss"}`}>
                {cell.day}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <Link
                    className="block truncate rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-medium text-white transition hover:bg-white/25"
                    href={`/agenda/${event.id}`}
                    key={event.id}
                    title={event.title}
                  >
                    {toTimeBR(event.starts_at)} {event.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
