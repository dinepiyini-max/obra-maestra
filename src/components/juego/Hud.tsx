import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  ETAPAS,
  OFICIO_COLOR,
  TUTORIAL,
  diaSemana,
  peso,
  pesoCaja,
  type Oficio,
} from "@/game/datos";
import {
  accion,
  cercano,
  cuello,
  pasoTutorial,
  puedeAdelantar,
  razonAdelanto,
  reloj,
  relojParado,
  textoFaltaNomina,
  textoMezcla,
  minutosMezcla,
  textoTopeAdelanto,
  type Estado,
  avisoSello,
  cuentaFiado,
  desgloseNomina,
} from "@/game/motor";
import { alCambioGuia, cerrarGuia, guiaAnclar, guiaVisible } from "@/game/guia";
import { VERSION_REPORTE, reportarObra } from "@/lib/reporte";

/** El primer toque dispara. El click que viene detrás no repite.
 * Si la hoja se cierra en el pointerup, el click cae en otro botón: ese no cuenta. */
type SelloToque = { t: number; el: EventTarget | null; down: number };
type SelloApi = { down: (e: Event) => void; click: (e: Event) => void };
function selloToque(): SelloToque {
  const w = globalThis as typeof globalThis & { __obraSello?: SelloToque };
  if (!w.__obraSello) w.__obraSello = { t: 0, el: null, down: 0 };
  return w.__obraSello;
}
if (typeof document !== "undefined") {
  const w = window as Window & { __obraSelloApi?: SelloApi };
  if (w.__obraSelloApi) {
    document.removeEventListener("pointerdown", w.__obraSelloApi.down, true);
    document.removeEventListener("click", w.__obraSelloApi.click, true);
  }
  const down = () => {
    selloToque().down = performance.now();
  };
  const click = (e: Event) => {
    const s = selloToque();
    if (!s.t || performance.now() - s.t >= 700) return;
    if (e.target === s.el) return;
    if (s.down > s.t) return;
    e.preventDefault();
    e.stopPropagation();
  };
  w.__obraSelloApi = { down, click };
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("click", click, true);
}

export function alToque(fn: () => void) {
  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === "mouse" ? e.button !== 0 : e.button > 0) return;
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLButtonElement & { _toque?: number };
      if (el.disabled) return;
      const ahora = performance.now();
      el._toque = ahora;
      const s = selloToque();
      s.t = ahora;
      s.el = el;
      fn();
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLButtonElement & { _toque?: number };
      const ahora = performance.now();
      if (el._toque && ahora - el._toque < 700) return;
      const s = selloToque();
      if (s.t && ahora - s.t < 700 && e.target !== s.el && s.down <= s.t) return;
      el._toque = ahora;
      s.t = ahora;
      s.el = el;
      fn();
    },
  };
}

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

function enPantalla(el: HTMLElement): boolean {
  if (document.visibilityState === "hidden") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

export function LineaGuia({ paso, mostrar }: { paso: number; mostrar: boolean }) {
  const [, bump] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => alCambioGuia(() => bump((n) => n + 1)), []);
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === "hidden") guiaVisible(paso, false);
      bump((n) => n + 1);
    };
    document.addEventListener("visibilitychange", alOcultar);
    return () => document.removeEventListener("visibilitychange", alOcultar);
  }, [paso]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!mostrar || !el || !enPantalla(el)) {
      guiaVisible(paso, false);
      return;
    }
    guiaAnclar(paso);
    guiaVisible(paso, true);
    return () => {
      guiaVisible(paso, false);
    };
  });
  const visible = guiaVisible(paso, mostrar);
  if (!visible || paso < 0 || paso >= TUTORIAL.length) return null;
  return (
    <p
      ref={ref}
      data-guia={paso}
      className="pointer-events-auto mx-auto mt-1 flex w-full max-w-full items-start justify-center gap-2 border border-tinta/80 bg-papel/90 px-2 py-1 text-center font-hand text-sm leading-snug text-tinta"
    >
      <span className="min-w-0 flex-1 text-pretty">
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
  onFiar,
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
  onFiar: () => void;
  vuelo?: "entra" | "sale" | null;
}) {
  const [chico, setChico] = useState(false);
  const [bajo, setBajo] = useState(false);
  const [reporte, setReporte] = useState(false);
  const [textoReporte, setTextoReporte] = useState("");
  const [versionReporte, setVersionReporte] = useState(VERSION_REPORTE);
  const [avisoReporte, setAvisoReporte] = useState<string | null>(null);
  const [reporteOk, setReporteOk] = useState(false);
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [, setGuiaTick] = useState(0);
  useEffect(() => alCambioGuia(() => setGuiaTick((n) => n + 1)), []);
  useEffect(() => {
    const mq = () => {
      setChico(window.innerWidth <= 420);
      setBajo(window.innerHeight <= 430);
    };
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);
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
  if (!s.firmado) {
    if (s.panel && s.panel !== "pausa") return null;
    const espera = cuello(s);
    const paso0 = pasoTutorial(s);
    const guia0 = paso0 === 0 && !repiteCartel(TUTORIAL[0] ?? "", espera) && guiaVisible(0, !s.panel);
    const acc0 = accion(s);
    const pista0 = !s.panel && acc0.verbo !== "Camina" && acc0.verbo !== "Firma primero";
    const pistaCls =
      "absolute mx-auto truncate bg-papel/85 px-3 text-center font-hand text-tinta " +
      (bajo
        ? "bottom-1 left-[5.25rem] right-[5.5rem] py-0.5 text-[11px] leading-tight"
        : movil
          ? "inset-x-0 bottom-[7.75rem] max-w-xl py-1 text-sm"
          : "inset-x-0 bottom-3 max-w-xl py-1.5 text-sm");
    return (
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="flex items-start justify-end px-2 pt-1.5 min-[900px]:pt-[52px]">
          <button type="button" onClick={onPausa} className={"pointer-events-auto border border-papel/40 bg-fondo/90 px-3 font-hand text-papel " + (chico ? "min-h-11 min-w-11 text-base" : "min-h-11 text-xl")}>
            Pausa
          </button>
        </div>
        {s.panel ? null : (
          <div className="mx-auto mt-2 w-full max-w-xl px-3">
            {guia0 ? (
              <LineaGuia paso={0} mostrar />
            ) : (
              <p className="bg-papel/85 px-3 py-2 text-center font-hand text-base leading-tight text-tinta">{espera}</p>
            )}
          </div>
        )}
        {pista0 ? <p className={pistaCls}>{[movil ? "¡Dale!" : acc0.tecla, acc0.verbo, acc0.detalle].filter(Boolean).join(" · ")}</p> : null}
      </div>
    );
  }
  if (s.panel === "contrato") return null;
  const r = reloj(s);
  const cartel = cuello(s);
  const faltaPuesto = cartel.startsWith("Nadie en");
  const acc = accion(s);
  const enAlcance = acc.verbo !== "Camina" && acc.verbo !== "Firma primero";
  const avisos = s.avisos.filter((a) => !a.texto.includes("dañado") && !avisoRepite(a.texto, cartel)).slice(-1);
  const btn =
    "pointer-events-auto border border-papel/40 bg-fondo/90 font-hand text-papel " +
    // v19: todo botón tocable mide al menos 44 px.
    (bajo ? "min-h-11 min-w-11 px-1.5 text-xs" : chico ? "min-h-11 min-w-11 px-1.5 text-xs" : movil ? "min-h-11 min-w-11 px-2 text-base" : "min-h-11 min-w-11 px-2 text-sm");
  const mundo = !s.panel;
  const adelanto = puedeAdelantar(s) && !s.entregada;
  const faltaNomina = mundo ? textoFaltaNomina(s) : null;
  const quiereGuia = mundo && paso >= 0 && paso < TUTORIAL.length && !repiteCartel(TUTORIAL[paso] ?? "", cartel);
  // v18: los avisos de caja y adelanto pasan delante de la guía, para que el principiante los vea.
  const urgente = avisos.length > 0 && /^(Te quedan|Ojo con el adelanto|Pasaron 18 días)/.test(avisos[0]!.texto);
  const guiaOn = quiereGuia && !urgente && guiaVisible(paso, true);
  const avisoOn = mundo && !guiaOn && avisos.length > 0;
  const etapaNombre = ETAPAS[s.etapa]?.nombre ?? "Entrega";

  function abrirReporte() {
    setAvisoReporte(null);
    setReporteOk(false);
    setReporte(true);
  }

  async function enviarReporte() {
    if (enviandoReporte) return;
    setEnviandoReporte(true);
    setAvisoReporte(null);
    setReporteOk(false);
    try {
      const r = await reportarObra({
        data: { texto: textoReporte, version: versionReporte, dia: s.dia, etapa: etapaNombre },
      });
      if (!r.ok) setAvisoReporte(r.error);
      else {
        setReporteOk(true);
        setAvisoReporte(`Reporte #${r.numero} enviado.`);
        setTextoReporte("");
      }
    } catch {
      setAvisoReporte("No se pudo enviar el reporte.");
    } finally {
      setEnviandoReporte(false);
    }
  }

  return (
    <div className={"pointer-events-none absolute inset-0 text-papel " + (reporte ? "z-50" : "z-10")}>
      {bajo ? (
        <div className="flex items-center gap-2 bg-fondo/90 px-2 py-1 min-[900px]:mt-[52px]">
          <div className="font-hand text-sm leading-none whitespace-nowrap">
            {r.hora} {cortoDia(s.dia)} {s.dia}
            {relojParado(s) && s.firmado && !s.entregada ? <span data-reloj-parado> · ⏸ reloj parado</span> : null}
          </div>
          <div className="truncate font-hand text-[11px] leading-none text-papel/80" data-clima>
            {r.clima}
          </div>
          <div data-caja className={"font-hand text-sm leading-none text-[#f3e6c4] " + (late ? "caja-latido" : "")}>
            {pesoCaja(s.caja)}
          </div>
          {adelanto ? (
            <button type="button" onClick={onAdelanto} className="pointer-events-auto font-hand text-[11px] text-oro underline">
              Adelanto
            </button>
          ) : null}
          <div className="ml-auto flex gap-1">
            <button type="button" onClick={onLibreta} className={btn}>
              Libreta
            </button>
            <button type="button" onClick={onCuadrilla} className={btn + (faltaPuesto ? " ring-2 ring-oro" : "")}>
              Cuadrilla
            </button>
            {!s.entregada ? (
              <button type="button" {...alToque(onTerminar)} className={btn}>
                Terminar
              </button>
            ) : null}
            <button type="button" onClick={abrirReporte} className={btn}>
              Reportar
            </button>
            <button type="button" onClick={onPausa} className={btn}>
              Pausa
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 px-2 pt-1.5 min-[900px]:pt-[52px]">
          <div className={"shrink-0 bg-fondo/90 px-2.5 py-1.5 " + (chico ? "max-w-[46%]" : "")}>
            <div className="flex items-end gap-1">
              <svg viewBox="0 0 54 24" className="mb-0.5 h-6 w-14 shrink-0" aria-hidden="true">
                <path d="M4 20 A23 16 0 0 0 50 20" fill="none" stroke="#e8dcc2" strokeWidth="1.2" />
                {(() => {
                  const t = Math.min(1, Math.max(0, (s.minuto - 7 * 60) / (8 * 60)));
                  const a = Math.PI + t * Math.PI;
                  const cx = 27 + Math.cos(a) * 23;
                  const cy = 20 + Math.sin(a) * 16;
                  if (s.lluviaOn) {
                    return <ellipse cx={cx} cy={cy} rx="5.5" ry="3.2" fill="#c5c0b6" stroke="#e8dcc2" strokeWidth="0.8" />;
                  }
                  return <circle cx={cx} cy={cy} r="2.6" fill="#f2d27a" stroke="#e8dcc2" strokeWidth="0.6" />;
                })()}
              </svg>
              <div className={"font-hand leading-none text-papel " + (chico ? "text-base" : "text-xl")}>
                {r.hora} {cortoDia(s.dia)} {s.dia}
                {relojParado(s) && s.firmado && !s.entregada ? <span data-reloj-parado> · ⏸ reloj parado</span> : null}
              </div>
            </div>
            <div className={"truncate font-hand leading-tight text-papel/80 " + (chico ? "text-[11px]" : "text-xs")} data-clima>
              {r.clima}
            </div>
            <div className="mt-1 h-0.5 w-full bg-tierra">
              <div className="h-full bg-oro" style={{ width: `${r.progreso * 100}%` }} />
            </div>
          </div>
          <div className="hidden h-12 min-w-[320px] flex-1 min-[900px]:block" aria-hidden="true" />
          <div data-caja className={"pointer-events-auto relative shrink-0 bg-fondo/90 px-2.5 py-1.5 text-right " + (late ? "caja-latido" : "") + (chico ? " max-w-[52%]" : "")}>
            <div className={"font-hand leading-none text-[#f3e6c4] " + (chico ? "text-base" : "text-xl")}>{pesoCaja(s.caja)}</div>
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
            <div className="mt-0.5 flex justify-end gap-2">
              <button type="button" onClick={onLibreta} className={btn}>
                Libreta
              </button>
              <button type="button" onClick={abrirReporte} className={btn}>
                Reportar
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
      )}

      {s.panel ? null : (
      <div className={"mx-auto w-full max-w-xl px-2 " + (bajo ? "mt-1" : "mt-1 px-3 min-[900px]:mt-2")}>
        {guiaOn ? (
          <LineaGuia paso={paso} mostrar />
        ) : avisoOn ? (
          <div className="pointer-events-auto flex justify-center">
            <button
              type="button"
              onClick={() => onQuitar(avisos[0]!.id)}
              className="max-w-xl border border-tinta/80 bg-papel/90 px-3 py-1 text-center font-hand text-sm text-tinta"
            >
              {avisos[0]!.texto}
            </button>
          </div>
        ) : (
          <p className={"bg-papel/90 px-3 py-1 text-center font-hand leading-tight text-tinta " + (bajo || chico ? "text-xs" : "text-sm")}>
            {cartel}
          </p>
        )}
        {guiaOn || avisoOn
          ? null
          : (() => {
              const mezcla = textoMezcla(s);
              const mm = minutosMezcla(s);
              if (!mezcla) return null;
              const rojo = !!mm && mm.min <= 20;
              return <p className={"mt-1 bg-papel/90 px-3 py-1 text-center font-hand text-xs " + (rojo ? "text-rojo" : "text-tinta")}>{mezcla}</p>;
            })()}
        {bajo || guiaOn ? null : (
          <div className="mt-1 flex justify-center gap-1.5">
            {ETAPAS.map((e, i) => {
              const lista = i < s.etapa || s.entregada;
              const ahora = i === s.etapa && !s.entregada;
              return (
                <span
                  key={e.id}
                  title={e.nombre}
                  className={"h-1.5 w-1.5 rounded-full " + (lista ? "bg-oro" : ahora ? "border border-tinta bg-transparent" : "bg-tinta/25")}
                />
              );
            })}
          </div>
        )}
      </div>
      )}

      {reporte ? (
        <form
          className="pointer-events-auto fixed inset-x-2 top-16 z-50 mx-auto max-w-md border border-tinta bg-papel p-3 text-tinta shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void enviarReporte();
          }}
        >
          <p className="font-display text-2xl leading-none">Reportar</p>
          <label className="mt-2 block font-hand text-base">
            Qué pasó
            <textarea
              value={textoReporte}
              onChange={(e) => setTextoReporte(e.target.value)}
              maxLength={800}
              rows={3}
              required
              className="mt-1 w-full border border-tinta bg-papel-2 px-2 py-1 font-hand text-base text-tinta"
            />
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2 font-hand text-sm">
            <label>
              Versión
              <input
                value={versionReporte}
                onChange={(e) => setVersionReporte(e.target.value)}
                maxLength={40}
                className="mt-0.5 w-full border border-tinta bg-papel-2 px-1 py-1"
              />
            </label>
            <p className="pt-4">Día {s.dia}</p>
            <p className="pt-4">{etapaNombre}</p>
          </div>
          {avisoReporte ? (
            <p className={"mt-2 font-hand " + (reporteOk ? "text-tinta" : "text-rojo")}>{avisoReporte}</p>
          ) : null}
          <div className="mt-2 flex gap-2">
            <button type="submit" disabled={enviandoReporte} className="min-h-11 border-2 border-tinta bg-oro px-3 font-hand text-tinta">
              {enviandoReporte ? "Enviando…" : "Enviar"}
            </button>
            <button type="button" className="min-h-11 border border-tinta px-3 font-hand" onClick={() => setReporte(false)}>
              Cerrar
            </button>
          </div>
        </form>
      ) : avisoReporte ? (
        <p className="pointer-events-auto mx-auto mt-2 max-w-md bg-papel px-3 py-1 text-center font-hand text-tinta">{avisoReporte}</p>
      ) : null}

      {mundo && avisoSello(s) ? (
        <p className="pointer-events-none mx-auto mt-1 max-w-md bg-papel/95 px-3 py-1 text-center font-hand text-sm text-tinta" data-falta-sello>
          {avisoSello(s)}
        </p>
      ) : null}

      {mundo && cuentaFiado(s) ? (
        <div className="pointer-events-auto mx-auto mt-1 w-full max-w-md border-2 border-rojo bg-papel/95 px-3 py-1 font-hand text-sm text-tinta" data-salida>
          <p>Sin caja ni adelanto para lo que falta. Salida: el guardalmacén fía {peso(cuentaFiado(s)!.total)} y se cobra solo del próximo tramo.</p>
          <button type="button" onClick={onFiar} className="mt-1 min-h-11 border-2 border-tinta bg-papel-2 px-3 text-tinta">
            Pedir fiado lo de esta etapa
          </button>
        </div>
      ) : null}

      {faltaNomina ? (
        // v24: el aviso de la nómina de las 3 siempre se ve completo (antes quedaba plegado en una línea ▸).
        <div className="pointer-events-auto mx-auto mt-1 w-full max-w-md border-2 border-rojo bg-papel/95 font-hand text-tinta" data-nomina-linea data-nomina-visible>
          <p className="px-3 pt-1 text-sm font-bold" role="alert">{faltaNomina}</p>
          {faltaNomina ? (
            <div className="px-3 pb-2 text-sm">
              {(() => {
                const d = desgloseNomina(s);
                return (
                  <p>
                    Nómina de las 3: jornales {peso(d.jornales)} + herramienta {peso(d.herramienta)} + Dirección {peso(d.direccion)} = {peso(d.total)}
                  </p>
                );
              })()}
              <p>{textoTopeAdelanto(s)}</p>
              {puedeAdelantar(s) ? (
                <button type="button" onClick={onAdelanto} className="mt-2 min-h-11 border-2 border-tinta bg-papel-2 px-3 text-tinta">
                  Pedir adelanto a Doña Carmen
                </button>
              ) : (
                <p className="mt-1">{razonAdelanto(s)}</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {mundo && enAlcance ? (
        <p
          className={
            "absolute mx-auto truncate bg-papel/85 px-3 text-center font-hand text-tinta " +
            (bajo
              ? "bottom-1 left-[5.25rem] right-[5.5rem] py-0.5 text-[11px] leading-tight"
              : movil
                ? "inset-x-0 bottom-[7.75rem] max-w-xl py-1 text-sm"
                : "inset-x-0 bottom-3 max-w-xl py-1.5 text-sm")
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

      {mundo && !s.entregada && !bajo ? (
        <button
          type="button"
          {...alToque(onTerminar)}
          className={
            "pointer-events-auto absolute z-20 border border-papel/40 bg-fondo font-hand text-papel " +
            (movil ? "right-[8.6rem] bottom-4 min-h-11 min-w-11 px-3 text-base" : "right-2 bottom-2 min-h-11 min-w-11 px-3 text-xl")
          }
        >
          Terminar{movil ? "" : " (T)"}
        </button>
      ) : null}
      {s.pausa ? (
        <div className="absolute left-1/2 top-14 z-30 -translate-x-1/2 border-2 border-papel bg-fondo px-4 py-1 font-display text-2xl text-papel" role="status" data-pausado>
          Pausado · el reloj no corre
        </div>
      ) : null}
    </div>
  );
}
