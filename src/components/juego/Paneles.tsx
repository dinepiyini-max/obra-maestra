import { useEffect, useState, type ReactNode, type RefObject } from "react";
import {
  COMPRA,
  CONTRATO,
  CAJA_INICIAL,
  DIRECCION_DIA,
  ETAPAS,
  FLETE,
  FLETE_URGENTE,
  GUARDALMACEN,
  LISTERO,
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
  horaDe,
  jornalDe,
  num,
  peso,
  type Cantidades,
  type Mat,
  type Oficio,
  type Puesto,
} from "@/game/datos";
import {
  adelantar,
  almacen,
  aceptarSita,
  asignar,
  cajaLibre,
  cerrarPanel,
  continuarSello,
  contratar,
  despedir,
  editarSita,
  firmar,
  hablarSita,
  informe,
  libreta,
  lineaAhora,
  lineaFicha,
  libreTrasPedido,
  loQueFalta,
  marcarLibre,
  marcarLoQueFalta,
  nominaPendiente,
  pedir,
  partesMuerto,
  puedeAdelantar,
  pronosticoDia,
  rechazarSita,
  siguienteDia,
  tramos,
  type Estado,
  type OficinaTab,
  type Persona,
} from "@/game/motor";
import { Retrato } from "./Hud";
import type { Ajustes } from "@/game/guardar";

const btn =
  "min-h-11 border-2 border-tinta bg-papel-2 px-3 py-2 font-hand text-tinta hover:bg-oro disabled:opacity-40";
const btnPri = "min-h-11 border-2 border-tinta bg-tinta px-4 py-2 font-hand text-papel hover:bg-tierra";
const btnGris = "min-h-11 border-2 border-tinta/30 bg-[#d9d3c7] px-4 py-2 font-hand text-[#8a8175]";

function Candado() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" fill="none" stroke="#8a8175" strokeWidth="2" />
      <path d="M8 10 V7 a4 4 0 0 1 8 0 V10" fill="none" stroke="#8a8175" strokeWidth="2" />
    </svg>
  );
}

function HojaMenu({ children, onVolver }: { children: ReactNode; onVolver?: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-fondo/40 p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onVolver?.();
      }}
    >
      <section className="papel-grano w-full max-w-sm border-2 border-tinta px-4 py-4 text-left text-tinta shadow-[6px_8px_0_#1d1712]">
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
  s.avisoSeq += 1;
  s.avisos.push({ id: s.avisoSeq, texto });
  if (s.avisos.length > 6) s.avisos.splice(0, s.avisos.length - 6);
}

function AvisoRoto({ s }: { s: Estado }) {
  const a = s.avisos.find((x) => x.texto.includes("dañado"));
  if (!a) return null;
  return <p className="mt-3 border-2 border-rojo px-2 py-1 font-hand text-sm text-rojo">{a.texto}</p>;
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
        <span key={i} className={"inline-block h-3 w-3 rounded-full border border-tinta " + (i < n ? "bg-agua" : "bg-papel")} />
      ))}
    </span>
  );
}

function tonoDesvio(real: number, desv: number): string {
  if (real < 1) return "";
  if (desv > 1) return "text-rojo";
  if (desv < -1) return "text-sello";
  return "";
}

function Marco({
  titulo,
  children,
  onCerrar,
  ancho = "max-w-3xl",
  hoja = false,
}: {
  titulo: string;
  children: ReactNode;
  onCerrar?: () => void;
  ancho?: string;
  hoja?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-fondo/55 p-2 sm:items-center sm:p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCerrar?.();
      }}
    >
      <section
        className={`relative max-h-[92vh] w-full ${ancho} overflow-x-hidden overflow-y-auto border-2 border-tinta p-4 text-tinta shadow-[6px_8px_0_#1d1712] sm:p-5 ${hoja ? "hoja-libreta pl-8" : "papel-grano"}`}
      >
        {hoja ? (
          <span className="pointer-events-none absolute top-6 bottom-6 left-2 flex w-3 flex-col justify-between" aria-hidden="true">
            <i className="h-3 w-3 rounded-full border-2 border-tinta bg-fondo" />
            <i className="h-3 w-3 rounded-full border-2 border-tinta bg-fondo" />
            <i className="h-3 w-3 rounded-full border-2 border-tinta bg-fondo" />
          </span>
        ) : null}
        <header className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-4xl leading-none">{titulo}</h2>
          {onCerrar ? (
            <button type="button" className={btn} onClick={onCerrar}>
              Cerrar
            </button>
          ) : null}
        </header>
        {children}
      </section>
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
      <p className="font-hand text-sm text-tierra">Los cuatro de hoy siguen en su oficio. El ayudante cobra el jornal más bajo.</p>
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
    <article className="flex gap-2 border-2 border-tinta bg-papel/70 p-2">
      <Retrato oficio={p.oficio} letra={p.nombre.slice(0, 1)} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-2xl leading-none">
          {p.nombre} {p.apellido}
        </div>
        <div className="font-hand text-sm">
          {OFICIO_NOMBRE[p.oficio]} · {m.nombre}
        </div>
        <div className="font-hand text-sm">
          Rinde {num(p.rinde, 2)} · aguante {p.aguante} · ojo {p.ojo}
        </div>
        <p className="font-hand text-sm text-sello">{m.bueno}</p>
        <p className="font-hand text-sm text-rojo">{m.malo}</p>
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
            "inline-block h-11 w-11 rounded-t-full border-2 border-tinta " + (i < usados ? "bg-oro" : "bg-papel-2")
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
    <div className="mb-3 flex flex-wrap gap-2">
      {items.map(([id, nombre]) => (
        <button key={id} type="button" className={tab === id ? btnPri : btn} onClick={() => onTab(id)}>
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

function ListaFilas({ s }: { s: Estado }) {
  const lista = [...s.gente, ...s.reserva];
  if (!lista.length) return <p className="font-hand">Nadie en la lista.</p>;
  return (
    <ul>
      <li className="grid grid-cols-5 gap-1 border-b border-tinta py-1 font-hand text-sm text-tierra">
        <span>Nombre</span>
        <span>Oficio</span>
        <span>Días</span>
        <span>Jornal</span>
        <span>Se debe</span>
      </li>
      {lista.map((g) => (
        <li key={g.id} className="grid grid-cols-5 gap-1 border-b border-tinta/20 py-1 font-hand text-sm">
          <span className="truncate">{g.nombre}</span>
          <span className="truncate">{OFICIO_NOMBRE[g.oficio]}</span>
          <span>{g.dias ?? 0}</span>
          <span>{peso(jornalDe(g.oficio, g.rinde))}</span>
          <span>{peso(seDebe(s, g))}</span>
        </li>
      ))}
    </ul>
  );
}

function RegistroAlmacen({ s }: { s: Estado }) {
  const entro = s.bitacora.filter((a) => a.clase === "entro");
  const salio = s.bitacora.filter((a) => a.clase === "salio");
  const notas = s.bitacora.filter((a) => a.clase === "guardado" || a.clase === "mojado" || a.clase === "nota");
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
  onTocarSello?: (texto: string, x: number, y: number) => void;
}) {
  const [tab, setTab] = useState<"pre" | "dia" | "lista" | "alm" | "con" | "plano">("pre");
  const [cart, setCart] = useState<Cantidades>({});
  const [nota, setNota] = useState("");
  const [partidaAbierta, setPartidaAbierta] = useState<string | null>(null);
  const [pausaAjustes, setPausaAjustes] = useState(false);
  const [angosta, setAngosta] = useState(false);
  const [hoja, setHoja] = useState<null | "como" | "obras" | "ajustes" | "creditos" | "confirmar">(null);
  const [freno, setFreno] = useState<null | { origen: "sita" | "tel"; urgente: boolean; despues: number; nomina: number }>(null);
  useEffect(() => {
    setFreno(null);
    if (s.panel === "ferreteria" && s.sita?.editando && s.sita.oferta) {
      setCart({ ...s.sita.oferta.items });
      setNota("Sita ya lo armó. Cámbialo si quieres y mándalo.");
    } else {
      setCart({});
      setNota("");
    }
    if (s.panel !== "pausa") setPausaAjustes(false);
  }, [s.panel]);
  useEffect(() => {
    const mq = () => setAngosta(window.innerWidth < 420);
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);

  const cerrar = () => act((st) => cerrarPanel(st));
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
    const sellos = s.etapas.filter((e) => e.sello).length;
    const gente = s.gente.length + s.reserva.length;
    return (
      <HojaMenu>
        <h2 className="font-display text-4xl leading-none">¿Empezar una obra nueva?</h2>
        <p className="mt-3 font-hand">
          Pierdes: día {s.dia} y {sellos} de 9 etapas selladas; caja {peso(s.caja)} y lo que hay en el almacén; tu cuadrilla ({gente}{" "}
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
            className={btnPri}
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
          <h2 className="font-display text-4xl leading-none">Cómo se juega</h2>
          <ul className="mt-3 flex flex-col gap-2 font-hand">
            <li>Tú diriges, la cuadrilla trabaja.</li>
            <li>En la oficina contratas; el listero apunta los días.</li>
            <li>La Ferretería trae todo; el camión lo deja en la entrada.</li>
            <li>Manda gente a acarrear al almacén: lo que se queda afuera se moja.</li>
            <li>Alguien busca agua para el trompo.</li>
            <li>El cartel de arriba siempre dice qué frena la obra.</li>
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
          <h2 className="font-display text-4xl leading-none">Obras</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {OBRAS_MENU.map((o) =>
              o.abierta ? (
                <li key={o.id} className="min-h-11 border-2 border-tinta bg-papel-2 px-3 py-2 text-left font-hand">
                  {o.nombre}
                </li>
              ) : (
                <li key={o.id} className="flex min-h-11 items-center gap-2 border-2 border-tinta/30 px-3 py-2 font-hand text-[#8a8175]">
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
        on ? "min-h-11 border-2 border-tinta bg-tinta px-4 font-hand text-papel" : "min-h-11 border-2 border-tinta bg-papel-2 px-4 font-hand text-tinta";
      return (
        <HojaMenu onVolver={() => setHoja(null)}>
          <h2 className="font-display text-4xl leading-none">Ajustes</h2>
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
          <p className="mt-3 font-hand text-sm text-tierra">El x2 solo acelera el reloj. No cambia ritmos ni números.</p>
        </HojaMenu>
      );
    }
    if (hoja === "creditos") {
      return (
        <HojaMenu onVolver={() => setHoja(null)}>
          <h2 className="font-display text-4xl leading-none sm:text-5xl">Obra Maestra</h2>
          <p className="mt-3 font-hand text-lg leading-snug text-pretty sm:text-xl">
            Obra Maestra. Un proyecto del ingeniero y maestro constructor Diego Ángeles, con la ayuda de Grok. Agradecimientos a Elon Musk.
          </p>
        </HojaMenu>
      );
    }
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center bg-fondo/40 p-4"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        <section className="papel-grano w-full max-w-sm border-2 border-tinta px-4 py-4 text-center text-tinta shadow-[6px_8px_0_#1d1712]">
          <svg viewBox="0 0 220 120" className="mx-auto h-24 w-48" aria-hidden="true">
            <path d="M30 78 L18 52 L110 18 L200 58 L168 86 Z" fill="#d9c9a6" stroke="#1d1712" strokeWidth="2" />
            <path d="M16 54 L108 12 L206 58 L112 28 Z" fill="#8d5a3c" stroke="#1d1712" strokeWidth="2" />
            <path d="M92 86 L92 62 L128 62 L128 86 Z" fill="#c4b49a" stroke="#1d1712" strokeWidth="2" />
          </svg>
          <h2 className="-mt-6 font-display text-5xl leading-none text-tinta">Obra Maestra</h2>
          <AvisoRoto s={s} />
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" className={seguir ? btnPri : btnGris} disabled={!seguir} onClick={onContinuar}>
              Continuar
            </button>
            <button type="button" className={btnPri} onClick={quiereNueva}>
              Obra nueva
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
          </div>
          <p className="mt-3 font-hand text-sm text-[#8a8175]">Próximamente · Jugar como Ingeniero · Bloqueado</p>
        </section>
      </div>
    );
  }

  if (s.panel === "contrato") {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-fondo/40 p-4">
        <section className="papel-grano w-full max-w-sm border-2 border-tinta px-5 py-4 text-tinta shadow-[6px_8px_0_#1d1712]">
          <p className="truncate font-hand text-2xl leading-tight">Caseta de block 3x4</p>
          <p className="truncate font-display text-5xl leading-none">{peso(CONTRATO)}</p>
          <p className="truncate font-hand text-2xl leading-tight">Lo que no gastes es tuyo</p>
          <AvisoRoto s={s} />
          <button type="button" className={`${btnPri} mt-4 w-full`} onClick={() => act((st) => firmar(st))}>
            Firmar
          </button>
        </section>
      </div>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "gente") {
    const cupo = s.gente.length + s.reserva.length;
    return (
      <Marco titulo="Oficina" onCerrar={cerrar}>
        <Pestanas tab="gente" onTab={ir} />
        <p className="mb-2 font-hand">
          {LISTERO.nombre} {LISTERO.apellido}, listero · {GUARDALMACEN.nombre} {GUARDALMACEN.apellido}, guardalmacén. Los cubre la
          dirección.
        </p>
        <Cascos usados={cupo} />
        <p className="mb-3 font-hand">Antes de las 9:00 entran hoy. Se contrata por cuadrilla, hasta 8.</p>
        <Grupos
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
      <Marco titulo="Planos" onCerrar={cerrar} hoja>
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
                <p className="font-hand text-sm text-tierra">{e.regla}</p>
              </li>
            );
          })}
        </ol>
      </Marco>
    );
  }

  if (s.panel === "oficina" && s.oficinaTab === "telefono") {
    return (
      <Marco titulo="Teléfono" onCerrar={cerrar}>
        <Pestanas tab="telefono" onTab={ir} />
        <p className="font-hand">Doña Carmen paga el contrato. El material se compra en la ferretería, con precio y entrega.</p>
        <p className="mt-2 font-hand">Sita Ferreras guarda el almacén. Su lista no se arma sola.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnPri} onClick={() => act((st) => hablarSita(st))}>
            Hablar con Sita
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
      <Marco titulo="Diario" onCerrar={cerrar} hoja>
        <Pestanas tab="diario" onTab={ir} />
        <p className="mb-2 font-hand">{NOTA_ESCUADRA}</p>
        <ul className="max-h-[50vh] space-y-1 overflow-y-auto font-hand text-sm">
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
      <Marco titulo="Libreta · Nico" onCerrar={cerrar} hoja>
        <Pestanas tab="libreta" onTab={ir} />
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
              <span className={t.cobrado ? "text-sello" : "text-tierra"}>
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
      <Marco titulo="Cuadrilla" onCerrar={cerrar}>
        {lista.length === 0 ? <p className="font-hand">Nadie contratado. Contrata en la oficina.</p> : null}
        <ul className="flex flex-col gap-3">
          {lista.map(({ g, manana }) => (
            <li key={g.id} className="border-2 border-tinta p-2">
              <div className="flex flex-wrap items-center gap-2">
                <Retrato oficio={g.oficio} letra={g.nombre.slice(0, 1)} />
                <div className="min-w-0 flex-1">
                  <div className="font-hand">
                    {g.nombre} {g.apellido} · {OFICIO_NOMBRE[g.oficio]}
                    {manana ? " · entra mañana" : ""}
                    {g.falto ? " · no vino" : ""}
                    {g.fuera ? " · ya se fue" : ""}
                  </div>
                  {lineaFicha(s, g) ? <div className="font-hand text-sm">{lineaFicha(s, g)}</div> : null}
                  <div className="font-hand text-sm text-tierra">
                    Cansancio {Math.round(g.cansancio)} · jornal {peso(jornalDe(g.oficio, g.rinde))} · {MANIA_INFO[g.mania].nombre}
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

  if (freno && (s.panel === "sita" || s.panel === "ferreteria")) {
    return (
      <Marco titulo="Antes de pedir" ancho="max-w-md" onCerrar={() => setFreno(null)}>
        <p className="font-hand text-lg">
          Caja libre después: {peso(freno.despues)}. Nómina de hoy: {peso(freno.nomina)}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnPri} onClick={() => confirmarFreno()}>
            Confirmar
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
    return (
      <Marco titulo="Hablar con Sita" ancho="max-w-md" onCerrar={cerrar}>
        <p className="font-hand text-lg">{of.texto}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPri}
            onClick={() => {
              const of = s.sita?.oferta;
              if (!of) return;
              const aviso = avisarNomina(of.total);
              if (aviso) {
                setFreno({ origen: "sita", urgente: of.urgente, ...aviso });
                return;
              }
              act((st) => decir(st, aceptarSita(st)));
            }}
          >
            Pedir
          </button>
          <button type="button" className={btn} onClick={() => act((st) => rechazarSita(st))}>
            Ahora no
          </button>
          <button type="button" className={btn} onClick={() => act((st) => editarSita(st))}>
            Editar
          </button>
        </div>
        <h3 className="mt-4 font-display text-2xl">En obra</h3>
        <RegistroAlmacen s={s} />
      </Marco>
    );
  }

  if (s.panel === "sita") {
    return (
      <Marco titulo="Hablar con Sita" ancho="max-w-md" onCerrar={cerrar}>
        <p className="font-hand text-lg">Por ahora no falta nada.</p>
        <h3 className="mt-4 font-display text-2xl">En obra</h3>
        <RegistroAlmacen s={s} />
      </Marco>
    );
  }

  if (s.panel === "ferreteria") {
    let mats = 0;
    for (const k of COMPRA) mats += (cart[k] ?? 0) * MATERIALES[k].precio;
    const libre = cajaLibre(s);
    const urgenteOk = s.minuto < 12 * 60;
    return (
      <Marco titulo="Ferretería El Cruce" onCerrar={cerrar}>
        <p className="font-hand text-sm">
          Caja libre {peso(libre)} (sin la nómina). Flete normal {peso(FLETE)}, entrega mañana 7:30. Urgente {peso(FLETE_URGENTE)}, solo
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
                      <span className="text-tierra"> · {def.unidad}</span>
                    </td>
                    <td className="whitespace-nowrap pr-1">{peso(def.precio)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <button type="button" className={btn + " px-2"} onClick={() => subir(k, -1)}>
                          −
                        </button>
                        <span className="inline-block w-8 text-center">{num(cart[k] ?? 0, 2)}</span>
                        <button type="button" className={btn + " px-2"} onClick={() => subir(k, 1)}>
                          +
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
          Material {peso(mats)} · con flete {peso(mats + FLETE)}
        </p>
        {nota ? <p className="font-hand text-rojo">{nota}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            onClick={() => {
              let q: Cantidades = {};
              act((st) => {
                marcarLoQueFalta(st);
                q = loQueFalta(st);
              });
              setCart(q);
              setNota(
                Object.keys(q).length
                  ? "Pedido lleno con lo que falta. Revísalo y mándalo."
                  : "Por ahora no falta nada.",
              );
            }}
          >
            Lo que falta
          </button>
          <button type="button" className={btnPri} onClick={() => mandar(false)}>
            Flete normal
          </button>
          <button type="button" className={btnPri} disabled={!urgenteOk} onClick={() => mandar(true)}>
            Urgente
          </button>
        </div>
      </Marco>
    );
  }

  function subir(k: Mat, dir: number) {
    const paso = MATERIALES[k].paso;
    setCart((c) => {
      const q = Math.max(0, Math.round(((c[k] ?? 0) + dir * paso) * 1000) / 1000);
      const next = { ...c };
      if (q <= 0) delete next[k];
      else next[k] = q;
      return next;
    });
  }

  function avisarNomina(total: number): { despues: number; nomina: number } | null {
    const nomina = nominaPendiente(s);
    const despues = libreTrasPedido(s, total);
    if (despues < -0.5) return null;
    if (despues + 0.5 >= nomina) return null;
    return { despues, nomina };
  }

  function confirmarFreno() {
    const f = freno;
    setFreno(null);
    if (!f) return;
    if (f.origen === "sita") act((st) => decir(st, aceptarSita(st)));
    else mandar(f.urgente, true);
  }

  function mandar(urgente: boolean, forzado = false) {
    let matsAhora = 0;
    for (const k of COMPRA) matsAhora += (cart[k] ?? 0) * MATERIALES[k].precio;
    const total = matsAhora > 0 ? matsAhora + (urgente ? FLETE_URGENTE : FLETE) : 0;
    if (!forzado && total > 0) {
      const aviso = avisarNomina(total);
      if (aviso) {
        setFreno({ origen: "tel", urgente, ...aviso });
        return;
      }
    }
    let err: string | null = null;
    act((st) => {
      err = pedir(st, cart, urgente);
      decir(st, err);
    });
    if (!err) {
      setCart({});
      setNota(urgente ? "El camión salió. Llega en 3 horas." : "Pedido hecho. Llega mañana a las 7:30.");
    } else setNota(err);
  }

  if (s.panel === "libreta" || s.panel === "almacen") {
    const lib = libreta(s);
    const alm = s.panel === "almacen" ? almacen(s) : lib.almacen;
    const pestana = s.panel === "almacen" ? "alm" : tab;
    return (
      <Marco titulo={s.panel === "almacen" ? "Almacén" : "Libreta"} onCerrar={cerrar} hoja>
        {s.panel === "libreta" ? (
          <div className="mb-3 flex flex-wrap gap-1">
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
              <button key={id} type="button" className={tab === id ? btnPri : btn} onClick={() => setTab(id)}>
                {nombre}
              </button>
            ))}
          </div>
        ) : null}
        {pestana === "pre" ? <Plata lib={lib} s={s} angosta={angosta} abierta={partidaAbierta} onAbre={setPartidaAbierta} /> : null}
        {pestana === "dia" ? (
          <div>
            <p className="mb-2 font-hand">{NOTA_ESCUADRA}</p>
            <ul className="max-h-[50vh] space-y-1 overflow-y-auto font-hand text-sm">
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
                <span className={t.cobrado ? "text-sello" : "text-tierra"}>
                  {peso(t.monto)} {t.cobrado ? "cobrado" : "pendiente"}
                </span>
              </li>
            ))}
            <li className="pt-2">
              Cobrado {peso(s.cobrado)} de {peso(CONTRATO)}
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
                  <p className="font-hand text-sm text-tierra">{e.regla}</p>
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
    const def = ETAPAS[s.sello.etapa];
    const neto = ok && def ? Math.max(0, Math.round(CONTRATO * def.tramo) - s.adelanto) : 0;
    const monto = neto > 0 ? `+${peso(neto)}` : "";
    return (
      <div ref={selloAncla} className="pointer-events-none fixed z-40" style={{ left: "50%", top: "46%" }}>
        <div className="absolute -translate-x-1/2 -translate-y-[58%]">
          <button
            type="button"
            aria-label={ok ? "Tocar el sello" : "Tocar la observación"}
            className={
              "sello-caer pointer-events-auto papel-grano max-w-md cursor-pointer border-8 px-6 py-5 text-center shadow-[8px_10px_0_#1d1712] " +
              (ok ? "border-sello text-sello" : "border-rojo text-rojo")
            }
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (monto) onTocarSello?.(monto, r.left + r.width / 2, r.top + r.height * 0.72);
              act((st) => continuarSello(st));
            }}
          >
            <div className="font-hand text-sm tracking-widest text-tinta">JUNTA DE VECINOS</div>
            <div className="font-display text-6xl leading-none sm:text-7xl">{ok ? "APROBADO" : "OBSERVADO"}</div>
            <p className="mt-2 font-hand text-xl text-tinta">{s.sello.nombre}</p>
            {!ok ? <p className="font-hand text-tinta">{s.sello.motivo}</p> : null}
            {monto ? <p className="font-display text-4xl text-oro">{monto}</p> : null}
            {monto ? (
              <p className="mt-1 flex justify-center gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="inline-block h-3 w-3 rounded-full border border-tinta bg-oro" />
                ))}
              </p>
            ) : null}
          </button>
        </div>
      </div>
    );
  }

  if (s.panel === "finde") {
    const domingo = esDomingo(s.dia + 1);
    const pagada = s.gente.reduce((a, g) => a + g.moHoy, 0);
    return (
      <Marco titulo="Fin del día" ancho="max-w-lg">
        <p className="font-display text-4xl">{peso(s.caja)}</p>
        <p className="font-hand">Nómina pagada {peso(pagada)}</p>
        {Math.round(s.herrHoy ?? 0) >= 1 ? <p className="font-hand">Herramienta {peso(s.herrHoy)}</p> : null}
        {s.direccionCobrada && !esDomingo(s.dia) ? (
          <p className="font-hand">Dirección (tu jornal) {peso(DIRECCION_DIA)}</p>
        ) : null}
        {Math.round(s.mezclaTarde ?? 0) >= 1 ? (
          <p className="font-hand">Mezcla vencida después de las 3: {peso(s.mezclaTarde)}</p>
        ) : null}
        <p className="font-hand">
          Etapas selladas: {s.etapas.filter((e) => e.sello).length} de 9.
          {domingo ? " Mañana es domingo: se salta solo." : ""}
        </p>
        <p className="font-hand">{lineaAhora(s)}</p>
        <h3 className="mt-3 font-display text-2xl">Cansancio</h3>
        <ul className="font-hand text-sm">
          {s.gente.map((g) => (
            <li key={g.id} className="flex items-center gap-2">
              <span>
                {g.nombre}
                {g.cansancio >= 85 ? " · mañana no viene y no cobra" : ""}
                {g.libre ? " · libre mañana" : ""}
              </span>
              <Gotas n={gotasDe(g.cansancio)} />
            </li>
          ))}
        </ul>
        {s.faltanManana.length > 0 ? (
          <>
            <h3 className="mt-2 font-display text-2xl">Quién falta mañana</h3>
            <ul className="font-hand text-sm">
              {s.faltanManana.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 font-hand text-sm">Mañana viene la cuadrilla, si hay con qué pagarles.</p>
        )}
        <p className="mt-2 font-hand text-sm">{pronosticoDia(s, 0)}</p>
        <p className="font-hand text-sm">{pronosticoDia(s, 1)}</p>
        <button type="button" className={`${btnPri} mt-4 w-full`} onClick={() => act((st) => siguienteDia(st))}>
          Amanecer
        </button>
      </Marco>
    );
  }

  if (s.panel === "informe" || s.panel === "perdida") {
    const inf = informe(s);
    const perdida = s.panel === "perdida";
    const pct = inf.presupuesto > 0 ? (inf.costo / inf.presupuesto - 1) * 100 : 0;
    return (
      <Marco titulo={perdida ? "Obra perdida" : "Informe final"} ancho="max-w-3xl">
        <p className="font-hand">
          {perdida
            ? "La caja amaneció en rojo, no queda adelanto y falta material. Doña Carmen se quedó sin caseta."
            : "Doña Carmen ya tiene su caseta."}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Dato etiqueta="Días" valor={String(inf.dias)} />
          <Dato etiqueta="Costo" valor={peso(inf.costo)} />
          {perdida ? (
            <Dato etiqueta="Pérdida" valor={peso(s.caja)} rojo />
          ) : (
            <>
              <Dato etiqueta="Vs presupuesto" valor={`${pct >= 0 ? "+" : ""}${num(pct, 1)}%`} />
              <Dato etiqueta="Ganancia" valor={peso(inf.ganancia)} />
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
                    <td className={sin ? "text-tierra" : tonoDesvio(f.real, f.desv)}>{sin ? "sin empezar" : peso(f.desv, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-hand text-tierra">Próxima obra: Losa de concreto (bloqueada)</p>
        <button type="button" className={`${btn} mt-3`} onClick={quiereNueva}>
          {perdida ? "Obra nueva" : "Otra caseta"}
        </button>
      </Marco>
    );
  }

  if (s.panel === "pausa") {
    const tog = (on: boolean) =>
      on ? "min-h-11 border-2 border-tinta bg-tinta px-4 font-hand text-papel" : "min-h-11 border-2 border-tinta bg-papel-2 px-4 font-hand text-tinta";
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
          Golpe al compás: pulsa Espacio (o ¡Dale!) cuando el anillo brilla dorado y rinde 25 % más.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button type="button" className={btnPri} onClick={cerrar}>
            Seguir
          </button>
          <button type="button" className={btn} onClick={() => setPausaAjustes((v) => !v)}>
            Ajustes
          </button>
          {pausaAjustes ? (
            <div className="border-2 border-tinta bg-papel-2 p-3">
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
              <p className="mt-3 font-hand text-sm text-tierra">El x2 solo acelera el reloj. No cambia ritmos ni números.</p>
            </div>
          ) : null}
          <button type="button" className={btn} onClick={quiereNueva}>
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
  const base = Math.max(1, CONTRATO);
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
          <span className="h-full bg-rojo/30" style={{ width: `${wPor}%`, backgroundImage: "repeating-linear-gradient(135deg,#b8432f 0 2px,transparent 2px 5px)" }} />
          <span className="h-full bg-oro" style={{ width: `${wOro}%` }} />
        </div>
      </div>
      <p className="mt-1 flex justify-between gap-2 font-hand text-xs">
        <span>{cifraCorta(lib.costo, angosta)}</span>
        <span>{cifraCorta(lib.porHacer, angosta)}</span>
        <span className="text-oro">{cifraCorta(lib.ganancia, angosta)}</span>
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
              <button type="button" className="flex w-full min-w-0 items-center gap-2 text-left font-hand text-sm" onClick={() => onAbre(abierto ? null : f.partida)}>
                <span className="w-16 shrink-0 truncate sm:w-24">{f.nombre}</span>
                <span className="relative h-3 min-w-0 flex-1">
                  <span className="absolute top-0 h-3 border border-tinta" style={{ width: `${Math.max(hueco, tinta)}%` }} />
                  {muerto ? (
                    <span className="absolute top-0 h-3 bg-rojo/40" style={{ width: `${(f.real / tope) * 100}%`, backgroundImage: "repeating-linear-gradient(135deg,#b8432f 0 2px,transparent 2px 4px)" }} />
                  ) : (
                    <span className="absolute top-0 h-3 bg-tinta" style={{ width: `${tinta}%` }} />
                  )}
                  {paso > 0 ? (
                    <span className="absolute top-0 h-3 bg-rojo/50" style={{ left: `${hueco}%`, width: `${paso}%`, backgroundImage: "repeating-linear-gradient(135deg,#b8432f 0 2px,transparent 2px 4px)" }} />
                  ) : null}
                </span>
                <span className="max-w-[46%] shrink-0 truncate text-right text-xs whitespace-nowrap">{txt}</span>
              </button>
              {abierto && !muerto ? (
                <p className="font-hand text-xs text-tierra">
                  Mano {cifraCorta(f.mo, angosta)} · material {cifraCorta(f.mat, angosta)}
                </p>
              ) : null}
              {abierto && muerto ? (
                <ul className="mt-1 space-y-1 font-hand text-xs text-rojo">
                  {partes.length === 0 ? (
                    <li>Todavía no se parte.</li>
                  ) : (
                    partes.map((p) => (
                      <li key={p.id}>
                        <div>
                          {p.nombre} · {num(p.min / 60, 1)} h · {cifraCorta(p.pesos, angosta)}
                        </div>
                        <ul className="ml-3 text-tierra">
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
    <div className={"border-2 border-tinta px-2 py-1 " + (rojo ? "text-rojo" : "")}>
      <div className="font-hand text-xs text-tierra">{etiqueta}</div>
      <div className="font-display text-3xl leading-none">{valor}</div>
    </div>
  );
}
