"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteGoogleEventAction, updateGoogleEventAction } from "@/app/(app)/agenda/actions";
import { toDateKeyBR, toDateTimeLocalBR, toTimeBR } from "@/lib/utils";

// Evento achatado para exibição. Campos extras alimentam o modal de detalhes;
// editLink (interno) e googleLink (Google) definem as ações disponíveis.
export type CalendarDisplayEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  source: "internal" | "google";
  event_type: string | null;
  responsible_name: string | null;
  description: string | null;
  editLink: string | null;
  googleLink: string | null;
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const weekdayFull = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
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

const pad = (n: number) => String(n).padStart(2, "0");

// Operações sobre chaves "YYYY-MM-DD" como datas de calendário puras (UTC).
function partsOf(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}
function addDays(key: string, days: number) {
  const { y, m, d } = partsOf(key);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function addMonths(key: string, n: number) {
  const { y, m } = partsOf(key);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-01`;
}
function weekdayOf(key: string) {
  const { y, m, d } = partsOf(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Data por extenso no fuso de São Paulo, para o cabeçalho do modal.
function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(iso));
}

type View = "month" | "week" | "day";

// Pílula de um evento na grade; o clique abre o modal (não navega de imediato).
// large=true (semana) mostra hora e título em linhas separadas, sem cortar o texto.
function EventChip({
  event,
  onSelect,
  large = false
}: {
  event: CalendarDisplayEvent;
  onSelect: (e: CalendarDisplayEvent) => void;
  large?: boolean;
}) {
  const tone =
    event.source === "google"
      ? "bg-celeste/25 text-white hover:bg-celeste/40"
      : "bg-white/15 text-white hover:bg-white/25";

  if (large) {
    return (
      <button
        className={`block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition ${tone}`}
        onClick={() => onSelect(event)}
        title={event.title}
        type="button"
      >
        <span className="block text-[10px] opacity-80">{toTimeBR(event.starts_at)}</span>
        <span className="block break-words leading-snug">{event.title}</span>
      </button>
    );
  }

  return (
    <button
      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition ${tone}`}
      onClick={() => onSelect(event)}
      title={event.title}
      type="button"
    >
      {toTimeBR(event.starts_at)} {event.title}
    </button>
  );
}

// Calendário com visões de mês, semana e dia. Navegação e detalhes acontecem
// no próprio componente (cliente), sem recarregar nem trocar de aba.
export function CalendarView({
  events,
  initialCursor,
  todayKey
}: {
  events: CalendarDisplayEvent[];
  initialCursor: string;
  todayKey: string;
}) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(initialCursor);
  const [selected, setSelected] = useState<CalendarDisplayEvent | null>(null);

  // Agrupa por dia (chave SP) e ordena por horário dentro do dia.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarDisplayEvent[]>();
    for (const event of events) {
      const key = toDateKeyBR(event.starts_at);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }
    return map;
  }, [events]);

  const go = (dir: number) =>
    setCursor((c) => (view === "month" ? addMonths(c, dir) : view === "week" ? addDays(c, dir * 7) : addDays(c, dir)));
  const goToday = () => setCursor(todayKey);

  const { y, m, d } = partsOf(cursor);
  let title: string;
  if (view === "month") {
    title = `${monthLabels[m - 1]} de ${y}`;
  } else if (view === "week") {
    const start = addDays(cursor, -weekdayOf(cursor));
    const end = addDays(start, 6);
    const s = partsOf(start);
    const e = partsOf(end);
    title =
      s.m === e.m
        ? `${s.d}–${e.d} de ${monthLabels[s.m - 1]} de ${e.y}`
        : `${s.d}/${pad(s.m)} – ${e.d}/${pad(e.m)} de ${e.y}`;
  } else {
    title = `${weekdayFull[weekdayOf(cursor)]}, ${d} de ${monthLabels[m - 1]} de ${y}`;
  }

  const viewButton = (value: View, label: string) => (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        view === value ? "bg-white text-blu" : "text-moss hover:text-ink"
      }`}
      onClick={() => setView(value)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <section className="glass-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
            onClick={() => go(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            className="glass-input rounded-md px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-mist"
            onClick={goToday}
            type="button"
          >
            Hoje
          </button>
          <button
            className="glass-input rounded-md px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist"
            onClick={() => go(1)}
            type="button"
          >
            ›
          </button>
        </div>

        <h2 className="text-lg font-semibold text-ink">{title}</h2>

        <div className="glass-chip flex items-center gap-1 rounded-md p-1">
          {viewButton("month", "Mês")}
          {viewButton("week", "Semana")}
          {viewButton("day", "Dia")}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-moss">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-white/25" /> Interno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-celeste/50" /> Google
        </span>
      </div>

      {view === "month" ? (
        <MonthGrid cursor={cursor} eventsByDay={eventsByDay} todayKey={todayKey} onSelect={setSelected} />
      ) : view === "week" ? (
        <WeekGrid cursor={cursor} eventsByDay={eventsByDay} todayKey={todayKey} onSelect={setSelected} />
      ) : (
        <DayList cursor={cursor} eventsByDay={eventsByDay} onSelect={setSelected} />
      )}

      {selected ? <EventModal event={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

type GridProps = {
  cursor: string;
  eventsByDay: Map<string, CalendarDisplayEvent[]>;
  todayKey: string;
  onSelect: (e: CalendarDisplayEvent) => void;
};

function MonthGrid({ cursor, eventsByDay, todayKey, onSelect }: GridProps) {
  const { y, m } = partsOf(cursor);
  const firstWeekday = weekdayOf(`${y}-${pad(m)}-01`);
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells: Array<string | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(`${y}-${pad(m)}-${pad(day)}`);

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-moss">
        {weekdayLabels.map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((key, index) => {
          if (!key) return <div className="min-h-20 rounded-md bg-mist/40" key={`empty-${index}`} />;
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              className={`min-h-20 rounded-md border p-1 text-left ${
                isToday ? "border-ambered bg-ambered/10" : "border-moss/10"
              }`}
              key={key}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-ink" : "text-moss"}`}>
                {partsOf(key).d}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <EventChip event={event} key={`${event.source}-${event.id}`} onSelect={onSelect} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekGrid({ cursor, eventsByDay, todayKey, onSelect }: GridProps) {
  const start = addDays(cursor, -weekdayOf(cursor));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((key) => {
        const dayEvents = eventsByDay.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <div
            className={`min-h-64 rounded-md border p-1.5 text-left ${
              isToday ? "border-ambered bg-ambered/10" : "border-moss/10"
            }`}
            key={key}
          >
            <p className="text-center text-[11px] font-semibold uppercase text-moss">
              {weekdayLabels[weekdayOf(key)]}
            </p>
            <p className={`text-center text-sm font-semibold ${isToday ? "text-ink" : "text-moss"}`}>
              {partsOf(key).d}
            </p>
            <div className="mt-2 space-y-1.5">
              {dayEvents.map((event) => (
                <EventChip event={event} key={`${event.source}-${event.id}`} large onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({
  cursor,
  eventsByDay,
  onSelect
}: {
  cursor: string;
  eventsByDay: Map<string, CalendarDisplayEvent[]>;
  onSelect: (e: CalendarDisplayEvent) => void;
}) {
  const dayEvents = eventsByDay.get(cursor) ?? [];

  if (dayEvents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-white/20 p-6 text-center text-sm text-moss">
        Sem compromissos neste dia.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {dayEvents.map((event) => {
        const tone = event.source === "google" ? "border-celeste/40 bg-celeste/15" : "border-white/15 bg-white/10";
        return (
          <button
            className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition hover:bg-white/15 ${tone}`}
            key={`${event.source}-${event.id}`}
            onClick={() => onSelect(event)}
            type="button"
          >
            <span className="text-sm font-semibold text-ink">{toTimeBR(event.starts_at)}</span>
            <span className="truncate text-sm text-ink">{event.title}</span>
            {event.source === "google" ? (
              <span className="ml-auto text-[11px] uppercase text-celeste">Google</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// Modal de detalhes do evento, exibido sobre a página (sem trocar de aba).
// Interno: leitura + botão Editar. Google: edição inline salva direto no Google.
function EventModal({ event, onClose }: { event: CalendarDisplayEvent; onClose: () => void }) {
  const fullDate = formatFullDate(event.starts_at);
  const niceDate = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);
  const period = event.ends_at
    ? `${toTimeBR(event.starts_at)} – ${toTimeBR(event.ends_at)}`
    : toTimeBR(event.starts_at);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="modal-panel w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
              event.source === "google" ? "bg-celeste/20 text-celeste" : "bg-white/15 text-white"
            }`}
          >
            {event.source === "google" ? "Google" : event.event_type ?? "Compromisso"}
          </span>
          <button className="text-moss transition hover:text-white" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {event.source === "google" ? (
          // Edição inline do evento do Google, salva via API (sem abrir aba).
          <form action={updateGoogleEventAction} className="space-y-3">
            <input name="google_event_id" type="hidden" value={event.id} />

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-white">Título</span>
              <input
                className="w-full glass-input rounded-md px-3 py-2 text-sm"
                defaultValue={event.title}
                maxLength={140}
                name="title"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white">Início</span>
                <input
                  className="w-full glass-input rounded-md px-3 py-2 text-sm"
                  defaultValue={toDateTimeLocalBR(event.starts_at)}
                  name="starts_at"
                  type="datetime-local"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-white">Término</span>
                <input
                  className="w-full glass-input rounded-md px-3 py-2 text-sm"
                  defaultValue={toDateTimeLocalBR(event.ends_at)}
                  name="ends_at"
                  type="datetime-local"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-white">Descrição</span>
              <textarea
                className="min-h-20 w-full glass-input rounded-md px-3 py-2 text-sm"
                defaultValue={event.description ?? ""}
                maxLength={1200}
                name="description"
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn-primary rounded-md px-4 py-2 text-sm font-medium" type="submit">
                Salvar no Google
              </button>
              <button
                className="btn-secondary rounded-md px-4 py-2 text-sm font-medium"
                onClick={onClose}
                type="button"
              >
                Fechar
              </button>
            </div>
          </form>
        ) : null}

        {event.source === "google" ? (
          // Exclusão em form separado (não pode aninhar dentro do form de edição).
          <form action={deleteGoogleEventAction} className="mt-3 border-t border-white/10 pt-3">
            <input name="google_event_id" type="hidden" value={event.id} />
            <button
              className="rounded-md border border-magic-red/50 px-4 py-2 text-sm font-medium text-magic-red transition hover:bg-magic-red/10"
              type="submit"
            >
              Excluir do Google
            </button>
          </form>
        ) : null}

        {event.source === "internal" ? (
          <>
            <h3 className="text-xl font-semibold text-white">{event.title}</h3>
            <p className="mt-1 text-sm text-moss">{niceDate}</p>
            <p className="text-sm text-moss">{period}</p>

            {event.responsible_name ? (
              <p className="mt-3 text-sm text-moss">
                Responsável: <span className="text-white">{event.responsible_name}</span>
              </p>
            ) : null}

            {event.description ? (
              <p className="mt-3 whitespace-pre-line text-sm text-moss">{event.description}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {event.editLink ? (
                <Link className="btn-primary rounded-md px-4 py-2 text-sm font-medium" href={event.editLink}>
                  Editar
                </Link>
              ) : null}
              <button
                className="btn-secondary rounded-md px-4 py-2 text-sm font-medium"
                onClick={onClose}
                type="button"
              >
                Fechar
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
