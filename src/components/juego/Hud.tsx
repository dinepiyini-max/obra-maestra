import { useEffect, useRef, useState } from "react";
import {
  ETAPAS,
  OFICIO_COLOR,
  TUTORIAL,
  diaSemana,
  peso,
  type Oficio,
} from "@/game/datos";
import {
  accion,
  cercano,
  cuello,
  pasoTutorial,
  puedeAdelantar,
  reloj,
  type Estado,
} from "@/game/motor";
import { alCambioGuia, cerrarGuia, guiaVisible } from "@/game/guia";

export function Retrato({ oficio, letra }: { oficio: Oficio; letra: string }) {
  const c = OFICIO_COLOR[oficio];
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden="true">
      <ellipse cx="24" cy="44" rx="12" ry="3" fill="#1d1712" opacity="0.25" />
      <path d="M14 40 C12 28 14 22 24 20 C34 22 36 28 34 40 Z" fill={c.camisa} stroke="#1d1712" strokeWidth="1.4" />
      <circle cx="24" cy="16" r="8" fill="#e6c2a4" stroke="#1d1712" strokeWidth="1.3" />
      <path d="M14 16 C14 8 18 5 24 5 C32 6 35 10 34 16 Z" fill={c.casco} stroke="#1d1712" strokeWidth="1.3" />
      <circle cx="21" cy="16" r="1.2" fill="#1d1712" />
      <circle cx="27.5" cy="15.4" r="1" fill="#1d1712" />
      <text x="24" y="11.5" textAnchor="middle" fontSize="7" fontFamily="Patrick Hand, cursive" fill="#1d1712">
        {letra}
      </text>
    </svg>
  );
}

function normal(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function repiteCartel(texto: string, cartel: string): boolean {
  const a = normal(texto);
  const c = normal(cartel);
  if (a.length < 8 || c.length < 8) return false;
  return c.includes(a) || a.includes(c);
}

function avisoRepite(texto: string, cartel: string): boolean {
  if (repiteCartel(texto, cartel)) return true;
  const a = normal(texto);
  const c = normal(cartel);
  if (a.startsWith("se fueron") && a.includes("nomina") && !c.includes("nomina")) return false;
  const cabeza = a.split(" ").find((w) => w.length > 4);
  return !!cabeza && c.includes(cabeza);
}

const cortoDia = (dia: number): string => {
  const n = diaSemana(dia);
  if (n === "Miércoles") return "Mié";
  if (n === "Sábado") return "Sáb";
  return n.slice(0, 3);
};

export function LineaGuia({ paso, mostrar }: { paso: number; mostrar: boolean }) {
  const [, bump] = useState(0);
  useEffect(() => alCambioGuia(() => bump((n) => n + 1)), []);
  const visible = guiaVisible(paso, mostrar);
  if (!visible || paso < 0 || paso >= TUTORIAL.length) return null;
  return (
    <p
      data-guia={paso}
      className="pointer-events-auto mx-auto mt-1 flex w-fit max-w-full items-center justify-center gap-2 border border-tinta/80 bg-papel/90 px-2 py-1 text-center font-hand text-sm leading-snug text-tinta"
    >
      <span>
        Guía {paso + 1}/8 · {TUTORIAL[paso]}
      </span>
      <button
        type="button"
        className="min-h-11 min-w-11 shrink-0 border border-tinta/50 bg-papel/80 font-hand text-base leading-none text-tinta"
        aria-label="Cerrar guía"
        onClick={() => cerrarGuia(paso)}
      >
        X
      </button>
    </p>
  );
}

export function Hud({
  s,
  movil,
  late,
  onLibreta,
  onCuadrilla,
  onPausa,
  onTerminar,
  onQuitar,
  onAdelanto,
  vuelo,
}: {
  s: Estado;
  movil: boolean;
  late: boolean;
  onLibreta: () => void;
  onCuadrilla: () => void;
  onPausa: () => void;
  onTerminar: () => void;
  onQuitar: (id: number) => void;
  onAdelanto: () => void;
  vuelo?: "entra" | "sale" | null;
}) {
  const quitar = useRef(onQuitar);
  quitar.current = onQuitar;
  const born = useRef(new Map<number, number>());
  const paso = pasoTutorial(s);
  const firma = s.avisos.map((a) => `${a.id}:${a.texto}`).join("|");
  useEffect(() => {
    const now = Date.now();
    const ids = new Set(s.avisos.map((a) => a.id));
    for (const a of s.avisos) if (!born.current.has(a.id)) born.current.set(a.id, now);
    for (const id of [...born.current.keys()]) if (!ids.has(id)) born.current.delete(id);
    const timers: number[] = [];
    for (const a of s.avisos) {
      if (a.texto.includes("dañado")) continue;
      const largo = /lluvia|plomo|aguacero/i.test(a.texto) ? 8000 : 5000;
      const resta = Math.max(40, (born.current.get(a.id) ?? now) + largo - Date.now());
      timers.push(window.setTimeout(() => quitar.current(a.id), resta));
    }
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
    // firma cambia solo si entra o sale un aviso; no reiniciar el plazo en cada frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);

  if (s.panel === "menu") return null;
  if (!s.firmado || s.panel === "contrato") {
    if (s.panel !== "contrato") return null;
    return <LineaGuia paso={paso} mostrar />;
  }
  const r = reloj(s);
  const cartel = cuello(s);
  const faltaPuesto = cartel.startsWith("Nadie en");
  const acc = accion(s);
  const enAlcance = acc.verbo !== "Camina" && acc.verbo !== "Firma primero";
  const avisos = s.avisos.filter((a) => !a.texto.includes("dañado") && !avisoRepite(a.texto, cartel)).slice(-2);
  const btn =
    "pointer-events-auto min-h-11 border border-papel/40 bg-fondo/40 px-2 font-hand text-papel " +
    (movil ? "text-base" : "text-sm");
  const mundo = !s.panel;
  const adelanto = puedeAdelantar(s) && !s.entregada;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-papel">
      <div className="flex items-start justify-between gap-2 px-2 pt-1.5">
        <div className="shrink-0 bg-fondo/55 px-2 py-1">
          <div className="font-hand text-sm leading-none">
            {r.hora} {cortoDia(s.dia)} {s.dia}
          </div>
          <div className="mt-1 h-0.5 w-full bg-tierra">
            <div className="h-full bg-oro" style={{ width: `${r.progreso * 100}%` }} />
          </div>
        </div>
        <div className="hidden h-12 min-w-[320px] flex-1 min-[900px]:block" aria-hidden="true" />
        <div data-caja className={"pointer-events-auto relative shrink-0 bg-fondo/45 px-2 py-1 text-right " + (late ? "caja-latido" : "")}>
          <div className="font-hand text-sm leading-none text-oro-brillo">{peso(s.caja)}</div>
          <div className="h-4 text-right leading-none">
            {adelanto ? (
              <button type="button" onClick={onAdelanto} className="font-hand text-[11px] text-oro underline">
                Pedir adelanto
              </button>
            ) : null}
          </div>
          {vuelo
            ? [0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={"pointer-events-none absolute top-2 right-3 h-16 w-16 rounded-full border-[5px] border-tinta bg-oro " + (vuelo === "sale" ? "moneda-sale" : "moneda-entra")}
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))
            : null}
          <div className="mt-0.5 flex justify-end gap-1">
            <button type="button" onClick={onLibreta} className={btn}>
              Libreta
            </button>
            <button
              type="button"
              onClick={onCuadrilla}
              className={btn + (faltaPuesto ? " ring-2 ring-oro ring-offset-2 ring-offset-fondo" : "")}
            >
              Cuadrilla
            </button>
            <button type="button" onClick={onPausa} className={btn}>
              Pausa
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-1 w-full max-w-xl px-3 min-[900px]:mt-2">
        <p className="text-center font-hand text-sm leading-tight text-tinta">{cartel}</p>
        <LineaGuia paso={paso} mostrar={paso !== 1 || s.gente.length + s.reserva.length === 0} />
        <div className="mt-1 flex justify-center gap-1.5">
          {ETAPAS.map((e, i) => {
            const lista = i < s.etapa || s.entregada;
            const ahora = i === s.etapa && !s.entregada;
            return (
              <span
                key={e.id}
                title={e.nombre}
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (lista ? "bg-oro" : ahora ? "border border-tinta bg-transparent" : "bg-tinta/25")
                }
              />
            );
          })}
        </div>
      </div>

      {mundo && avisos.length > 0 ? (
        <div
          className={
            "pointer-events-auto absolute inset-x-0 flex flex-col items-center gap-1 px-3 " +
            (movil ? "bottom-[15rem]" : "bottom-16")
          }
        >
          {avisos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onQuitar(a.id)}
              className="max-w-xl border border-tinta/80 bg-papel/90 px-3 py-1 text-center font-hand text-base text-tinta"
            >
              {a.texto}
            </button>
          ))}
        </div>
      ) : null}

      {mundo && enAlcance ? (
        <p
          className={
            "absolute inset-x-0 truncate px-16 text-center font-hand text-sm text-papel drop-shadow-[0_1px_0_#14100c] " +
            (movil ? "bottom-48" : "bottom-3")
          }
        >
          {(() => {
            const quitaVerbo = !!(acc.verbo && repiteCartel(acc.verbo, cartel));
            const verbo = acc.verbo && !quitaVerbo ? acc.verbo : "";
            const detalle = acc.detalle && !repiteCartel(acc.detalle, cartel) ? acc.detalle : "";
            const sitio = quitaVerbo ? (cercano(s)?.nombre ?? "") : "";
            const partes = [movil ? "¡Dale!" : acc.tecla, verbo || sitio, detalle].filter(Boolean);
            if (partes.length < 2) {
              const nombre = cercano(s)?.nombre;
              if (nombre && !partes.includes(nombre)) partes.push(nombre);
            }
            return partes.join(" · ");
          })()}
        </p>
      ) : null}

      {mundo && !s.entregada ? (
        <button
          type="button"
          onClick={onTerminar}
          className={
            "pointer-events-auto absolute z-20 border border-papel/50 bg-fondo/50 font-hand text-sm text-papel " +
            (movil ? "bottom-36 left-1/2 min-h-11 -translate-x-1/2 px-3" : "right-2 bottom-2 min-h-11 px-3")
          }
        >
          Terminar{movil ? "" : " (T)"}
        </button>
      ) : null}
    </div>
  );
}
