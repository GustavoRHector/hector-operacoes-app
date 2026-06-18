"use client";

import { type PointerEvent as ReactPointerEvent, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteGoogleEventAction,
  moveCalendarEventAction,
  updateGoogleEventAction
} from "@/app/(app)/agenda/actions";
import { toDateKeyBR, toDateTimeLocalBR, toTimeBR } from "@/lib/utils";

// Evento achatado para exibição. Campos extras alimentam o modal de detalhes;
// editLink (interno) e googleLink (Google) definem as ações disponíveis.
export type CalendarDisplayEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  source: "internal" | "google";
  color: "neutral" | "green" | "yellow" | "red";
  event_type: string | null;
  responsible_name: string | null;
  description: string | null;
  editLink: string | null;
  googleLink: string | null;
};

// Tom da pílula: borda esquerda sólida (cor inconfundível mesmo sobre a aurora)
// + fundo tonal. Google sempre celeste; internos pela cor escolhida.
function chipTone(event: CalendarDisplayEvent) {
  if (event.source === "google") return "border-l-4 border-celeste bg-celeste/25 text-white hover:bg-celeste/40";
  if (event.color === "red") return "border-l-4 border-magic-red bg-magic-red/25 text-white hover:bg-magic-red/40";
  if (event.color === "yellow")
    return "border-l-4 border-magic-amber bg-magic-amber/25 text-white hover:bg-magic-amber/40";
  if (event.color === "green")
    return "border-l-4 border-magic-green bg-magic-green/25 text-white hover:bg-magic-green/40";
  return "border-l-4 border-white/40 bg-white/15 text-white hover:bg-white/25";
}

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

// Controlador de arrastar baseado em pointer events (funciona com mouse e toque).
type DragApi = {
  down: (event: CalendarDisplayEvent, e: ReactPointerEvent) => void;
  move: (e: ReactPointerEvent) => void;
  up: (e: ReactPointerEvent) => void;
};

// Pílula de um evento na grade. Eventos internos podem ser arrastados (pointer
// events); o clique sem arrastar abre o modal. Google só clica (abre o modal).
function EventChip({
  event,
  onSelect,
  drag,
  large = false
}: {
  event: CalendarDisplayEvent;
  onSelect: (e: CalendarDisplayEvent) => void;
  drag: DragApi;
  large?: boolean;
}) {
  const tone = chipTone(event);
  const draggable = event.source === "internal";

  // Para arrastáveis, a seleção (abrir modal) é decidida no "up" sem movimento.
  const handlers = draggable
    ? {
        onPointerDown: (e: ReactPointerEvent) => drag.down(event, e),
        onPointerMove: drag.move,
        onPointerUp: drag.up,
        style: { touchAction: "none" as const }
      }
    : { onClick: () => onSelect(event) };

  const className = `block w-full rounded text-left font-medium transition ${tone} ${
    draggable ? "cursor-move" : "cursor-pointer"
  } ${large ? "px-2 py-1.5 text-xs" : "truncate px-1.5 py-0.5 text-[11px]"}`;

  return (
    <div className={className} role="button" tabIndex={0} title={event.title} {...handlers}>
      {large ? (
        <>
          <span className="block text-[10px] opacity-80">{toTimeBR(event.starts_at)}</span>
          <span className="block break-words leading-snug">{event.title}</span>
        </>
      ) : (
        <>
          {toTimeBR(event.starts_at)} {event.title}
        </>
      )}
    </div>
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
  const [ghost, setGhost] = useState<{ title: string; x: number; y: number } | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Estado mutável do arraste em andamento (não dispara re-render a cada movimento).
  const dragState = useRef<{
    event: CalendarDisplayEvent;
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
    el: Element;
  } | null>(null);

  // Move um evento (arrastado) para outro dia e recarrega os dados do servidor.
  const handleMove = (eventId: string, dateKey: string) => {
    startTransition(async () => {
      await moveCalendarEventAction(eventId, dateKey);
      router.refresh();
    });
  };

  // Descobre a chave do dia (data-datekey) sob um ponto da tela.
  const dateKeyAtPoint = (x: number, y: number) =>
    document.elementFromPoint(x, y)?.closest("[data-datekey]")?.getAttribute("data-datekey") ?? null;

  // API de arraste por pointer events: serve mouse e toque de forma confiável.
  const drag: DragApi = {
    down: (event, e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const el = e.currentTarget as Element;
      el.setPointerCapture(e.pointerId);
      dragState.current = { event, startX: e.clientX, startY: e.clientY, moved: false, pointerId: e.pointerId, el };
    },
    move: (e) => {
      const d = dragState.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6) {
        d.moved = true;
      }
      if (d.moved) {
        setGhost({ title: d.event.title, x: e.clientX, y: e.clientY });
        setOverKey(dateKeyAtPoint(e.clientX, e.clientY));
      }
    },
    up: (e) => {
      const d = dragState.current;
      if (!d) return;
      try {
        d.el.releasePointerCapture(d.pointerId);
      } catch {
        // captura já liberada — ignora.
      }
      dragState.current = null;
      setGhost(null);
      const dropKey = dateKeyAtPoint(e.clientX, e.clientY) ?? overKey;
      setOverKey(null);
      // Sem movimento = clique: abre o modal. Com movimento = solta no dia.
      if (!d.moved) {
        setSelected(d.event);
      } else if (dropKey) {
        handleMove(d.event.id, dropKey);
      }
    }
  };

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

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-moss">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-magic-green/60" /> Leve
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-magic-amber/60" /> Médio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-magic-red/60" /> Alta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-celeste/60" /> Google
        </span>
      </div>

      {view === "month" ? (
        <MonthGrid
          cursor={cursor}
          drag={drag}
          eventsByDay={eventsByDay}
          highlightKey={overKey}
          onSelect={setSelected}
          todayKey={todayKey}
        />
      ) : view === "week" ? (
        <WeekGrid
          cursor={cursor}
          drag={drag}
          eventsByDay={eventsByDay}
          highlightKey={overKey}
          onSelect={setSelected}
          todayKey={todayKey}
        />
      ) : (
        <DayList cursor={cursor} eventsByDay={eventsByDay} onSelect={setSelected} />
      )}

      {/* Fantasma que segue o cursor/dedo enquanto arrasta. */}
      {ghost ? (
        <div
          className="pointer-events-none fixed z-50 max-w-48 truncate rounded-md bg-white px-2 py-1 text-xs font-medium text-blu shadow-glow"
          style={{ left: ghost.x + 12, top: ghost.y + 12 }}
        >
          {ghost.title}
        </div>
      ) : null}

      {selected ? <EventModal event={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

type GridProps = {
  cursor: string;
  eventsByDay: Map<string, CalendarDisplayEvent[]>;
  todayKey: string;
  onSelect: (e: CalendarDisplayEvent) => void;
  drag: DragApi;
  highlightKey: string | null; // dia destacado durante o arraste
};

// Classe da borda de uma célula de dia (destaque ao arrastar > hoje > normal).
function cellBorder(key: string, todayKey: string, highlightKey: string | null) {
  if (highlightKey === key) return "border-celeste ring-2 ring-celeste/60";
  if (key === todayKey) return "border-ambered bg-ambered/10";
  return "border-moss/10";
}

function MonthGrid({ cursor, eventsByDay, todayKey, onSelect, drag, highlightKey }: GridProps) {
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
          return (
            <div
              className={`min-h-20 rounded-md border p-1 text-left ${cellBorder(key, todayKey, highlightKey)}`}
              data-datekey={key}
              key={key}
            >
              <span className={`text-xs font-semibold ${key === todayKey ? "text-ink" : "text-moss"}`}>
                {partsOf(key).d}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((event) => (
                  <EventChip drag={drag} event={event} key={`${event.source}-${event.id}`} onSelect={onSelect} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekGrid({ cursor, eventsByDay, todayKey, onSelect, drag, highlightKey }: GridProps) {
  const start = addDays(cursor, -weekdayOf(cursor));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((key) => {
        const dayEvents = eventsByDay.get(key) ?? [];
        return (
          <div
            className={`min-h-64 rounded-md border p-1.5 text-left ${cellBorder(key, todayKey, highlightKey)}`}
            data-datekey={key}
            key={key}
          >
            <p className="text-center text-[11px] font-semibold uppercase text-moss">
              {weekdayLabels[weekdayOf(key)]}
            </p>
            <p className={`text-center text-sm font-semibold ${key === todayKey ? "text-ink" : "text-moss"}`}>
              {partsOf(key).d}
            </p>
            <div className="mt-2 space-y-1.5">
              {dayEvents.map((event) => (
                <EventChip drag={drag} event={event} key={`${event.source}-${event.id}`} large onSelect={onSelect} />
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
        const tone =
          event.source === "google"
            ? "border-celeste/40 bg-celeste/15"
            : event.color === "red"
              ? "border-magic-red/40 bg-magic-red/15"
              : event.color === "yellow"
                ? "border-magic-amber/40 bg-magic-amber/15"
                : event.color === "green"
                  ? "border-magic-green/40 bg-magic-green/15"
                  : "border-white/15 bg-white/10";
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
