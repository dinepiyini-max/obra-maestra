import { Fragment, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  ANTICIPO,
  BONO_DIA,
  KIT_PRECIO,
  PLAZO_ENTREGA,
  COMPRA,
  CONTRATO,
  CAJA_INICIAL,
  DIRECCION_DIA,
  ETAPAS,
  FLETE,
  FLETE_URGENTE,
  GUARDALMACEN,
  MANIA_INFO,
  MATERIALES,
  MAX_CUADRILLA,
  AYUDA_DE,
  NOTA_ESCUADRA,
  OBRAS_MENU,
  OFICIO_NOMBRE,
  PRESUPUESTO_TOTAL,
  PUESTO_NOMBRE,
  esDomingo,
  esSabado,
  horaDe,
  jornalDe,
  num,
  peso,
  pesoCaja,
  type Cantidades,
  type Mat,
  type Oficio,
  type Puesto,
} from "@/game/datos";
import {
  adelantar,
  abrirPanel,
  almacen,
  ajusteLoQueFalta,
  aceptarRescate,
  aceptarSita,
  asignar,
  cerrarPanel,
  confirmarDespacho,
  confirmarNomina,
  contratar,
  cuentaPedido,
  despedir,
  editarSita,
  firmar,
  hablarSita,
  hojaGuardalmacen,
  fleteDe,
  informe,
  libreta,
  lineaAhora,
  lineaFicha,
  marcarLibre,
  marcarLoQueFalta,
  nominaPendiente,
  notarCierreHoja,
  pedir,
  pedirTambien,
  partesMuerto,
  precioDe,
  adelantoUsado,
  faltaEnPedido,
  nominaDiaDe,
  mezclaDeNoche,
  cobroDe,
  cuentaFiado,
  fiar,
  faltaParaSellar,
  bonoEntrega,
  causasPerdida,
  razonAdelanto,
  cuadrillaSugerida,
  diasDeCaja,
  puedeAdelantar,
  puedeRescate,
  fraseRescate,
  pronosticoDia,
  rechazarSita,
  REGLAS_LIBRETA,
  regatear,
  rindeLista,
  seguirJornada,
  siguienteDia,
  textoCajaLibre,
  desgloseNomina,
  textoDiasSinSello,
  textoLlegada,
  textoSinTarea,
  tramos,
  type Estado,
  type OficinaTab,
  type Persona,
  lineasCierre,
  cuentaFiadoPedido,
  fiarPedido,
} from "@/game/motor";
import { Icono, Retrato, alToque, sonidoUi } from "./Hud";
import type { Ajustes } from "@/game/guardar";

const btn =
  "min-h-11 min-w-11 rounded-md border-2 border-block-sombra bg-cemento px-3 py-2 font-ui text-base font-bold text-tinta hover:bg-varilla-brillo disabled:opacity-40";
const btnPri =
  "min-h-11 min-w-11 rounded-md border-2 border-tinta bg-colmado-amarillo px-4 py-2 font-ui text-base font-bold text-tinta shadow-[3px_3px_0_#1B1F23] hover:bg-varilla-brillo disabled:opacity-40";
const btnPeligro =
  "min-h-11 min-w-11 rounded-md border-2 border-tinta bg-colmado-rojo px-4 py-2 font-ui text-base font-bold text-white shadow-[3px_3px_0_#1B1F23] disabled:opacity-40";
const ALTO_OFICINA = "h-[min(88dvh,40rem)] max-h-[min(88dvh,40rem)]";

function Candado() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" fill="none" stroke="#1B1F23" strokeWidth="2" />
      <path d="M8 10 V7 a4 4 0 0 1 8 0 V10" fill="none" stroke="#1B1F23" strokeWidth="2" />
    </svg>
  );
}

function HojaMenu({ children, onVolver }: { children: ReactNode; onVolver?: () => void }) {
  const fondo = useRef(false);
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-noche/80 p-4"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      onPointerDown={(e) => {
        fondo.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        if (fondo.current && e.target === e.currentTarget) onVolver?.();
        fondo.current = false;
      }}
    >
      <section className="plancha max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-md border-2 border-block-sombra px-4 py-4 text-left text-tinta shadow-[3px_3px_0_#1B1F23]">
        {children}
        {onVolver ? (
          <button type="button" className={`${btn} mt-4 w-full`} onClick={onVolver}>
            Volver
          </button>
        ) : null}
      </section>
    </div>
  );
}

function decir(s: Estado, texto: string | null) {
  if (!texto) return;
  sonidoUi.ping("error");
  s.avisoSeq += 1;
  s.avisos.push({ id: s.avisoSeq, texto });
  if (s.avisos.length > 6) s.avisos.splice(0, s.avisos.length - 6);
}

function AvisoRoto({ s }: { s: Estado }) {
  const a = s.avisos.find((x) => x.texto.includes("dañado"));
  if (!a) return null;
  return <p className="mt-3 border-2 border-colmado-rojo px-2 py-1 font-hand text-sm text-colmado-rojo">{a.texto}</p>;
}

function gotasDe(c: number): number {
  if (c >= 75) return 3;
  if (c >= 50) return 2;
  if (c >= 25) return 1;
  return 0;
}

function Gotas({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${n} de 3`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={"inline-block h-3 w-3 rounded-full border border-tinta " + (i < n ? "bg-cielo-claro" : "bg-cemento-claro")} />
      ))}
    </span>
  );
}

function Creditos({ onVolver }: { onVolver: () => void }) {
  return (
    <HojaMenu onVolver={onVolver}>
      <h2 className="font-display text-2xl leading-tight break-words sm:text-4xl">Obra Maestra</h2>
      <p className="mt-3 font-hand text-lg leading-snug text-pretty sm:text-xl">
        Obra Maestra. Creado y dirigido por Rico, con la ayuda de Grok. Asesoría de ingeniería: Diego Ángeles, ingeniero y maestro constructor; gracias por su ojo de obra. Agradecimientos a Elon Musk.
      </p>
    </HojaMenu>
  );
}

function tonoDesvio(real: number, desv: number): string {
  if (real < 1) return "";
  if (desv > 1) return "text-colmado-rojo";
  if (desv < -1) return "text-colmado-verde";
  return "";
}

function Marco({
  titulo,
  children,
  onCerrar,
  ancho = "max-w-3xl",
  hoja = false,
  alto = "",
}: {
  titulo: string;
  children: ReactNode;
  onCerrar?: () => void;
  ancho?: string;
  hoja?: boolean;
  alto?: string;
}) {
  const fondo = useRef(false);
  return (
    <div
      className="velo-obra fixed inset-0 z-30 flex items-end justify-center bg-noche/80 p-2 sm:items-center sm:p-6"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))", paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      onPointerDown={(e) => {
        fondo.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        if (fondo.current && e.target === e.currentTarget) onCerrar?.();
        fondo.current = false;
      }}
    >
      <section
        className={`marco-obra relative flex w-full ${ancho} flex-col overflow-hidden rounded-md border-2 border-block-sombra bg-cemento-claro text-tinta shadow-[3px_3px_0_#1B1F23] ${alto || "max-h-[92dvh]"}`}
      >
        <header className="flex items-center justify-between gap-3 bg-block px-3 py-2">
          <h2 className="min-w-0 flex-1 font-display text-2xl leading-tight break-words text-tinta sm:text-3xl">{titulo}</h2>
          {onCerrar ? (
            <button type="button" className={btn} {...alToque(onCerrar)}>
              Cerrar
            </button>
          ) : null}
        </header>
        <div className={`relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3 sm:p-5 ${hoja ? "hoja-libreta pl-8" : ""}`}>
        {hoja ? (
          <span className="pointer-events-none absolute top-6 bottom-6 left-2 flex w-3 flex-col justify-between" aria-hidden="true">
            <i className="h-3 w-3 rounded-full border-2 border-tinta bg-noche" />
            <i className="h-3 w-3 rounded-full border-2 border-tinta bg-noche" />
            <i className="h-3 w-3 rounded-full border-2 border-tinta bg-noche" />
          </span>
        ) : null}
        {children}
        </div>
      </section>
    </div>
  );
}

const MOSTRAR_RINDE_EN = false;

type ColContrata = "nombre" | "oficio" | "jornal" | "rinde" | "cansancio" | "faltas" | "desde";

function TablaContratar({ s, onTomar }: { s: Estado; onTomar: (id: string) => void }) {
  const [orden, setOrden] = useState<{ col: ColContrata; dir: 1 | -1 } | null>(null);
  const [porOficio, setPorOficio] = useState(false);
  const cupo = s.gente.length + s.reserva.length;
  const desde = s.minuto < 9 * 60 ? "Hoy" : "Mañana 7:00";
  const fila = (p: Persona) => ({
    p,
    nombre: `${p.nombre} ${p.apellido}`,
    oficio: OFICIO_NOMBRE[p.oficio],
    jornal: jornalDe(p.oficio, p.rinde),
    rinde: rindeLista(p),
    cansancio: p.cansancio,
    faltas: p.mania === "madrugador" ? "Sábados" : "No",
    desde,
  });
  const comparar = (a: ReturnType<typeof fila>, b: ReturnType<typeof fila>) => {
    if (!orden) return 0;
    const va = a[orden.col];
    const vb = b[orden.col];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * orden.dir;
    return String(va).localeCompare(String(vb), "es") * orden.dir;
  };
  const tocar = (col: ColContrata) => {
    setOrden((o) => {
      if (!o || o.col !== col) {
        const numero = col === "jornal" || col === "rinde" || col === "cansancio";
        return { col, dir: numero ? -1 : 1 };
      }
      return { col, dir: o.dir === 1 ? -1 : 1 };
    });
  };
  const tomados = new Set([...s.gente, ...s.reserva].map((g) => g.id));
  const gente = s.candidatos.map(fila);
  if (orden) gente.sort(comparar);
  const grupos: { titulo: string; filas: typeof gente }[] = [];
  if (porOficio) {
    const ordenOf: Oficio[] = ["albanil", "ayudante", "varillero", "peon", "carpintero"];
    for (const of of ordenOf) {
      const filas = gente.filter((f) => f.p.oficio === of);
      if (filas.length) grupos.push({ titulo: OFICIO_NOMBRE[of], filas });
    }
  } else grupos.push({ titulo: "", filas: gente });
  const th = (col: ColContrata, label: string, numero = false) => (
    <th className={"bg-cemento-claro px-2 text-left font-hand font-normal whitespace-nowrap " + (numero ? "text-right" : "")}>
      <button type="button" className="min-h-8 underline" onClick={() => tocar(col)}>
        {label}
        {orden?.col === col ? (orden.dir < 0 ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );
  return (
    <div>
      <ul className="flex flex-col gap-2 min-[900px]:hidden">
        {gente.map((f) => {
          const ya = tomados.has(f.p.id);
          return (
            <li key={f.p.id} className="border-2 border-block-sombra bg-cemento-claro p-2">
              <p className="font-ui text-base font-bold leading-tight">{f.nombre}</p>
              <p className="font-hand text-base text-mar">
                {MANIA_INFO[f.p.mania].nombre} · {f.oficio}
              </p>
              <p className="font-ui text-base">
                Jornal {peso(f.jornal)} · rinde {num(f.rinde, 2)} · {f.desde}
              </p>
              <button
                type="button"
                className={(ya ? btn : btnPri) + " mt-2 w-full"}
                onClick={() => onTomar(f.p.id)}
                disabled={ya || cupo >= MAX_CUADRILLA}
              >
                {ya ? "Contratado" : "Contratar"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mb-2 hidden gap-2 min-[900px]:flex">
        <button type="button" className={porOficio ? btnPri : btn} onClick={() => setPorOficio(true)}>
          Por oficio
        </button>
        <button type="button" className={!porOficio ? btnPri : btn} onClick={() => setPorOficio(false)}>
          Todos
        </button>
      </div>
      <div className="relative hidden min-[900px]:block">
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-30 w-3 bg-gradient-to-l from-papel to-transparent min-[900px]:hidden" />
        <div className="overflow-x-auto">
          <table className="w-max min-w-full border-collapse text-sm">
            <thead>
              <tr className="h-8 border-b border-tinta/40">
                <th className="sticky left-0 z-20 bg-cemento-claro px-2 text-left font-hand font-normal shadow-[6px_0_8px_-6px_rgba(27,31,35,0.35)]">
                  <button type="button" className="min-h-8 underline" onClick={() => tocar("nombre")}>
                    Nombre{orden?.col === "nombre" ? (orden.dir < 0 ? " ↓" : " ↑") : ""}
                  </button>
                </th>
                {th("oficio", "Oficio")}
                {th("jornal", "Jornal", true)}
                {th("rinde", "Rinde", true)}
                {th("cansancio", "Cansancio", true)}
                {th("faltas", "Faltas")}
                {th("desde", "Desde")}
                {MOSTRAR_RINDE_EN ? th("oficio", "Rinde en") : null}
                <th className="sticky right-0 z-20 bg-cemento-claro px-2 shadow-[-8px_0_8px_-6px_rgba(27,31,35,0.45)]" />
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <Fragment key={g.titulo || "todos"}>
                  {g.titulo ? (
                    <tr className="h-8">
                      <td colSpan={8} className="sticky left-0 bg-cemento px-2 font-display text-xl">
                        {g.titulo}
                      </td>
                    </tr>
                  ) : null}
                  {g.filas.map((f) => {
                    const ya = tomados.has(f.p.id);
                    return (
                      <tr key={f.p.id} className="h-9 border-b border-tinta/15">
                        <td className="sticky left-0 z-10 bg-cemento-claro px-2 align-middle shadow-[6px_0_8px_-6px_rgba(27,31,35,0.28)]">
                          <div className="leading-none">{f.nombre}</div>
                          <div className="font-hand text-[12px] leading-none text-mar">{MANIA_INFO[f.p.mania].nombre}</div>
                        </td>
                        <td className="px-2 whitespace-nowrap">{f.oficio}</td>
                        <td className="px-2 text-right whitespace-nowrap">{peso(f.jornal)}</td>
                        <td className="px-2 text-right">{num(f.rinde, 2)}</td>
                        <td className="px-2 text-right">{num(f.cansancio, 0)}</td>
                        <td className="px-2 whitespace-nowrap">{f.faltas}</td>
                        <td className="px-2 whitespace-nowrap">{f.desde}</td>
                        {MOSTRAR_RINDE_EN ? <td className="px-2" /> : null}
                        <td className="sticky right-0 z-10 bg-cemento-claro px-2 shadow-[-8px_0_8px_-6px_rgba(27,31,35,0.35)]">
                          <button
                            type="button"
                            className={ya ? btn + " min-h-11" : btnPri + " min-h-11"}
                            onClick={() => onTomar(f.p.id)}
                            disabled={ya || cupo >= MAX_CUADRILLA}
                          >
                            {ya ? "Contratado" : "Contratar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Grupos({ s, onTomar }: { s: Estado; onTomar: (id: string) => void }) {
  const de = (pred: (p: Persona) => boolean) => s.candidatos.filter(pred);
  const bloque = (titulo: string, gente: Persona[]) => (
    <section className="mb-4">
      <h3 className="font-display text-2xl">{titulo}</h3>
      {gente.length === 0 ? <p className="font-hand text-sm">Ya están en la obra.</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {gente.map((p) => (
          <Carta key={p.id} p={p} onTomar={() => onTomar(p.id)} />
        ))}
      </div>
    </section>
  );
  return (
    <div>
      {bloque(
        "Albañiles (2)",
        de((p) => p.oficio === "albanil"),
      )}
      {bloque(
        "Ayudantes de albañil (2)",
        de((p) => p.oficio === "ayudante" && AYUDA_DE[p.nombre] === "albanil"),
      )}
      {bloque(
        "Varilleros (2)",
        de((p) => p.oficio === "varillero"),
      )}
      {bloque(
        "Ayudantes de varillero (2)",
        de((p) => p.oficio === "ayudante" && AYUDA_DE[p.nombre] !== "albanil"),
      )}
      {bloque(
        "Peones",
        de((p) => p.oficio === "peon"),
      )}
      <p className="font-hand text-sm text-mar">Los cuatro de hoy siguen en su oficio. El ayudante cobra el jornal más bajo.</p>
    </div>
  );
}

function puestosDe(of: Oficio): { id: Puesto | null; nombre: string }[] {
  const ayuda = of === "peon" || of === "ayudante";
  const ids: (Puesto | null)[] = ayuda ? [null, "obra", "batea", "agua", "acarreo", "sombra"] : [null, "obra", "sombra"];
  return ids.map((id) => ({ id, nombre: id ? PUESTO_NOMBRE[id] : "Sin puesto" }));
}

function Carta({ p, onTomar }: { p: Persona; onTomar: () => void }) {
  const m = MANIA_INFO[p.mania];
  return (
    <article className="flex gap-2 border-2 border-tinta bg-cemento-claro/70 p-2">
      <Retrato oficio={p.oficio} letra={p.nombre.slice(0, 1)} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-2xl leading-none">
          {p.nombre} {p.apellido}
        </div>
        <div className="font-hand text-sm">
          {OFICIO_NOMBRE[p.oficio]} · {m.nombre}
        </div>
        <div className="font-hand text-sm">
          Rinde {num(rindeLista(p), 2)} · aguante {p.aguante} · ojo {p.ojo}
        </div>
        <p className="font-hand text-sm text-colmado-verde">{m.bueno}</p>
        <p className="font-hand text-sm text-mar">{m.malo}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-display text-2xl">{peso(jornalDe(p.oficio, p.rinde))}</span>
          <button type="button" className={btnPri} onClick={onTomar}>
            Contratar
          </button>
        </div>
      </div>
    </article>
  );
}

function Cascos({ usados }: { usados: number }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2" aria-label={`${usados} de ${MAX_CUADRILLA} en la cuadrilla`}>
      {Array.from({ length: MAX_CUADRILLA }, (_, i) => (
        <span
          key={i}
          className={
            "inline-block h-11 w-11 rounded-t-full border-2 border-tinta " + (i < usados ? "bg-colmado-amarillo" : "bg-cemento")
          }
        />
      ))}
    </div>
  );
}

function Pestanas({
  tab,
  onTab,
}: {
  tab: OficinaTab;
  onTab: (t: OficinaTab) => void;
}) {
  const items: [OficinaTab, string][] = [
    ["gente", "Contratar"],
    ["planos", "Planos"],
    ["telefono", "Teléfono"],
    ["diario", "Diario"],
    ["libreta", "Libreta"],
  ];
  return (
    <div className="mb-2 grid grid-cols-3 gap-1">
      {items.map(([id, nombre]) => (
        <button key={id} type="button" className={(tab === id ? btnPri : btn) + " min-h-11 px-1 py-1 text-sm leading-tight"} onClick={() => onTab(id)}>
          {nombre}
        </button>
      ))}
    </div>
  );
}

function seDebe(s: Estado, g: Persona): number {
  if (s.nominaPagada || g.falto || g.fuera || !g.activo) return 0;
  return jornalDe(g.oficio, g.rinde);
}

function SinTarea({ s, act }: { s: Estado; act: (fn: (st: Estado) => void) => void }) {
  const ociosos = s.gente.filter((g) => textoSinTarea(g));
  if (!ociosos.length) return null;
  return (
    <div className="mt-3 border-2 border-tinta p-2">
      <h3 className="font-display text-2xl">Sin tarea</h3>
      {ociosos.map((g) => (
        <div key={g.id} className="mt-2 flex flex-wrap items-center gap-2">
          <p className="min-w-0 font-hand text-sm">{textoSinTarea(g)}</p>
          <button type="button" className={btn} onClick={() => act((st) => marcarLibre(st, g.id, !g.libre))}>
            {g.libre ? "Sí viene mañana" : "Libre mañana"}
          </button>
        </div>
      ))}
    </div>
  );
}

function ListaFilas({ s }: { s: Estado }) {
  const lista = [...s.gente, ...s.reserva];
  if (!lista.length) return <p className="font-hand">Nadie en la lista.</p>;
  return (
    <ul className="min-w-0">
      {lista.map((g) => (
        <li key={g.id} className="border-b border-tinta/20 py-1.5 font-hand text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate">{g.nombre}</span>
            <span className="shrink-0">{OFICIO_NOMBRE[g.oficio]}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Días {g.dias ?? 0}</span>
            <span className="whitespace-nowrap">Jornal {peso(jornalDe(g.oficio, g.rinde))}</span>
            <span className="whitespace-nowrap">
              {s.nominaPagada ? ((s.deudaNomina ?? 0) > 0.5 ? `Pagado en parte: la cuadrilla aún espera ${peso(s.deudaNomina ?? 0)}` : "Hoy: pagado") : g.activo && !g.falto ? `Por pagar a las 3: ${peso(seDebe(s, g))}` : "Hoy no cobra"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ordenDiario<T extends { dia: number; min: number }>(filas: T[], dia: number, min: number): T[] {
  return filas
    .filter((a) => a.dia < dia || (a.dia === dia && a.min <= min))
    .sort((a, b) => a.dia - b.dia || a.min - b.min);
}

function RegistroAlmacen({ s }: { s: Estado }) {
  const entroBruto = ordenDiario(
    s.bitacora.filter((a) => a.clase === "entro"),
    s.dia,
    s.minuto,
  );
  const aguaDia = new Map<number, (typeof entroBruto)[number]>();
  const entro = entroBruto.filter((a) => {
    const agua = a.lugar === "tanque" && a.texto.startsWith("Entró");
    if (!agua) return true;
    aguaDia.set(a.dia, a);
    return false;
  });
  for (const a of aguaDia.values()) entro.push(a);
  entro.sort((a, b) => a.dia - b.dia || a.min - b.min);
  const salio = ordenDiario(
    s.bitacora.filter((a) => a.clase === "salio"),
    s.dia,
    s.minuto,
  );
  const notasTodas = ordenDiario(
    s.bitacora.filter((a) => a.clase === "guardado" || a.clase === "mojado" || a.clase === "nota"),
    s.dia,
    s.minuto,
  );
  const notasVistas = new Set<string>();
  const notas = notasTodas.filter((a) => {
    if (!a.texto.includes("Para mañana faltan") && !a.texto.includes("Para hoy faltan")) return true;
    const k = `${a.dia}|${a.texto.slice(0, 16)}`;
    if (notasVistas.has(k)) return false;
    notasVistas.add(k);
    return true;
  });
  const entrada = (Object.keys(s.entrada) as Mat[]).filter((k) => (s.entrada[k]?.q ?? 0) > 1e-6);
  return (
    <div className="space-y-3 font-hand text-sm">
      <p>
        Guardado {Math.round(s.inv.cemento.q)} fundas · Mojado {s.mojado}
      </p>
      <div>
        <h3 className="font-display text-2xl">Entró</h3>
        {entro.length === 0 ? <p>Nada todavía.</p> : null}
        <ul>
          {entro.slice(-12).map((a, i) => (
            <li key={i}>
              {horaDe(a.min)} · {a.texto}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-display text-2xl">Salió</h3>
        {salio.length === 0 ? <p>Nada todavía.</p> : null}
        <ul>
          {salio.slice(-8).map((a, i) => (
            <li key={i}>
              {horaDe(a.min)} · {a.texto}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-display text-2xl">Hay</h3>
        <p>Almacén: cemento {num(s.inv.cemento.q, 0)} · block {num(s.inv.block.q, 0)} · varilla {num(s.inv.v38.q + s.inv.v14.q, 0)}</p>
        <p>
          Entrada:{" "}
          {entrada.length
            ? entrada.map((k) => `${MATERIALES[k].nombre} ${num(s.entrada[k]!.q, 1)}`).join(" · ")
            : "vacía"}
        </p>
        <p>
          Montón: arena {num(s.inv.arena.q, 2)} m³ · grava {num(s.inv.grava.q, 2)} m³
        </p>
        <p>Tanque: {s.inv.agua.q > 0.15 ? "con agua" : "vacío"}</p>
      </div>
      {notas.length ? (
        <ul>
          {notas.slice(-6).map((a, i) => (
            <li key={i}>
              {horaDe(a.min)} · {a.texto}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Paneles({
  s,
  seguir,
  act,
  onNueva,
  onContinuar,
  ajustes,
  onAjustes,
  selloAncla,
  onTocarSello,
}: {
  s: Estado;
  seguir: boolean;
  act: (fn: (st: Estado) => void) => void;
  onNueva: () => void;
  onContinuar: () => void;
  ajustes: Ajustes;
  onAjustes: (a: Ajustes) => void;
  selloAncla?: RefObject<HTMLDivElement | null>;
  onTocarSello?: (x: number, y: number) => void;
}) {
  const [tab, setTab] = useState<"pre" | "dia" | "lista" | "alm" | "con" | "plano">("pre");
  const [cart, setCart] = useState<Cantidades>({});
  const [draft, setDraft] = useState<Partial<Record<Mat, string>>>({});
  const [nota, setNota] = useState("");
  const [notaRoja, setNotaRoja] = useState(false);
  const ponerNota = (texto: string, roja = false) => {
    setNota(texto);
    setNotaRoja(roja);
  };
  const [partidaAbierta, setPartidaAbierta] = useState<string | null>(null);
  const [pausaAjustes, setPausaAjustes] = useState(false);
  const [pausaHoja, setPausaHoja] = useState<null | "creditos">(null);
  const [freno, setFreno] = useState<null | { origen: "sita" | "tambien" | "tel"; urgente: boolean; total: number; items?: Cantidades }>(null);
  const [aceptaCorta, setAceptaCorta] = useState(false);
  useEffect(() => setAceptaCorta(false), [freno]);
  const [angosta, setAngosta] = useState(false);
  const [telefono, setTelefono] = useState(false);
  const [hoja, setHoja] = useState<null | "como" | "obras" | "ajustes" | "creditos" | "confirmar">(null);
  useEffect(() => {
    setFreno(null);
    setDraft({});
    if (s.panel === "ferreteria" && s.sita?.editando && s.sita.oferta) {
      const of = s.sita.oferta;
      setCart({ ...(of.recorte ? (of.cabe ?? {}) : of.items) });
      ponerNota("El guardalmacén ya lo armó. Cámbialo si quieres y mándalo.");
    } else {
      setCart({});
      ponerNota("");
    }
    if (s.panel !== "pausa") {
      setPausaAjustes(false);
      setPausaHoja(null);
    }
  }, [s.panel]);
  useEffect(() => {
    const mq = () => {
      setAngosta(window.innerWidth < 420);
      setTelefono(window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches);
    };
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);

  const cerrar = () => {
    notarCierreHoja();
    act((st) => cerrarPanel(st));
  };
  const ir = (t: OficinaTab) =>
    act((st) => {
      st.oficinaTab = t;
      st.panel = "oficina";
    });

  const hayPartida =
    seguir ||
    s.firmado ||
    (typeof localStorage !== "undefined" && localStorage.getItem("obra-maestra-v1") != null);
  const quiereNueva = () => {
    if (hayPartida) setHoja("confirmar");
    else onNueva();
  };

  if (hoja === "confirmar") {
    const sellos = s.etapas.filter((e) => e.sello === "aprobado").length;
    const gente = s.gente.length + s.reserva.length;
    return (
      <HojaMenu>
        <h2 className="font-display text-2xl leading-tight break-words sm:text-4xl">¿Empezar una obra nueva?</h2>
        <p className="mt-3 font-hand">
          Pierdes: día {s.dia} y {sellos} de 9 etapas selladas; caja {pesoCaja(s.caja)} y lo que hay en el almacén; tu cuadrilla ({gente}{" "}
          personas) y la lista de días.
        </p>
        <p className="mt-2 font-hand">
          Empiezas con: contrato nuevo, Caseta de block 3x4 por {peso(CONTRATO)}; anticipo 30 %, caja {peso(CAJA_INICIAL)}; lunes 1, sin
          cuadrilla, almacén vacío con 0.4 m³ de agua y el kit.
        </p>
        <p className="mt-2 font-hand">Esto no se puede deshacer.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className={btnPeligro}
            onClick={() => {
              setHoja(null);
              onNueva();
            }}
          >
            Sí, obra nueva
          </button>
          <button type="button" className={btn} onClick={() => setHoja(null)}>
            Seguir con esta
          </button>
        </div>
      </HojaMenu>
    );
  }

  if (s.panel === "menu") {
    if (hoja === "como") {
      return (
        <HojaMenu onVolver={() => setHoja(null)}>
          <h2 className="font-display text-2xl leading-tight break-words sm:text-4xl">Cómo se juega</h2>
          <ul className="mt-3 flex flex-col gap-2 font-hand">
            <li className="flex items-center gap-2"><Icono nombre="casco" /> Tú diriges, la cuadrilla trabaja.</li>
            <li className="flex items-center gap-2"><Icono nombre="funda" /> En la oficina contratas; el listero apunta los días.</li>
            <li className="flex items-center gap-2"><Icono nombre="varilla" /> Pídele al guardalmacén. El camión lo deja en la entrada.</li>
            <li className="flex items-center gap-2"><Icono nombre="carretilla" /> Manda gente a acarrear al almacén: lo que se queda afuera se moja.</li>
            <li className="flex items-center gap-2"><Icono nombre="trompo" /> Alguien busca agua para el trompo.</li>
            <li className="flex items-center gap-2"><Icono nombre="cubeta" /> El cartel de arriba siempre dice qué frena la obra.</li>
            <li className="flex items-center gap-2"><Icono nombre="block" /> El block de 6" lleva mortero en la junta.</li>
            <li className="flex items-center gap-2"><Icono nombre="zinc" /> El techo es zinc, cuando toque.</li>
          </ul>
          <button type="button" className={`${btnPri} mt-4 w-full`} onClick={quiereNueva}>
            Jugar con guía
          </button>
        </HojaMenu>
      );
    }
    if (hoja === "obras") {
      return (
        <HojaMenu onVolver={() => setHoja(null)}>
          <h2 className="font-display text-2xl leading-tight break-words sm:text-4xl">Obras</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {OBRAS_MENU.map((o) =>
              o.abierta ? (
                <li key={o.id} className="min-h-11 border-2 border-tinta bg-cemento px-3 py-2 text-left font-hand">
                  {o.nombre}
                </li>
              ) : (
                <li key={o.id} className="flex min-h-11 items-center gap-2 border-2 border-tinta/30 px-3 py-2 font-hand text-block-sombra">
                  <Candado />
                  {o.nombre}
                </li>
              ),
            )}
          </ul>
        </HojaMenu>
      );
    }
    if (hoja === "ajustes") {
      const tog = (on: boolean) =>
        on ? "min-h-11 rounded-md border-2 border-tinta bg-colmado-amarillo px-4 font-ui text-base font-bold text-tinta shadow-[3px_3px_0_#1B1F23]" : "min-h-11 rounded-md border-2 border-block-sombra bg-cemento px-4 font-ui text-base font-bold text-tinta";
      return (
        <HojaMenu onVolver={() => setHoja(null)}>
          <h2 className="font-display text-2xl leading-tight break-words sm:text-4xl">Ajustes</h2>
          <p className="mt-3 font-hand">Sonido</p>
          <div className="mt-1 flex gap-2">
            <button type="button" className={tog(ajustes.sonido)} onClick={() => onAjustes({ ...ajustes, sonido: true })}>
              Sí
            </button>
            <button type="button" className={tog(!ajustes.sonido)} onClick={() => onAjustes({ ...ajustes, sonido: false })}>
              No
            </button>
          </div>
          <p className="mt-3 font-hand">Velocidad del reloj</p>
          <div className="mt-1 flex gap-2">
            <button type="button" className={tog(ajustes.vel === 1)} onClick={() => onAjustes({ ...ajustes, vel: 1 })}>
              x1
            </button>
            <button type="button" className={tog(ajustes.vel === 2)} onClick={() => onAjustes({ ...ajustes, vel: 2 })}>
              x2
            </button>
          </div>
          <p className="mt-3 font-hand text-sm text-mar">El x2 solo acelera el reloj. No cambia ritmos ni números.</p>
        </HojaMenu>
      );
    }
    if (hoja === "creditos") return <Creditos onVolver={() => setHoja(null)} />;
    return (
      <div
        className="fixed inset-0 z-30 overflow-y-auto bg-cielo px-3"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))", paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex min-h-full items-center justify-center py-2">
        <section className="w-full max-w-[280px] text-center min-[900px]:max-w-[420px]">
          <img src="/logo.svg" alt="" className="mx-auto h-auto w-full max-h-[34vh] [@media(max-height:520px)]:max-h-12 [@media(max-height:520px)]:w-auto" />
          <h2 className="sr-only">Obra Maestra</h2>
          <AvisoRoto s={s} />
          <div className="mt-3 flex flex-col gap-2 [@media(max-height:520px)]:mt-1 [@media(max-height:520px)]:gap-1">
            {seguir ? (
              <button type="button" className={btnPri} onClick={onContinuar}>
                Continuar
              </button>
            ) : null}
            <button type="button" className={btnPri} onClick={quiereNueva}>
              Jugar
            </button>
            <button type="button" className={btn} onClick={() => setHoja("como")}>
              Cómo se juega
            </button>
            <button type="button" className={btn} onClick={() => setHoja("obras")}>
              Obras
            </button>
            <button type="button" className={btn} onClick={() => setHoja("ajustes")}>
              Ajustes
            </button>
            <button type="button" className={btn} onClick={() => setHoja("creditos")}>
              Créditos
            </button>
            <p className="mt-1 font-hand text-base text-tinta">Próximamente: jugar como ingeniero.</p>
          </div>
        </section>
        </div>
      </div>
    );
  }

  if (s.panel === "contrato") {
    const pedido = s.precio > 0 ? s.precio : CONTRATO;
    const dicho = s.regateo;
    return (
      <div className="pointer-events-none fixed inset-0 z-30">
        <section
          className="pointer-events-auto plancha absolute max-h-[70%] overflow-y-auto border-2 border-tinta px-4 py-3 text-tinta shadow-[3px_3px_0_#1B1F23] inset-x-3 bottom-3 min-[900px]:inset-x-auto min-[900px]:right-4 min-[900px]:bottom-4 min-[900px]:w-[22rem]"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <p className="font-hand text-lg leading-tight">Oficina · Doña Carmen, la dueña</p>
          <p className="mt-2 font-hand text-xl leading-tight">Caseta de block 3x4</p>
          <p className="font-display text-2xl leading-tight break-words sm:text-4xl">{peso(pedido)}</p>
          <p className="font-hand text-lg leading-tight">Lo que no gastes es tuyo</p>
          <p className="mt-1 font-hand text-sm leading-tight" data-kit>
            Al firmar: anticipo {peso(ANTICIPO)} menos el kit de replanteo {peso(KIT_PRECIO)} (estacas, hilo, cal y escuadra para marcar la
            caseta). Te quedan {peso(ANTICIPO - KIT_PRECIO)} en caja. Si entregas antes del día {PLAZO_ENTREGA}, Doña Carmen paga{" "}
            {peso(BONO_DIA)} por cada día de adelanto.
          </p>
          <AvisoRoto s={s} />
          {dicho ? (
            <p className="mt-3 font-hand text-tinta">
              {pedido === 295000
                ? "Así no. Ya me cotizaron otro maestro en P$295,000. Si la quieres, es a ese precio."
                : `Está bien. Queda en ${peso(pedido)}.`}
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {[305, 310, 315, 320, 325].map((mil) => (
                <button key={mil} type="button" className={btn} onClick={() => act((st) => void regatear(st, mil * 1000))}>
                  Pedir {mil} mil
                </button>
              ))}
            </div>
          )}
          <button type="button" className={`${btnPri} mt-4 w-full`} onClick={() => act((st) => firmar(st))}>
            Firmar
          </button>
          <button type="button" className={`${btn} mt-2 w-full`} onClick={cerrar}>
            Lo pienso y vuelvo
          </button>
        </section>
      </div>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "gente") {
    const cupo = s.gente.length + s.reserva.length;
    return (
      <Marco titulo="Contratar" onCerrar={cerrar} hoja alto={ALTO_OFICINA}>
        <Pestanas tab="gente" onTab={ir} />
        <p className="mb-2 font-ui text-base font-bold">Cuadrilla: {cupo} de {MAX_CUADRILLA}</p>
        <p className="mb-2 font-hand text-base leading-snug">
          Más gente gasta la caja antes del próximo cobro. La sugerida mira cuánto aguanta tu caja.
        </p>
        {(() => {
          const sug = cuadrillaSugerida(s);
          return (
            <div className="mb-3 border-2 border-dashed border-tinta/60 p-2" data-sugerida>
              <p className="font-hand text-base leading-snug">
                <span className="font-bold">Sugerida para tu caja: </span>
                {sug.texto}
              </p>
              {sug.ids.length ? (
                <button
                  type="button"
                  className={`${btnPri} mt-2`}
                  onClick={() =>
                    act((st) => {
                      for (const id of cuadrillaSugerida(st).ids) {
                        const err = contratar(st, id);
                        if (err) {
                          decir(st, err);
                          break;
                        }
                      }
                    })
                  }
                >
                  Contratar la sugerida
                </button>
              ) : null}
            </div>
          );
        })()}
        <TablaContratar
          s={s}
          onTomar={(id) =>
            act((st) => {
              decir(st, contratar(st, id));
            })
          }
        />
      </Marco>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "planos") {
    return (
      <Marco titulo="Planos" onCerrar={cerrar} hoja alto={ALTO_OFICINA}>
        <Pestanas tab="planos" onTab={ir} />
        <ol className="space-y-2">
          {ETAPAS.map((e, i) => {
            const hecha = i < s.etapa || s.entregada;
            const ahora = i === s.etapa && !s.entregada;
            return (
              <li key={e.id} className="border-b border-tinta/20 pb-1">
                <div className="font-hand">
                  {hecha ? "Lista · " : ahora ? "Ahora · " : ""}
                  {e.n}. {e.nombre}
                </div>
                <p className="font-hand text-sm text-mar">{e.regla}</p>
              </li>
            );
          })}
        </ol>
      </Marco>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "telefono") {
    return (
      <Marco titulo="Teléfono" onCerrar={cerrar} alto={ALTO_OFICINA}>
        <Pestanas tab="telefono" onTab={ir} />
        <p className="font-hand">Doña Carmen paga el contrato. El material se pide al guardalmacén, con precio y entrega.</p>
        <p className="mt-2 font-hand">El guardalmacén lleva el almacén. Su nota se arma con lo que falta.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPri}
            onClick={() => {
              act((st) => {
                hablarSita(st);
              });
            }}
          >
            Hablar con el guardalmacén
          </button>
          {puedeAdelantar(s) ? (
            <button type="button" className={btn} onClick={() => act((st) => decir(st, adelantar(st)))}>
              Pedir adelanto a Doña Carmen
            </button>
          ) : null}
        </div>
      </Marco>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "diario") {
    return (
      <Marco titulo="Diario" onCerrar={cerrar} hoja alto={ALTO_OFICINA}>
        <Pestanas tab="diario" onTab={ir} />
        <p className="mb-2 font-hand">{NOTA_ESCUADRA}</p>
        <ul className="space-y-1 font-hand text-sm">
          {[...s.diario].reverse().map((d, i) => (
            <li key={i}>
              Día {d.dia} {horaDe(d.min)} · {d.texto}
            </li>
          ))}
        </ul>
      </Marco>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "libreta") {
    const lib = libreta(s);
    return (
      <Marco titulo="Libreta · Nico" onCerrar={cerrar} hoja alto={ALTO_OFICINA}>
        <Pestanas tab="libreta" onTab={ir} />
        <ul className="mb-3 space-y-1 font-hand text-sm">
          {REGLAS_LIBRETA.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="mb-3 border-2 border-dashed border-tinta/60 p-2 font-hand text-sm">
          <p>
            <span className="font-bold">Cuadrilla sugerida: </span>
            {lib.sugerencia}
          </p>
          <p className="mt-1">
            <span className="font-bold">Días de caja: </span>
            {lib.diasCaja || `La caja paga ${diasDeCaja(s) >= 99 ? "todo" : `${diasDeCaja(s)} días`} de nómina con la cuadrilla de hoy. Si baja a 4 o menos, avisa al amanecer.`}
          </p>
        </div>
        <ListaFilas s={s} />
        <div className="mt-4">
          <Plata lib={lib} s={s} angosta={angosta} abierta={partidaAbierta} onAbre={setPartidaAbierta} />
        </div>
        <ul className="mt-4 font-hand">
          {tramos(s).map((t) => (
            <li key={t.nombre} className="flex justify-between gap-2 border-b border-tinta/20 py-1">
              <span>
                {t.nombre} · {t.nota}
              </span>
              <span className={t.cobrado ? "text-colmado-verde" : "text-mar"}>
                {peso(t.monto)} {t.cobrado ? "cobrado" : "pendiente"}
              </span>
            </li>
          ))}
        </ul>
      </Marco>
    );
  }

  if (s.panel === "cuadrilla") {
    const lista = [
      ...s.gente.map((g) => ({ g, manana: false })),
      ...s.reserva.map((g) => ({ g, manana: true })),
    ];
    return (
      <Marco titulo="Cuadrilla" onCerrar={cerrar} alto={ALTO_OFICINA}>
        {lista.length === 0 ? <p className="font-hand">Nadie contratado. Contrata en la oficina.</p> : null}
        <ul className="flex flex-col gap-3">
          {lista.map(({ g, manana }) => (
            <li key={g.id} className="min-h-[9.5rem] border-2 border-tinta p-2">
              <div className="flex flex-wrap items-center gap-2">
                <Retrato oficio={g.oficio} letra={g.nombre.slice(0, 1)} />
                <div className="min-w-0 flex-1">
                  <div className="font-hand">
                    {g.nombre} {g.apellido} · {OFICIO_NOMBRE[g.oficio]}
                    {manana ? " · entra mañana" : ""}
                    {g.falto ? " · no vino" : ""}
                    {g.fuera ? " · ya se fue" : ""}
                  </div>
                  <div className="min-h-5 font-hand text-sm">{lineaFicha(s, g) ?? "\u00a0"}</div>
                  <div className="font-hand text-sm text-mar">
                    Cansancio {Math.round(g.cansancio)} · ánimo {Math.round(g.animo ?? 100)} · jornal {peso(jornalDe(g.oficio, g.rinde))} · {MANIA_INFO[g.mania].nombre}
                  </div>
                </div>
              </div>
              <p className="mt-2 font-hand text-sm">Puesto</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {puestosDe(g.oficio).map((p) => {
                  const on = (g.puesto ?? null) === p.id;
                  return (
                    <button
                      key={p.nombre}
                      type="button"
                      className={on ? btnPri : btn}
                      onClick={() => {
                        if (on) return;
                        act((st) => asignar(st, g.id, p.id));
                      }}
                    >
                      {p.nombre}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {!manana ? (
                  <button type="button" className={btn} onClick={() => act((st) => marcarLibre(st, g.id, !g.libre))}>
                    {g.libre ? "Sí viene mañana" : "Libre mañana"}
                  </button>
                ) : null}
                <button type="button" className={btn} onClick={() => act((st) => despedir(st, g.id))}>
                  Despedir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Marco>
    );
  }

  if (s.panel === "despacho") {
    const n = nominaPendiente(s);
    return (
      <Marco titulo="Despachar" ancho="max-w-md">
        <p className="font-hand text-lg">
          Son las {horaDe(s.minuto)}. Si los despachas, el día se paga completo ({peso(n)}). ¿Despachar?
        </p>
        {mezclaDeNoche(s) > 0 ? (
          <p className="mt-2 border-2 border-colmado-rojo p-1 font-hand text-colmado-rojo" data-mezcla-noche>
            Ojo: hay mezcla hecha. Si se queda de noche, se perderá la mezcla de {peso(mezclaDeNoche(s))}. Gástala antes de despachar.
          </p>
        ) : null}
        <SinTarea s={s} act={act} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnPri} onClick={() => act((st) => confirmarDespacho(st))}>
            Despachar
          </button>
          <button type="button" className={btn} onClick={() => act((st) => seguirJornada(st))}>
            Seguir
          </button>
        </div>
      </Marco>
    );
  }

  if (freno && (s.panel === "sita" || s.panel === "ferreteria")) {
    const cuenta = cuentaPedido(s, freno.total);
    const paga = cuenta.pagaCaja;
    const puede = cuenta.alcanza || paga;
    return (
      <Marco titulo="Antes de pedir" ancho="max-w-md" onCerrar={() => setFreno(null)}>
        {freno.origen === "sita" && faltaEnPedido(s, s.sita?.oferta?.items).length ? (
          <p className="mb-2 border-2 border-colmado-rojo p-1 font-hand text-colmado-rojo" data-incompleto>
            Ojo: este pedido no trae todo. Falta: {faltaEnPedido(s, s.sita?.oferta?.items).join(", ")}.
          </p>
        ) : null}
        <ul className="space-y-1 font-hand text-lg">
          <li>Caja {pesoCaja(cuenta.caja)}</li>
          <li>− pedido {peso(cuenta.pedido)}</li>
          <li>
            − nómina de hoy {peso(cuenta.nomina)} (jornales {peso(cuenta.jornales)}, herramienta {peso(cuenta.herramienta)}, Dirección{" "}
            {peso(cuenta.direccion)})
          </li>
          {cuenta.deuda > 0.5 ? <li>− deuda de nómina de ayer {peso(cuenta.deuda)}</li> : null}
          {cuenta.usaAdelanto ? <li>+ adelanto {peso(cuenta.adelanto)}</li> : null}
          <li>= libre {pesoCaja(cuenta.libre)}</li>
        </ul>
        {cuenta.usaAdelanto ? (
          <p className="mt-2 font-hand">Usa el adelanto de Doña Carmen: {peso(cuenta.adelanto)}. En esta obra no habrá otro.</p>
        ) : null}
        {!cuenta.alcanza && paga ? (
          <p className="mt-2 font-hand">
            Pedir lo que alcanza. La caja paga este pedido. La nómina quedará corta por {peso(cuenta.faltaNomina)}.
          </p>
        ) : null}
        {!cuenta.alcanza && !paga ? (
          <p className="mt-2 font-hand">No alcanza la caja para este pedido. {textoCajaLibre(s)}.</p>
        ) : null}
        {!cuenta.alcanza && paga ? (
          <label className="mt-2 flex min-h-11 items-center gap-2 border-2 border-colmado-rojo p-1 font-hand text-colmado-rojo" data-confirma-corta>
            <input type="checkbox" className="h-6 w-6" checked={aceptaCorta} onChange={(e) => setAceptaCorta(e.target.checked)} />
            Entiendo: la nómina de las 3 quedará corta por {peso(cuenta.faltaNomina)}, baja el ánimo y dos días seguidos se va un obrero.
          </label>
        ) : null}
        {cuentaFiado(s) ? (
          <button type="button" className={`${btn} mt-2`} data-fiar {...alToque(() => { setFreno(null); act((st) => void fiar(st)); })}>
            Mejor fiado: lo de esta etapa ({peso(cuentaFiado(s)!.total)}), sale del próximo cobro
          </button>
        ) : null}
        {!puede && freno.items && cuentaFiadoPedido(s, freno.items, freno.urgente) ? (
          <button
            type="button"
            className={`${btnPri} mt-2`}
            data-fiar-pedido
            {...alToque(() => {
              const f = freno;
              setFreno(null);
              act((st) => decir(st, fiarPedido(st, f.items!, f.urgente)));
            })}
          >
            Que lo fíe el guardalmacén: este pedido ({peso(cuentaFiadoPedido(s, freno.items, freno.urgente)!.total)}), sale del próximo cobro
          </button>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnPri} disabled={!puede || (!cuenta.alcanza && !aceptaCorta)} {...alToque(() => confirmarFreno())}>
            {cuenta.alcanza ? "Confirmar" : paga ? "Pedir lo que alcanza" : "No alcanza la caja"}
          </button>
          <button type="button" className={btn} onClick={() => setFreno(null)}>
            Cancelar
          </button>
        </div>
      </Marco>
    );
  }

  if (s.panel === "sita" && s.sita?.oferta) {
    const of = s.sita.oferta;
    const compra = of.recorte ? (of.cabe ?? {}) : of.items;
    const pedido = !!of.hecho || !Object.values(compra).some((n) => (n ?? 0) > 0);
    return (
      <Marco titulo="Guardalmacén" ancho="max-w-md" onCerrar={cerrar}>
        <p className="font-hand text-lg whitespace-pre-line">{of.texto.replace(/Caja libre [^\n]*?(?=\.( |\n|$))/g, () => textoCajaLibre(s))}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {pedido ? null : (
            <button
              type="button"
              className={btnPri}
              {...alToque(() => {
                const nota = s.sita?.oferta;
                if (!nota) return;
                const lote = nota.recorte ? (nota.cabe ?? {}) : nota.items;
                const mats = Object.entries(lote).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0);
                setFreno({ origen: "sita", urgente: nota.urgente, total: mats + fleteDe(s, nota.urgente), items: lote });
              })}
            >
              {of.comeNomina || of.recorte ? "Pedir lo que alcanza" : "Pedir"}
            </button>
          )}
          {cuentaFiado(s) ? (
            <p className="w-full border-2 border-colmado-rojo p-1 font-hand text-sm" data-salida-sita>
              Siempre hay salida: te fío lo que falta para sellar esta etapa. Doña Carmen me lo paga del próximo cobro.
            </p>
          ) : null}
          {cuentaFiado(s) ? (
            <button type="button" className={btnPri} data-fiar onClick={() => act((st) => void fiar(st))}>
              Fiado: lo de esta etapa ({peso(cuentaFiado(s)!.total)})
            </button>
          ) : null}
          {of.siguiente &&
          Object.values(of.siguiente).some((n) => (n ?? 0) > 0) &&
          cuentaPedido(
            s,
            Object.entries(of.siguiente).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0) + fleteDe(s, of.urgente),
          ).alcanza ? (
            <button
              type="button"
              className={btn}
              onClick={() => {
                const matsSig = Object.entries(of.siguiente ?? {}).reduce(
                  (a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio,
                  0,
                );
                setFreno({ origen: "tambien", urgente: of.urgente, total: matsSig + fleteDe(s, of.urgente) });
              }}
            >
              {pedido && !of.hecho ? "Pedir la siguiente etapa" : "Pedir también"}
            </button>
          ) : null}
          {pedido ? null : (
            <button
              type="button"
              className={btn}
              onClick={() => {
                act((st) => {
                  rechazarSita(st);
                });
              }}
            >
              Ahora no
            </button>
          )}
          {pedido ? null : (
            <button
              type="button"
              className={btn}
              onClick={() => {
                act((st) => {
                  editarSita(st);
                });
              }}
            >
              Editar
            </button>
          )}
          {pedido ? (
            <button type="button" className={btn} onClick={cerrar}>
              Listo
            </button>
          ) : null}
        </div>
        <h3 className="mt-4 font-display text-2xl">En obra</h3>
        <RegistroAlmacen s={s} />
      </Marco>
    );
  }

  if (s.panel === "sita") {
    const hoja = hojaGuardalmacen(s);
    return (
      <Marco titulo="Guardalmacén" ancho="max-w-md" onCerrar={cerrar}>
        <p className="font-hand text-lg whitespace-pre-line">{hoja.texto}</p>
        <h3 className="mt-4 font-display text-2xl">En obra</h3>
        <RegistroAlmacen s={s} />
      </Marco>
    );
  }

  if (s.panel === "ferreteria") {
    let mats = 0;
    for (const k of COMPRA) mats += (cart[k] ?? 0) * MATERIALES[k].precio;
    const fleteNormal = fleteDe(s, false);
    const fleteUrg = fleteDe(s, true);
    const urgenteOk = s.minuto < 12 * 60;
    return (
      <Marco titulo="Ferretería El Cruce" onCerrar={cerrar}>
        <p className="font-hand text-sm">
          {textoCajaLibre(s)}. Flete normal {fleteNormal < FLETE ? `va en el camión (${peso(fleteNormal)})` : peso(FLETE)}, entrega{" "}
          {textoLlegada(s, false).replace(/^llega /, "")}. Urgente {fleteUrg < FLETE_URGENTE ? `va en el camión (${peso(fleteUrg)})` : peso(FLETE_URGENTE)}, solo
          antes de las 12, llega en 3 horas.
        </p>
        {s.pedidos.length > 0 ? (
          <ul className="mt-2 font-hand text-sm">
            {s.pedidos.map((p) => (
              <li key={p.id}>
                Camión {p.urgente ? "urgente" : "normal"} · día {p.dia} a las {horaDe(p.minuto)}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3">
          <table className="w-full border-collapse font-hand text-sm">
            <thead>
              <tr className="border-b border-tinta text-left">
                <th className="py-1">Material</th>
                <th>Precio</th>
                <th>Pedido</th>
              </tr>
            </thead>
            <tbody>
              {COMPRA.map((k) => {
                const def = MATERIALES[k];
                return (
                  <tr key={k} className="border-b border-tinta/20">
                    <td className="max-w-[8.5rem] py-1 pr-1">
                      {def.nombre}
                      <span className="text-mar"> · {def.unidad}</span>
                    </td>
                    <td className="whitespace-nowrap pr-1">{peso(def.precio)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <input
                          aria-label={`Cantidad de ${def.nombre}`}
                          inputMode="decimal"
                          className="w-20 border border-tinta bg-cemento-claro px-1 py-1 text-right font-hand text-tinta"
                          value={textoCant(k)}
                          onChange={(e) => fijar(k, e.target.value)}
                        />
                        <button type="button" className={btn + " px-2"} aria-label={`Quitar ${def.nombre}`} onClick={() => fijar(k, "")}>
                          X
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-display text-3xl">
          Material {peso(mats)}
          {mats <= 0 ? "" : fleteNormal < FLETE ? ` · va en el camión ${peso(mats + fleteNormal)}` : ` · con flete ${peso(mats + fleteNormal)}`}
        </p>
        {nota ? <p className={"font-hand " + (notaRoja ? "text-colmado-rojo" : "text-tinta")}>{nota}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            onClick={() => {
              let q: Cantidades = {};
              let avisoFalta = "";
              act((st) => {
                marcarLoQueFalta(st);
                const aj = ajusteLoQueFalta(st);
                q = aj.items;
                avisoFalta = aj.nota;
              });
              setCart(q);
              setDraft({});
              ponerNota(avisoFalta, avisoFalta.startsWith("No alcanza"));
            }}
          >
            Lo que falta
          </button>
          <button type="button" className={btnPri} {...alToque(() => mandar(false))}>
            Flete normal
          </button>
          <button type="button" className={btnPri} disabled={!urgenteOk} {...alToque(() => mandar(true))}>
            Urgente
          </button>
        </div>
      </Marco>
    );
  }

  function textoCant(k: Mat): string {
    if (draft[k] !== undefined) return draft[k]!;
    const n = cart[k];
    return n ? String(n) : "";
  }

  function fijar(k: Mat, raw: string) {
    const t = raw.replace(",", ".");
    setDraft((d) => ({ ...d, [k]: t }));
    if (t === "" || t === ".") {
      setCart((c) => {
        const next = { ...c };
        delete next[k];
        return next;
      });
      return;
    }
    if (!/^\d*\.?\d*$/.test(t)) return;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return;
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[k];
      else next[k] = Math.round(n * 1000) / 1000;
      return next;
    });
  }

  function confirmarFreno() {
    const f = freno;
    if (!f) return;
    const cuenta = cuentaPedido(s, f.total);
    if (!cuenta.alcanza && !cuenta.pagaCaja) return;
    setFreno(null);
    if (cuenta.usaAdelanto && cuenta.alcanza) {
      let malo: string | null = null;
      act((st) => {
        malo = adelantar(st, f.total);
        if (malo) decir(st, malo);
      });
      if (malo) return;
    }
    if (f.origen === "tambien") act((st) => decir(st, pedirTambien(st)));
    else if (f.origen === "sita") {
      act((st) => {
        decir(st, aceptarSita(st));
      });
    } else mandar(f.urgente, true);
  }

  function mandar(urgente: boolean, forzado = false) {
    let matsAhora = 0;
    for (const k of COMPRA) matsAhora += (cart[k] ?? 0) * MATERIALES[k].precio;
    const total = matsAhora > 0 ? matsAhora + fleteDe(s, urgente) : 0;
    if (!forzado) {
      if (total <= 0) {
        ponerNota("Nada que pedir.", true);
        return;
      }
      setFreno({ origen: "tel", urgente, total, items: { ...cart } });
      return;
    }
    let err: string | null = null;
    const conBlock = (cart.block ?? 0) > 0;
    act((st) => {
      err = pedir(st, cart, urgente);
      decir(st, err);
    });
    if (!err) {
      setCart({});
      setDraft({});
      const cuando = textoLlegada(s, urgente);
      if (urgente && cuando.startsWith("llega a las")) ponerNota("El camión salió. Llega en 3 horas.");
      else if (!urgente && cuando === "llega mañana 7:30" && conBlock)
        ponerNota("Llega mañana 7:30. El block empieza cuando llegue.");
      else ponerNota(`Pedido hecho. ${cuando.charAt(0).toUpperCase()}${cuando.slice(1)}.`);
    } else ponerNota(err, true);
  }

  if (s.panel === "libreta" || s.panel === "almacen") {
    const lib = libreta(s);
    const alm = s.panel === "almacen" ? almacen(s) : lib.almacen;
    const pestana = s.panel === "almacen" ? "alm" : tab;
    return (
      <Marco titulo={s.panel === "almacen" ? "Almacén" : "Libreta"} onCerrar={cerrar} hoja alto={ALTO_OFICINA}>
        {s.panel === "libreta" ? (
          <div className="mb-3 grid grid-cols-3 gap-1">
            {(
              [
                ["pre", "Plata"],
                ["dia", "Diario"],
                ["lista", "Lista"],
                ["alm", "Almacén"],
                ["con", "Contrato"],
                ["plano", "Plano"],
              ] as const
            ).map(([id, nombre]) => (
              <button
                key={id}
                type="button"
                className={(tab === id ? btnPri : btn) + " min-h-11 px-1 py-1 text-sm leading-tight"}
                onClick={() => setTab(id)}
              >
                {nombre}
              </button>
            ))}
          </div>
        ) : null}
        {pestana === "pre" ? <Plata lib={lib} s={s} angosta={angosta} abierta={partidaAbierta} onAbre={setPartidaAbierta} /> : null}
        {pestana === "dia" ? (
          <div>
            <p className="mb-2 font-hand">{NOTA_ESCUADRA}</p>
            <ul className="space-y-1 font-hand text-sm">
            {[...lib.diario].reverse().map((d, i) => (
              <li key={i}>
                Día {d.dia} {horaDe(d.min)} · {d.texto}
              </li>
            ))}
            </ul>
          </div>
        ) : null}
        {pestana === "lista" ? <ListaFilas s={s} /> : null}
        {pestana === "alm" ? (
          <div>
            <RegistroAlmacen s={s} />
            <ul>
              {alm.filas.map((f) => (
                <li key={f.clave} className="flex items-baseline justify-between gap-2 border-b border-tinta/15 py-1 font-hand text-sm">
                  <span className="truncate">{f.nombre}</span>
                  <span className="shrink-0">
                    {num(f.en, angosta ? 1 : 2)} {f.unidad}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-hand text-sm">Libre {peso(alm.valorLibre)}.</p>
          </div>
        ) : null}
        {pestana === "con" ? (
          <ul className="font-hand">
            {tramos(s).map((t) => (
              <li key={t.nombre} className="flex justify-between gap-2 border-b border-tinta/20 py-1">
                <span>
                  {t.nombre} · {t.nota}
                </span>
                <span className={t.cobrado ? "text-colmado-verde" : "text-mar"}>
                  {peso(t.monto)} {t.cobrado ? "cobrado" : "pendiente"}
                </span>
              </li>
            ))}
            <li className="pt-2">
              Cobrado {peso(s.cobrado)} de {peso(precioDe(s))}
            </li>
          </ul>
        ) : null}
        {pestana === "plano" ? (
          <ol className="space-y-2">
            {ETAPAS.map((e, i) => {
              const hecha = i < s.etapa || s.entregada;
              const ahora = i === s.etapa && !s.entregada;
              return (
                <li key={e.id} className="border-b border-tinta/20 pb-1">
                  <div className="font-hand">
                    {hecha ? "Lista · " : ahora ? "Ahora · " : ""}
                    {e.n}. {e.nombre}
                  </div>
                  <p className="font-hand text-sm text-mar">{e.regla}</p>
                </li>
              );
            })}
          </ol>
        ) : null}
      </Marco>
    );
  }

  if (s.panel === "sello" && s.sello) {
    const ok = s.sello.ok;
    const etapa = s.sello.etapa;
    const cobra = (ETAPAS[etapa]?.tramo ?? 0) > 0;
    let proximo = "";
    if (!cobra) {
      for (let i = etapa + 1; i < ETAPAS.length; i++) {
        if ((ETAPAS[i]?.tramo ?? 0) > 0) {
          proximo = ETAPAS[i]!.nombre;
          break;
        }
      }
    }
    const linea = cobra
      ? `Cobra ${s.sello.cobroTexto ?? cobroDe(s, etapa).texto}`
      : proximo
        ? `Esta etapa no cobra; el próximo cobro es al aprobar ${proximo}`
        : "Esta etapa no cobra";
    return (
      <div className="fixed inset-0 z-40" onPointerUp={(e) => onTocarSello?.(e.clientX, e.clientY)}>
        <div ref={selloAncla} className="pointer-events-none absolute" style={{ left: "50%", top: "46%" }}>
          <div className="absolute -translate-x-1/2 -translate-y-[58%]">
            <div
              className={
                "sello-caer plancha w-[min(92vw,28rem)] border-8 px-4 py-4 text-center shadow-[3px_3px_0_#1B1F23] " +
                (ok ? "border-colmado-verde text-colmado-verde" : "border-colmado-rojo text-colmado-rojo")
              }
            >
              <div className="font-hand text-sm tracking-widest text-tinta">JUNTA DE VECINOS</div>
              <div className="w-full max-w-[92vw] font-display text-3xl leading-none break-words sm:text-6xl">{ok ? "APROBADO" : "OBSERVADO"}</div>
              <p className="mt-2 font-hand text-xl text-tinta">{s.sello.nombre}</p>
              <p className="font-hand text-tinta">{s.sello.motivo}</p>
              <p className="mt-3 font-hand text-lg text-tinta">{linea}</p>
              <p className="mt-3 font-hand text-base text-tinta">Toca para seguir</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (s.panel === "nomina") {
    return (
      <Marco titulo="La nómina no alcanza">
        <p className="font-hand">
          Hoy la nómina es {peso(desgloseNomina(s).total + (s.deudaNomina ?? 0))} y la caja tiene {pesoCaja(s.caja)}: faltan{" "}
          <b data-falta-nomina>{peso(Math.max(0, desgloseNomina(s).total + (s.deudaNomina ?? 0) - Math.max(0, s.caja)))}</b>. Se paga lo que haya. Lo que falte queda de deuda para mañana y baja el ánimo. Dos días
          seguidos, un obrero se va.
        </p>
        {(s.deudaNomina ?? 0) > 0.5 ? <p className="mt-2 font-hand">Deuda de ayer: {peso(s.deudaNomina)}.</p> : null}
        {puedeRescate(s) ? <p className="mt-2 font-hand">{fraseRescate(s)}</p> : null}
        {!puedeAdelantar(s) && !puedeRescate(s) ? (
          <p className="mt-2 font-hand">
            Sin adelanto: {adelantoUsado(s) ? "Doña Carmen ya soltó el adelanto de esta obra. No hay otro." : razonAdelanto(s) || "Doña Carmen no adelanta hoy."}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {puedeRescate(s) ? (
            <button type="button" className={btnPri} onClick={() => act((st) => aceptarRescate(st))}>
              Aceptar la mitad de la etapa
            </button>
          ) : null}
          {puedeAdelantar(s) ? (
            <button type="button" className={btnPri} onClick={() => act((st) => confirmarNomina(st, true))}>
              Pedir adelanto y pagar
            </button>
          ) : null}
          <button type="button" className={puedeAdelantar(s) || puedeRescate(s) ? btn : btnPri} onClick={() => act((st) => confirmarNomina(st, false))}>
            Pagar lo que haya
          </button>
        </div>
      </Marco>
    );
  }

  if (s.panel === "finde") {
    if (s.descanso) {
      const nota = [...s.diario].reverse().find((d) => d.texto.startsWith("Domingo:"));
      return (
        <Marco titulo="Domingo" ancho="max-w-lg">
          <p className="font-hand text-lg">{nota?.texto ?? "Domingo: descanso. Nadie trabaja."}</p>
          <p className="mt-2 font-hand">Toca para seguir el lunes. No se salta un día sin este aviso.</p>
          <button type="button" className={`${btnPri} mt-4 w-full`} onClick={() => act((st) => siguienteDia(st))}>
            Al lunes
          </button>
        </Marco>
      );
    }
    const domingo = esDomingo(s.dia + 1);
    const pagada = s.nominaHoy > 0 ? s.nominaHoy : s.gente.reduce((a, g) => a + (g.activo && !g.falto ? jornalDe(g.oficio, g.rinde) : 0), 0);
    const herr = Math.round(s.herrHoy ?? 0);
    const direccion = s.direccionCobrada && !esDomingo(s.dia) ? DIRECCION_DIA : 0;
    return (
      <Marco titulo="Fin del día" ancho="max-w-lg">
        <p className="font-display text-4xl">{pesoCaja(s.caja)}</p>
        <p className="font-hand">Nómina {peso(pagada)}</p>
        <p className="font-hand">Herramienta {peso(herr)}</p>
        {direccion > 0 ? <p className="font-hand">Dirección {peso(direccion)}</p> : null}
        <p className="font-hand">
          Total {peso(pagada + herr + direccion)} = jornales {peso(pagada)} + herramienta {peso(herr)} + Dirección {peso(direccion)}
        </p>
        <details className="font-hand text-sm">
          <summary className="min-h-11 cursor-pointer py-2">Jornal de cada uno</summary>
          <ul>
            {s.gente
              .filter((g) => g.activo && !g.falto)
              .map((g) => (
                <li key={g.id}>
                  {g.nombre} ({OFICIO_NOMBRE[g.oficio]}): {peso(jornalDe(g.oficio, g.rinde))}
                </li>
              ))}
          </ul>
        </details>
        {(s.perdidasHoy ?? []).length ? (
          <div className="font-hand text-sm" data-perdidas>
            <p>Pérdidas de hoy (ya van en su partida):</p>
            <ul className="list-disc pl-5">
              {(s.perdidasHoy ?? []).map((p, i) => (
                <li key={i}>
                  {p.texto}: {peso(p.pesos)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {(s.deudaNomina ?? 0) > 0.5 ? (
          <p className="font-hand">Deuda de nómina {peso(s.deudaNomina)}. Pasa a mañana y el ánimo ya bajó.</p>
        ) : null}
        {(s.rachaCorta ?? 0) === 1 ? <p className="font-hand">Un día con la nómina corta. Si mañana se repite, alguien se va.</p> : null}
        <SinTarea s={s} act={act} />
        {s.mezclas.length > 0 ? <p className="font-hand">Hay mezcla en el trompo. Si duermes, se pierde.</p> : null}
        {Math.round(s.mezclaTarde ?? 0) >= 1 ? (
          <p className="font-hand">Mezcla vencida después de las 3: {peso(s.mezclaTarde)}</p>
        ) : null}
        <p className="font-hand">
          Etapas selladas: {s.etapas.filter((e) => e.sello === "aprobado").length} de 9.
          {domingo ? " Mañana es domingo: primero verás el descanso." : ""}
        </p>
        <p className="font-hand">{lineaAhora(s)}</p>
        <h3 className="mt-3 font-display text-2xl">Cansancio</h3>
        <ul className="font-hand text-sm">
          {s.gente.map((g) => (
            <li key={g.id} className="flex items-center gap-2">
              <span>
                {g.nombre}
                {` · cansancio ${Math.round(g.cansancio)}`}
                {g.cansancio >= 85 ? " · frito: mañana no viene y no cobra" : g.cansancio >= 70 ? " · cansado (frito desde 85)" : ""}
                {g.libre ? " · libre mañana" : ""}
                {` · ánimo ${Math.round(g.animo ?? 100)}`}
              </span>
              <Gotas n={gotasDe(g.cansancio)} />
            </li>
          ))}
        </ul>
        {s.lluvias.some((r) => r.dia === s.dia && r.cae !== false) ? (
          <p className="mt-2 font-hand text-sm">
            Día de lluvia: se fueron a las {horaDe(s.salidaMin >= 0 ? s.salidaMin : s.minuto)} y el jornal se paga completo
          </p>
        ) : null}
        {s.faltanManana.length > 0 ? (
          <>
            <h3 className="mt-2 font-display text-2xl">Quién falta mañana</h3>
            <ul className="font-hand text-sm">
              {s.faltanManana.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        ) : esSabado(s.dia) || domingo ? null : (
          <p className="mt-2 font-hand text-sm">Mañana viene la cuadrilla. Si la nómina queda corta, queda deuda y baja el ánimo.</p>
        )}
        <p className="font-hand text-sm">{textoDiasSinSello(s)}</p>
        {s.notaNomina ? <p className="mt-2 font-hand text-sm">{s.notaNomina}</p> : null}
        {puedeRescate(s) ? (
          <div className="mt-2">
            <p className="font-hand text-sm">{fraseRescate(s)}</p>
            <button type="button" className={`${btnPri} mt-2`} onClick={() => act((st) => aceptarRescate(st))}>
              Aceptar la mitad de la etapa
            </button>
          </div>
        ) : null}
        <p className="mt-2 font-hand text-sm">{pronosticoDia(s, 0)}</p>
        <p className="font-hand text-sm">{pronosticoDia(s, 1)}</p>
        {mezclaDeNoche(s) > 0 ? (
          <p className="mb-2 border-2 border-colmado-rojo p-1 font-hand text-colmado-rojo" data-mezcla-noche>
            Se perderá la mezcla de {peso(mezclaDeNoche(s))}: la mezcla hecha no aguanta la noche.
          </p>
        ) : null}
        <button type="button" className={`${btnPri} mt-4 w-full`} onClick={() => act((st) => siguienteDia(st))}>
          Amanecer
        </button>
      </Marco>
    );
  }

  if (s.panel === "informe" || s.panel === "perdida") {
    const inf = informe(s);
    const perdida = s.panel === "perdida";
    const muerto = inf.filas.find((f) => f.partida === "muerto");
    const notaIng =
      [...s.etapas].reverse().find((e) => e.motivo)?.motivo ||
      (s.desplomes > 0 ? "La ingeniera observó un desplome." : "Ta' derecho. La caseta quedó en pie.");
    if (!perdida) {
      return (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-noche/80 p-2 sm:items-center sm:p-6">
          <section className="marco-obra plancha max-h-[94dvh] w-full max-w-lg overflow-y-auto border-2 border-tinta p-4 text-tinta shadow-[3px_3px_0_#1B1F23]">
            <svg viewBox="0 0 360 200" className="mx-auto w-full" aria-hidden="true">
              <rect width="360" height="200" fill="#9FD6F2" />
              <path d="M40 150 L28 108 L150 48 L250 108 L236 150 Z" fill="#E9E5DC" stroke="#1B1F23" strokeWidth="2" />
              <path d="M24 110 L148 42 L256 112" fill="none" stroke="#A7B0B6" strokeWidth="6" />
              <path d="M24 110 L148 42 L256 112" fill="none" stroke="#1B1F23" strokeWidth="1.4" />
              <path d="M118 150 L118 112 L156 112 L156 150 Z" fill="#1B1F23" stroke="#1B1F23" strokeWidth="1.6" />
              <path d="M176 96 L198 100 L196 122 L174 118 Z" fill="#2E9BD6" stroke="#1B1F23" strokeWidth="1.4" />
              <path d="M36 140 L244 144" stroke="#D7322B" strokeWidth="3" />
              <circle cx="292" cy="132" r="16" fill="#E9E5DC" stroke="#1B1F23" strokeWidth="1.4" />
              <path d="M276 168 C274 146 280 138 292 136 C308 138 314 148 312 168 Z" fill="#E8569B" stroke="#1B1F23" strokeWidth="1.4" />
              <path d="M278 128 C278 116 286 110 292 110 C304 112 308 120 306 128 Z" fill="#1B1F23" />
              <rect x="318" y="148" width="16" height="6" rx="1" fill="#F6C928" stroke="#1B1F23" strokeWidth="1" />
              <circle cx="332" cy="151" r="2" fill="#1B1F23" />
              <rect x="196" y="46" width="156" height="42" rx="2" fill="#F6C928" stroke="#1B1F23" strokeWidth="1.4" />
              <text x="274" y="64" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="14" fill="#1B1F23">
                Quedó bonita,
              </text>
              <text x="274" y="80" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="14" fill="#1B1F23">
                maestro
              </text>
            </svg>
            <h2 className="font-display text-2xl leading-tight break-words sm:text-4xl">Entrega</h2>
            {s.cierre ? (
              <div className="mt-2 border-2 border-tinta p-2 font-hand text-base" data-cierre>
                <p className="font-display text-xl">Cuenta de la caja al entregar</p>
                <ul className="space-y-0.5">
                  {lineasCierre(s.cierre).map((l, i) => (
                    <li key={i} className={`flex justify-between gap-2 ${l.total ? "border-t border-tinta pt-0.5 font-bold" : ""}`} data-linea-cierre>
                      <span>{l.texto}</span>
                      <span className="whitespace-nowrap">{i === 0 || l.total ? pesoCaja(l.monto) : peso(Math.abs(l.monto))}</span>
                    </li>
                  ))}
                  <li className="text-sm">Multas: {peso(0)} (las pérdidas de mezcla ya van en el costo, no salen de la caja).</li>
                  {s.cierre.quedaDebiendo > 0.5 ? <li className="text-colmado-rojo">Queda debiendo a la cuadrilla {peso(s.cierre.quedaDebiendo)}.</li> : null}
                </ul>
              </div>
            ) : null}
            <ul className="mt-2 space-y-1 font-hand text-base">
              <li>Días {inf.dias}</li>
              <li>Costo total {peso(inf.costo)}</li>
              <li>{inf.ganancia >= 0 ? `Ganancia ${peso(inf.ganancia)}` : `Pérdida ${peso(-inf.ganancia)}`}</li>
              <li>Tiempo muerto (jornal pagado sin trabajo) {peso(muerto?.real ?? 0)}</li>
              {inf.bono > 0 ? <li>Bono por entrega temprana {peso(inf.bono)}</li> : <li>Sin bono: se entregó el día {PLAZO_ENTREGA} o después</li>}
              <li>Desplomes {s.desplomes}</li>
              <li>Ingeniera: {notaIng}</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={btnPri} onClick={() => act((st) => abrirPanel(st, "libreta"))}>
                Ver Libreta
              </button>
              <button type="button" className={btn} onClick={quiereNueva}>
                Otra obra
              </button>
            </div>
          </section>
        </div>
      );
    }
    const pct = inf.presupuesto > 0 ? (inf.costo / inf.presupuesto - 1) * 100 : 0;
    return (
      <Marco titulo={perdida ? "Obra perdida" : "Informe final"} ancho="max-w-3xl">
        <p className="font-hand">
          {perdida
            ? "No quedó nadie trabajando. La obra se perdió."
            : "Doña Carmen ya tiene su caseta."}
        </p>
        {perdida
          ? (() => {
              const c = causasPerdida(s);
              return (
                <div className="mt-2 border-2 border-colmado-rojo/60 p-2 font-hand text-sm" data-causas>
                  <p className="font-bold">Por qué se perdió (del diario)</p>
                  {c.salidas.length ? (
                    <ul className="mt-1 list-disc pl-5">
                      {c.salidas.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nadie se fue por la nómina.</p>
                  )}
                  {c.cortas.length ? (
                    <>
                      <p className="mt-1 font-bold">Nóminas cortas: {c.cortas.length}</p>
                      <ul className="list-disc pl-5">
                        {c.cortas.slice(-6).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {c.deuda > 0.5 ? <p className="mt-1">Deuda de nómina al cerrar: {peso(c.deuda)}.</p> : null}
                </div>
              );
            })()
          : null}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Dato etiqueta="Días" valor={String(inf.dias)} />
          <Dato etiqueta="Costo" valor={peso(inf.costo)} />
          {perdida ? (
            <Dato etiqueta="Pérdida" valor={peso(Math.abs(s.caja))} rojo />
          ) : (
            <>
              <Dato etiqueta="Vs presupuesto" valor={`${pct >= 0 ? "+" : ""}${num(pct, 1)}%`} />
              <Dato etiqueta={inf.ganancia >= 0 ? "Ganancia" : "Pérdida"} valor={peso(Math.abs(inf.ganancia))} />
            </>
          )}
          <Dato etiqueta="A la primera" valor={`${inf.aprobadasPrimera} / 9`} />
          <Dato etiqueta="Al compás" valor={`${inf.compas}`} />
        </div>
        <ul className="mt-3 font-hand text-sm">
          <li>
            Cemento mojado: {inf.mojado} fundas ({peso(inf.costoMojado)})
          </li>
          <li>
            Tandas perdidas: {num(inf.tandasPerdidas, 1)} ({peso(inf.costoPerdidas)})
          </li>
          <li>Faltas: {inf.faltas}</li>
          {inf.faltasLista.length > 0 ? (
            <ul className="ml-4 max-h-40 overflow-y-auto">
              {inf.faltasLista.map((f, i) => (
                <li key={`${f.dia}-${f.min}-${f.quien}-${i}`}>
                  Día {f.dia} {horaDe(f.min)} · {f.quien} · {f.porque}
                </li>
              ))}
            </ul>
          ) : null}
          <li>Fletes: {inf.fletes} contra 4 del presupuesto</li>
        </ul>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse font-hand text-sm">
            <thead>
              <tr className="border-b border-tinta text-left">
                <th className="py-1">Partida</th>
                <th>Presupuesto</th>
                <th>Real</th>
                <th>Desvío</th>
              </tr>
            </thead>
            <tbody>
              {inf.filas.map((f) => {
                const sin = f.real < 1;
                return (
                  <tr key={f.partida} className="border-b border-tinta/15">
                    <td className="py-1">{f.nombre}</td>
                    <td>{peso(f.pre)}</td>
                    <td>{sin ? "P$0" : peso(f.real)}</td>
                    <td className={sin ? "text-mar" : tonoDesvio(f.real, f.desv)}>{sin ? "sin empezar" : peso(f.desv, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-hand text-mar">Próxima obra: Losa de concreto (bloqueada)</p>
        <button type="button" className={`${btn} mt-3`} onClick={quiereNueva}>
          {perdida ? "Obra nueva" : "Otra caseta"}
        </button>
      </Marco>
    );
  }

  if (s.panel === "pausa" && pausaHoja === "creditos") return <Creditos onVolver={() => setPausaHoja(null)} />;

  if (s.panel === "pausa") {
    const tog = (on: boolean) =>
      on ? "min-h-11 rounded-md border-2 border-tinta bg-colmado-amarillo px-4 font-ui text-base font-bold text-tinta shadow-[3px_3px_0_#1B1F23]" : "min-h-11 rounded-md border-2 border-block-sombra bg-cemento px-4 font-ui text-base font-bold text-tinta";
    return (
      <Marco titulo="Pausa" ancho="max-w-sm" onCerrar={cerrar}>
        <p className="font-hand">El reloj de la obra está parado.</p>
        <p className="mt-3 font-hand">Control: Círculo | Arrastre</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <button type="button" className={tog(ajustes.control !== "arrastre")} onClick={() => onAjustes({ ...ajustes, control: "circulo" })}>
            Círculo
          </button>
          <button type="button" className={tog(ajustes.control === "arrastre")} onClick={() => onAjustes({ ...ajustes, control: "arrastre" })}>
            Arrastre
          </button>
        </div>
        <p className="mt-2 font-hand leading-snug">
          {telefono
            ? "Golpe al compás: pulsa ¡Dale! cuando el anillo brilla dorado y rinde 25 % más."
            : "Golpe al compás: pulsa Espacio (o ¡Dale!) cuando el anillo brilla dorado y rinde 25 % más."}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button type="button" className={btnPri} onClick={cerrar}>
            Seguir
          </button>
          <button type="button" className={btn} onClick={() => setPausaAjustes((v) => !v)}>
            Ajustes
          </button>
          <button type="button" className={btn} onClick={() => setPausaHoja("creditos")}>
            Créditos
          </button>
          {pausaAjustes ? (
            <div className="border-2 border-tinta bg-cemento p-3">
              <p className="font-hand">Sonido</p>
              <div className="mt-1 flex gap-2">
                <button type="button" className={tog(ajustes.sonido)} onClick={() => onAjustes({ ...ajustes, sonido: true })}>
                  Sí
                </button>
                <button type="button" className={tog(!ajustes.sonido)} onClick={() => onAjustes({ ...ajustes, sonido: false })}>
                  No
                </button>
              </div>
              <p className="mt-3 font-hand">Velocidad del reloj</p>
              <div className="mt-1 flex gap-2">
                <button type="button" className={tog(ajustes.vel === 1)} onClick={() => onAjustes({ ...ajustes, vel: 1 })}>
                  x1
                </button>
                <button type="button" className={tog(ajustes.vel === 2)} onClick={() => onAjustes({ ...ajustes, vel: 2 })}>
                  x2
                </button>
              </div>
              <p className="mt-3 font-hand text-sm text-mar">El x2 solo acelera el reloj. No cambia ritmos ni números.</p>
            </div>
          ) : null}
          <button type="button" className={`${btn} mt-6`} onClick={quiereNueva}>
            Empezar de cero
          </button>
        </div>
        {puedeAdelantar(s) ? (
          <button type="button" className={`${btn} mt-2`} onClick={() => act((st) => decir(st, adelantar(st)))}>
            Pedir adelanto a Doña Carmen
          </button>
        ) : null}
      </Marco>
    );
  }

  return null;
}

function cifraCorta(n: number, corto: boolean, signo = false): string {
  if (!corto) return peso(n, signo);
  const v = Math.round(n);
  const neg = v < 0;
  const a = Math.abs(v);
  const cuerpo = a >= 1000 ? `${Math.round(a / 100) / 10}k` : String(a);
  if (neg) return `−P$${cuerpo}`;
  return signo && v > 0 ? `+P$${cuerpo}` : `P$${cuerpo}`;
}

function Plata({
  lib,
  s,
  angosta,
  abierta,
  onAbre,
}: {
  lib: ReturnType<typeof libreta>;
  s: Estado;
  angosta: boolean;
  abierta: string | null;
  onAbre: (id: string | null) => void;
}) {
  const base = Math.max(1, precioDe(s) || CONTRATO);
  const wGas = Math.max(0, Math.min(100, (lib.costo / base) * 100));
  const wPor = Math.max(0, Math.min(100 - wGas, (lib.porHacer / base) * 100));
  const wOro = Math.max(0, 100 - wGas - wPor);
  const tope = Math.max(1, ...lib.filas.map((f) => Math.max(f.pre, f.real)));
  const partes = partesMuerto(s);
  return (
    <div>
      <div className="h-4 w-full overflow-hidden border-2 border-tinta">
        <div className="flex h-full">
          <span className="h-full bg-tinta" style={{ width: `${wGas}%` }} />
          <span className="h-full bg-colmado-rojo/30" style={{ width: `${wPor}%`, backgroundImage: "repeating-linear-gradient(135deg,#D7322B 0 2px,transparent 2px 5px)" }} />
          <span className="h-full bg-colmado-amarillo" style={{ width: `${wOro}%` }} />
        </div>
      </div>
      <p className="mt-1 flex justify-between gap-2 font-hand text-xs">
        <span>Gastado {cifraCorta(lib.costo, angosta)}</span>
        <span>Falta gastar {cifraCorta(lib.porHacer, angosta)}</span>
        <span className="text-tinta">{lib.ganancia >= 0 ? "Ganancia" : "Pérdida"} estimada {cifraCorta(Math.abs(lib.ganancia), angosta)}</span>
      </p>
      <p className="mt-1 font-hand text-xs text-mar">
        Cada fila: gastado de lo presupuestado. «Tiempo muerto» es jornal pagado sin trabajo (espera, lluvia, despacho temprano).
        {" "}La estimación supone que lo que falta cuesta lo presupuestado: cada día de obra de más resta{" "}
        {peso(nominaDiaDe([...s.gente, ...s.reserva].filter((g) => !g.libre)) + DIRECCION_DIA)} (nómina y Dirección).
        {(s.deudaNomina ?? 0) > 0.5 ? ` Debes de nómina ${peso(s.deudaNomina ?? 0)}: ya está en lo gastado; no cambia la ganancia, se paga del próximo cobro o al entregar.` : ""}
        {(s.fiado ?? 0) > 0.5 ? ` Fiado por pagar ${peso(s.fiado ?? 0)}: no cambia la ganancia, solo sale del próximo cobro.` : ""}
        «Acarreo» es mover material de la entrada a la obra.
      </p>
      <ul className="mt-2">
        {lib.filas.map((f) => {
          const hueco = (f.pre / tope) * 100;
          const tinta = (Math.min(f.real, f.pre) / tope) * 100;
          const paso = f.real > f.pre ? ((f.real - f.pre) / tope) * 100 : 0;
          const muerto = f.partida === "muerto";
          const txt =
            f.real < 1 ? "sin empezar" : f.desv > 1 ? cifraCorta(f.desv, angosta, true) : `${cifraCorta(f.real, angosta)} de ${cifraCorta(f.pre, angosta)}`;
          const abierto = abierta === f.partida;
          return (
            <li key={f.partida} className="border-b border-tinta/15 py-1">
              <button type="button" className="flex min-h-11 w-full min-w-0 items-center gap-2 text-left font-hand text-sm" onClick={() => onAbre(abierto ? null : f.partida)}>
                <span className={"w-16 shrink-0 sm:w-24 " + (angosta ? "whitespace-normal text-sm" : "truncate")}>{f.nombre}</span>
                <span className="relative h-3 min-w-0 flex-1">
                  <span className="absolute top-0 h-3 border border-tinta" style={{ width: `${Math.max(hueco, tinta)}%` }} />
                  {muerto ? (
                    <span className="absolute top-0 h-3 bg-colmado-rojo/40" style={{ width: `${(f.real / tope) * 100}%`, backgroundImage: "repeating-linear-gradient(135deg,#D7322B 0 2px,transparent 2px 4px)" }} />
                  ) : (
                    <span className="absolute top-0 h-3 bg-tinta" style={{ width: `${tinta}%` }} />
                  )}
                  {paso > 0 ? (
                    <span className="absolute top-0 h-3 bg-colmado-rojo/50" style={{ left: `${hueco}%`, width: `${paso}%`, backgroundImage: "repeating-linear-gradient(135deg,#D7322B 0 2px,transparent 2px 4px)" }} />
                  ) : null}
                </span>
                <span className="max-w-[46%] shrink-0 text-right text-sm whitespace-normal">{txt}</span>
              </button>
              {abierto && !muerto ? (
                <p className="font-hand text-xs text-mar">
                  Mano {cifraCorta(f.mo, angosta)} · material {cifraCorta(f.mat, angosta)}
                </p>
              ) : null}
              {abierto && muerto ? (
                <div className="mt-1 font-hand text-xs text-tinta">
                  <p>jornal pagado sin trabajo: espera, lluvia o despacho temprano</p>
                  <ul className="mt-1 space-y-1">
                  {partes.length === 0 ? (
                    <li>Todavía no se parte.</li>
                  ) : (
                    partes.map((p) => (
                      <li key={p.id}>
                        <div>
                          {p.nombre} · {num(p.min / 60, 1)} h · {cifraCorta(p.pesos, angosta)}
                        </div>
                        <ul className="ml-3 text-mar">
                          {p.dias.map((d) => (
                            <li key={d.dia}>
                              Día {d.dia} · {num(d.min / 60, 1)} h · {cifraCorta(d.pesos, angosta)}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))
                  )}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Dato({ etiqueta, valor, rojo }: { etiqueta: string; valor: string; rojo?: boolean }) {
  return (
    <div className={"border-2 border-tinta px-2 py-1 " + (rojo ? "text-colmado-rojo" : "")}>
      <div className="font-hand text-xs text-mar">{etiqueta}</div>
      <div className="font-display text-3xl leading-none">{valor}</div>
    </div>
  );
}
