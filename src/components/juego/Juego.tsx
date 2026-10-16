import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cargar, borrar, guardar as guardarCaja, pestanaVieja, tomarPartida, cargarAjustes, guardarAjustes, type Ajustes } from "@/game/guardar";

// lo que cambia con un pago, una compra o un fiado.
function huellaDinero(s: Estado): string {
  return JSON.stringify([s.caja, s.cobrado, s.adelanto, s.fiado, s.inv, s.entrada, s.pedidos.length, s.gente.length, s.rescateUsado]);
}

// si otra pestaña tiene una partida más nueva, esta deja de guardar y lo dice una vez.
let avisoVieja = false;
function guardar(s: Estado) {
  const ok = guardarCaja(s);
  if (!ok && pestanaVieja() && !avisoVieja) {
    avisoVieja = true;
    const id = (s.avisoSeq ?? 0) + 1;
    s.avisoSeq = id;
    s.avisos.push({ id, texto: "Otra pestaña guardó una partida más nueva. Esta ya no guarda: recarga para seguir aquella." });
  }
}
import { VEL_MAESTRO, CONTRATO, ETAPAS, MAPA, MATERIALES, SITIOS, peso } from "@/game/datos";
import { dibujar, mundoDesde, puntoEnPantalla, type Floater, type Vis } from "@/game/dibujo";
import { reiniciarGuia } from "@/game/guia";
import {
  abrirDespacho,
  abrirPanel,
  adelantar,
  cobroDe,
  fiar,
  cerrarPanel,
  continuarSello,
  golpe,
  hechoDe,
  nueva,
  marcarGuia,
  quitarAviso,
  seguirDedo,
  tick,
  type Estado,
} from "@/game/motor";
import { Hud, sonidoUi } from "./Hud";
import { Paneles } from "./Paneles";

declare global {
  interface Window {
    __controlsTest?: {
      getPos: () => { x: number; y: number };
      setKeys: (codes: string[]) => void;
      setPos: (x: number, y: number) => void;
      estado: () => Estado;
      audio: () => string;
      congelar: (v: boolean) => void;
    };
  }
}

const AVISO_ROTO = "El guardado estaba dañado. Lo aparté y esta es una obra nueva.";
const CLAVE_PLANO = "obra-maestra-plano";

function planoVisto(): boolean {
  try {
    return localStorage.getItem(CLAVE_PLANO) === "1";
  } catch {
    return false;
  }
}

function marcarPlano() {
  try {
    localStorage.setItem(CLAVE_PLANO, "1");
  } catch {
    /* sigue el juego si el navegador niega el guardado */
  }
}

function textoZapata(): string {
  const regla = ETAPAS.find((e) => e.id === "excavacion")?.regla ?? "";
  const m = regla.match(/0\.50\s×\s0\.60\sm/);
  return `Zanja corrida de ${m?.[0] ?? "0.50 × 0.60 m"} alrededor de la caseta.`;
}

function textoMuros(): string {
  const regla = ETAPAS.find((e) => e.id === "muros")?.regla ?? "";
  return `Muros de ${MATERIALES.block.nombre}. ${regla}`;
}

const PUNTOS_PLANO = [
  { marca: "Zapata", x: 19, y: 14.5, texto: textoZapata() },
  { marca: "Muros", x: 20.4, y: 15.4, texto: textoMuros() },
  {
    marca: "Almacén",
    x: SITIOS.almacen.x,
    y: SITIOS.almacen.y,
    texto: "El guardalmacén anota lo que entra y lo que sale.",
  },
  {
    marca: "Entrada",
    x: SITIOS.entrada.x,
    y: SITIOS.entrada.y,
    texto: "El camión para en la calle y descarga aquí. De aquí se acarrea.",
  },
];

function crear(): { s: Estado; seguir: boolean; roto: boolean } {
  const c = cargar();
  if (c.s) {
    c.s.mando = { ax: 0, ay: 0 };
    c.s.destino = null;
    c.s.vel = 0;
    c.s.pausa = false;
    c.s.panel = "menu";
    return { s: c.s, seguir: true, roto: false };
  }
  const s = nueva();
  if (c.roto) {
    s.avisos.push({ id: 1, texto: AVISO_ROTO });
    s.avisoSeq = 1;
  }
  return { s, seguir: false, roto: c.roto };
}

type Sonido =
  | "toc"
  | "compas"
  | "sello"
  | "plomo"
  | "moneda"
  | "motor"
  | "camion"
  | "pala"
  | "carretilla"
  | "trompo"
  | "cuchara"
  | "martillo"
  | "lluvia"
  | "block"
  | "amarre"
  | "vaciado"
  | "trueno"
  | "gallo"
  | "colmado"
  | "silbato"
  | "error";

function sonar(ctx: AudioContext | null, tipo: Sonido, callado: boolean) {
  if (!ctx || callado || (typeof document !== "undefined" && document.hidden)) return;
  const nota = (freq: number, t: number, dur: number, gain = 0.04, onda: OscillatorType = "triangle") => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = onda;
    o.frequency.setValueAtTime(freq, ctx.currentTime + t);
    g.gain.setValueAtTime(gain, ctx.currentTime + t);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + dur);
    o.stop(ctx.currentTime + t + dur + 0.02);
  };
  const ruido = (t: number, dur: number, gain: number) => {
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    g.gain.setValueAtTime(gain, ctx.currentTime + t);
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start(ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + dur);
    src.stop(ctx.currentTime + t + dur + 0.02);
  };
  if (tipo === "toc") nota(196, 0, 0.06, 0.03);
  else if (tipo === "compas") nota(620, 0, 0.07, 0.035);
  else if (tipo === "sello") {
    ruido(0, 0.08, 0.08);
    nota(90, 0, 0.12, 0.06, "sine");
  } else if (tipo === "plomo") {
    nota(880, 0, 0.12, 0.03);
    nota(660, 0.08, 0.16, 0.025);
  } else if (tipo === "moneda") {
    nota(988, 0, 0.08, 0.04);
    nota(1318, 0.06, 0.1, 0.03);
    nota(1568, 0.12, 0.12, 0.02);
  } else if (tipo === "pala") ruido(0, 0.09, 0.05);
  else if (tipo === "carretilla") {
    nota(220, 0, 0.12, 0.02, "sawtooth");
    ruido(0, 0.14, 0.03);
  } else if (tipo === "trompo") nota(58, 0, 0.22, 0.02, "sawtooth");
  else if (tipo === "cuchara") nota(520, 0, 0.04, 0.03, "square");
  else if (tipo === "block") {
    ruido(0, 0.07, 0.07);
    nota(70, 0, 0.1, 0.05, "sine");
  } else if (tipo === "martillo") {
    nota(180, 0, 0.04, 0.04, "square");
    nota(140, 0.09, 0.05, 0.035, "square");
  } else if (tipo === "amarre") {
    nota(640, 0, 0.05, 0.02);
    nota(420, 0.05, 0.08, 0.02);
  } else if (tipo === "vaciado") ruido(0, 0.28, 0.05);
  else if (tipo === "lluvia") ruido(0, 0.25, 0.015);
  else if (tipo === "trueno") {
    ruido(0, 0.7, 0.09);
    nota(48, 0, 0.6, 0.05, "sine");
  } else if (tipo === "gallo") {
    nota(700, 0, 0.12, 0.03);
    nota(880, 0.14, 0.1, 0.03);
    nota(620, 0.28, 0.18, 0.025);
  } else if (tipo === "colmado") {
    nota(196, 0, 0.4, 0.012, "sine");
    nota(247, 0.05, 0.35, 0.008, "triangle");
  } else if (tipo === "silbato") {
    nota(1400, 0, 0.18, 0.03);
    nota(1800, 0.16, 0.22, 0.025);
  } else if (tipo === "error") {
    nota(140, 0, 0.08, 0.04, "square");
    nota(110, 0.1, 0.1, 0.04, "square");
  } else if (tipo === "camion" || tipo === "motor") {
    ruido(0, 0.18, 0.06);
    nota(330, 0.12, 0.12, 0.04);
    nota(415, 0.26, 0.14, 0.035);
  }
}

function sonidoObra(s: Estado): "pala" | "carretilla" | "trompo" | "cuchara" | "martillo" | "lluvia" | null {
  if (!s.firmado || s.entregada || s.panel) return null;
  if (s.lluviaOn) return "lluvia";
  const batea = s.mezclas.some((m) => !m.lista);
  if (
    batea &&
    s.gente.some((g) => g.activo && !g.fuera && !g.falto && g.puesto === "batea" && g.trabajando)
  ) {
    return "trompo";
  }
  for (const g of s.gente) {
    if (!g.activo || g.fuera || g.falto || !g.trabajando) continue;
    if (g.puesto === "acarreo") return "carretilla";
    if (g.anim === "pala") return "pala";
    if (g.anim === "martillo") return "martillo";
    if (g.anim === "cuchara" || g.anim === "cubeta") return "cuchara";
  }
  return null;
}

/** El dedo que maneja la palanca. Un segundo dedo, perder el foco o tocar otro botón no la sueltan. */
export const palancaDedo: { id: number | null } = { id: null };

function Palanca({ on, compacto, oculto }: { on: (ax: number, ay: number) => void; compacto?: boolean; oculto?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const mover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let x = e.clientX - cx;
    let y = e.clientY - cy;
    const m = Math.hypot(x, y) || 1;
    const lim = r.width * 0.36;
    const k = Math.min(lim, m);
    x = (x / m) * k;
    y = (y / m) * k;
    setKnob({ x, y });
    on(x / lim, -y / lim);
  };
  const soltar = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (palancaDedo.id !== e.pointerId) return;
    palancaDedo.id = null;
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    setKnob({ x: 0, y: 0 });
    on(0, 0);
  };
  return (
    <div
      ref={ref}
      className={"absolute bottom-3 left-3 z-20 touch-manipulation rounded-full border-4 border-block bg-block-sombra/50 " + (compacto ? "h-16 w-16" : "h-28 w-28")}
      style={{ touchAction: "none", visibility: oculto ? "hidden" : undefined, pointerEvents: oculto ? "none" : undefined }}
      data-palanca
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (palancaDedo.id != null && palancaDedo.id !== e.pointerId) return;
        palancaDedo.id = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        mover(e);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === palancaDedo.id) mover(e);
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <div
        className={"absolute top-1/2 left-1/2 rounded-full border-2 border-tinta bg-colmado-amarillo " + (compacto ? "h-7 w-7" : "h-12 w-12")}
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

export function Juego() {
  const pack = useRef<{ s: Estado; seguir: boolean; roto: boolean } | null>(null);
  const roto = useRef(false);
  const [snap, setSnap] = useState<Estado>(() => {
    const p = crear();
    pack.current = p;
    roto.current = p.roto;
    return p.s;
  });
  const estado = useRef<Estado>(null!);
  if (estado.current == null) estado.current = pack.current!.s;
  const [seguir, setSeguir] = useState(() => pack.current?.seguir ?? false);
  const [movil, setMovil] = useState(false);
  const [bajo, setBajo] = useState(false);
  const [late, setLate] = useState(false);
  const [firmadoSello, setFirmadoSello] = useState(false);
  const [plano, setPlano] = useState<number | null>(null);
  const planoRef = useRef<number | null>(null);
  planoRef.current = plano;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selloAncla = useRef<HTMLDivElement>(null);
  const pintar = useRef(dibujar);
  pintar.current = dibujar;
  const vis = useRef<Vis>({
    t: 0,
    dt: 0,
    compas: 0,
    cam: { x: snap.jugador.x, y: snap.jugador.y },
    shake: 0,
    floaters: [] as Floater[],
    ancho: 800,
    ondas: [] as { x: number; y: number; t: number }[],
    camion: -1,
    pedidos: -1,
    hit: 0,
    selloOn: false,
    plomoOn: false,
    mira: null,
    ancla: 0.56,
    foco: null,
    marca: null,
    contrato: false,
  });
  const keys = useRef(new Set<string>());
  const joy = useRef({ ax: 0, ay: 0 });
  const dedo = useRef<{ x: number; y: number } | null>(null);
  const dedoId = useRef<number | null>(null);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const ultimo = useRef(-1);
  const audio = useRef<AudioContext | null>(null);
  const cobrado = useRef(snap.cobrado);
  const ajustesRef = useRef<Ajustes>({ sonido: true, vel: 1, control: "circulo" });
  const [ajustes, setAjustes] = useState<Ajustes>(() => {
    const a = cargarAjustes();
    ajustesRef.current = a;
    return a;
  });
  ajustesRef.current = ajustes;

  const flush = useCallback(() => {
    setSnap(structuredClone(estado.current));
  }, []);

  const act = useCallback(
    (fn: (s: Estado) => void) => {
      // un pago, compra o fiado se guarda al instante, en una sola escritura: si la página se cierra
      // justo después, al recargar no se pierde la partida ni se duplica dinero ni material.
      const antes = huellaDinero(estado.current);
      fn(estado.current);
      if (huellaDinero(estado.current) !== antes && estado.current.panel !== "perdida") guardar(estado.current);
      flush();
    },
    [flush],
  );

  const desbloquear = useCallback(() => {
    if (audio.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio.current = new Ctx();
    void audio.current.resume();
  }, []);

  const aplicarMando = useCallback(() => {
    const s = estado.current;
    let ax = 0;
    let ay = 0;
    const k = keys.current;
    if (k.has("KeyA") || k.has("ArrowLeft")) ax -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) ax += 1;
    if (k.has("KeyW") || k.has("ArrowUp")) ay += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) ay -= 1;
    if (ax === 0 && ay === 0 && ajustesRef.current.control !== "arrastre") {
      const jx = joy.current.ax;
      const jy = joy.current.ay;
      if (!s.destino || Math.hypot(jx, jy) > 0.2) {
        ax = jx;
        ay = jy;
      }
    }
    s.mando.ax = ax;
    s.mando.ay = ay;
  }, []);

  const intentarGolpe = useCallback(
    (t: number) => {
      const s = estado.current;
      if (s.panel || s.pausa || s.entregada) return;
      if (t - ultimo.current < 0.6) return;
      ultimo.current = t;
      const fase = vis.current.compas;
      const al = fase <= 0.15 || fase >= 0.85;
      const f = golpe(s, al);
      if (f) {
        vis.current.floaters = [{ x: f.x, y: f.y, texto: f.texto, oro: f.oro, vida: 0.9 }];
        if (f.oro) vis.current.ondas.push({ x: f.x, y: f.y, t: vis.current.t });
        const callado = document.hidden || !ajustesRef.current.sonido || estado.current.pausa || !!estado.current.panel;
        sonar(audio.current, f.oro ? "compas" : "toc", callado);
      }
      flush();
    },
    [flush],
  );

  useEffect(() => {
    const mq = () => {
      setMovil(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900);
      setBajo(window.innerHeight <= 430);
    };
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);

  const adelantoYa = useRef(snap.adelanto);
  useEffect(() => {
    const subioAdelanto = snap.adelanto > adelantoYa.current + 0.5;
    adelantoYa.current = snap.adelanto;
    if (snap.cobrado > cobrado.current + 1) {
      const firma = cobrado.current < 1;
      cobrado.current = snap.cobrado;
      if (firma || subioAdelanto) return;
      setLate(true);
      sonar(audio.current, "moneda", !ajustesRef.current.sonido || estado.current.pausa || !!estado.current.panel);
      const a = window.setTimeout(() => setLate(false), 350);
      return () => window.clearTimeout(a);
    }
    cobrado.current = snap.cobrado;
  }, [snap.cobrado, snap.adelanto]);

  const nominaYa = useRef(snap.nominaPagada);
  const firmadoYa = useRef(snap.firmado);
  useEffect(() => {
    if (!nominaYa.current && snap.nominaPagada && snap.firmado) {
      setLate(true);
      sonar(audio.current, "moneda", !ajustesRef.current.sonido || estado.current.pausa || !!estado.current.panel);
      const id = window.setTimeout(() => setLate(false), 350);
      nominaYa.current = snap.nominaPagada;
      return () => window.clearTimeout(id);
    }
    nominaYa.current = snap.nominaPagada;
  }, [snap.nominaPagada, snap.firmado]);
  useEffect(() => {
    if (!firmadoYa.current && snap.firmado) {
      setFirmadoSello(true);
      const id = window.setTimeout(() => {
        setFirmadoSello(false);
        if (!planoVisto()) {
          marcarPlano();
          setPlano(0);
        }
      }, 1200);
      firmadoYa.current = true;
      return () => window.clearTimeout(id);
    }
    firmadoYa.current = snap.firmado;
  }, [snap.firmado]);

  const parpadearCaja = useCallback((texto: string) => {
    const neto = Number(texto.replace(/[^\d]/g, ""));
    if (neto > 0) cobrado.current = estado.current.cobrado + neto;
    setLate(true);
    sonar(audio.current, "moneda", !ajustesRef.current.sonido || estado.current.pausa || !!estado.current.panel);
    window.setTimeout(() => setLate(false), 350);
  }, []);

  const cerrarSello = useCallback(
    (_x?: number, _y?: number) => {
      const st = estado.current;
      if (st.panel !== "sello" || !st.sello) return;
      const ok = st.sello.ok;
      const def = ETAPAS[st.sello.etapa];
      const neto = ok && def ? cobroDe(st, st.sello.etapa).neto : 0;
      if (neto > 0) parpadearCaja(`+${peso(neto)}`);
      act((s) => continuarSello(s));
    },
    [act, parpadearCaja],
  );

  // el cartel APROBADO se cierra al primer toque en cualquier parte (aunque caiga sobre un botón del HUD o el dedo
  // venga de la palanca). Antes solo escuchaba el pointerup del fondo y un toque sobre el HUD no lo cerraba.
  useEffect(() => {
    if (snap.panel !== "sello") return;
    const desde = performance.now();
    const cerrar = (e: PointerEvent) => {
      if (performance.now() - desde < 300) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      cerrarSello(e.clientX, e.clientY);
    };
    window.addEventListener("pointerdown", cerrar, true);
    return () => window.removeEventListener("pointerdown", cerrar, true);
  }, [snap.panel, cerrarSello]);

  const colocarSello = useCallback(() => {
    const ancla = selloAncla.current;
    const canvas = canvasRef.current;
    if (!ancla || !canvas || estado.current?.panel !== "sello") return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const p = puntoEnPantalla(19, 14.5, 1.05, w, h, vis.current.cam);
    ancla.style.left = `${Math.max(170, Math.min(w - 170, p.x))}px`;
    ancla.style.top = `${Math.max(150, Math.min(h - 70, p.y))}px`;
  }, []);
  useLayoutEffect(() => {
    if (snap.panel === "sello") colocarSello();
  }, [snap.panel, colocarSello]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let muerto = false;
    let ultimoT = performance.now();
    let acc = 0;
    let guardado = 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dibujoAviso = false;
    let ultimoAmb = 0;
    let ultimoOficio = 0;
    let ultimoColmado = 0;
    let prevLluvia = estado.current.lluviaOn;
    let prevDia = estado.current.dia;
    let prevBlock = 0;
    let prevAcero = 0;
    let prevVac = 0;
    let galloDia = -1;
    let congelado = false;
    if (import.meta.env.DEV) {
      window.__controlsTest = {
        getPos: () => ({ x: estado.current.jugador.x, y: estado.current.jugador.y }),
        setKeys: (codes: string[]) => {
          keys.current = new Set(codes);
          aplicarMando();
        },
        setPos: (x: number, y: number) => {
          estado.current.jugador.x = x;
          estado.current.jugador.y = y;
          estado.current.destino = null;
          vis.current.cam.x = x;
          vis.current.cam.y = y;
        },
        estado: () => estado.current,
        audio: () => audio.current?.state ?? "sin",
        congelar: (v: boolean) => {
          congelado = v;
        },
      };
    }
    sonidoUi.ping = (id) => {
      const st = estado.current;
      sonar(audio.current, id as Sonido, !ajustesRef.current.sonido || !st || st.pausa || !!st.panel);
    };
    const frame = (now: number) => {
      if (muerto) return;
      const dt = Math.min(0.1, (now - ultimoT) / 1000);
      ultimoT = now;
      const v = vis.current;
      v.t += dt;
      v.dt = dt;
      v.compas = v.t % 1;
      aplicarMando();
      const callado = document.hidden || !ajustesRef.current.sonido || estado.current.pausa || !!estado.current.panel;
      if (!callado) {
        const amb = sonidoObra(estado.current);
        if (amb && v.t - ultimoAmb > 0.55) {
          ultimoAmb = v.t;
          sonar(audio.current, amb, false);
        }
      }
      if (estado.current.panel === "sello" && !v.selloOn) {
        v.selloOn = true;
        v.hit = 0.16;
        v.shake = 8.1;
        sonar(audio.current, "sello", callado);
      }
      if (estado.current.panel !== "sello") v.selloOn = false;
      if (estado.current.plomo && !v.plomoOn) {
        v.plomoOn = true;
        sonar(audio.current, "plomo", callado);
      }
      if (!estado.current.plomo) v.plomoOn = false;
      if (v.pedidos < 0) v.pedidos = estado.current.pedidos.length;
      else if (estado.current.pedidos.length < v.pedidos) {
        v.camion = v.t;
        sonar(audio.current, "camion", callado);
      }
      v.pedidos = estado.current.pedidos.length;
      const pasoPlano = planoRef.current;
      const punto = pasoPlano == null ? null : PUNTOS_PLANO[pasoPlano];
      if (punto) {
        v.foco = { x: punto.x, y: punto.y };
        v.marca = { n: pasoPlano! + 1, nombre: punto.marca, x: punto.x, y: punto.y };
      } else {
        v.foco = null;
        v.marca = null;
      }
      v.contrato = estado.current.panel === "contrato";
      if (document.hidden) {
        // oculta no corre el reloj aunque el navegador siga dando cuadros.
      } else if (v.hit > 0) v.hit -= dt;
      else if (!congelado) tick(estado.current, Math.min(0.1, dt), ajustesRef.current.vel);
      if (!prevLluvia && estado.current.lluviaOn) sonar(audio.current, "trueno", callado);
      prevLluvia = estado.current.lluviaOn;
      if (estado.current.dia !== prevDia) sonar(audio.current, "silbato", callado);
      prevDia = estado.current.dia;
      if (
        estado.current.firmado &&
        !estado.current.entregada &&
        estado.current.minuto >= 7 * 60 &&
        estado.current.minuto < 7 * 60 + 10 &&
        galloDia !== estado.current.dia &&
        audio.current
      ) {
        galloDia = estado.current.dia;
        sonar(audio.current, "gallo", callado);
      }
      const bloque = estado.current.etapa === 4 ? hechoDe(estado.current, 4, "block") : prevBlock;
      const acero = hechoDe(estado.current, 2, "acero") + hechoDe(estado.current, 6, "acero");
      const vaciado = hechoDe(estado.current, 3, "vaciar") + hechoDe(estado.current, 5, "vaciar") + hechoDe(estado.current, 6, "vaciar");
      if (!callado && v.t - ultimoOficio > 0.85) {
        if (bloque > prevBlock + 0.45) {
          sonar(audio.current, "block", false);
          ultimoOficio = v.t;
        } else if (acero > prevAcero + 0.45) {
          sonar(audio.current, "amarre", false);
          ultimoOficio = v.t;
        } else if (vaciado > prevVac + 0.35) {
          sonar(audio.current, "vaciado", false);
          ultimoOficio = v.t;
        }
      }
      prevBlock = bloque;
      prevAcero = acero;
      prevVac = vaciado;
      const deDia = estado.current.minuto >= 7 * 60 && estado.current.minuto < 17 * 60;
      if (!callado && estado.current.firmado && !estado.current.entregada && deDia && v.t - ultimoColmado > 1.8) {
        ultimoColmado = v.t;
        sonar(audio.current, "colmado", false);
      }
      if (
        dedo.current &&
        ajustesRef.current.control === "arrastre" &&
        !estado.current.panel &&
        !estado.current.pausa
      ) {
        seguirDedo(estado.current, dedo.current.x, dedo.current.y, false, VEL_MAESTRO * dt);
      }
      const gritos = estado.current.gritos;
      if (gritos && gritos.length) {
        for (const g of gritos) v.floaters.push({ x: g.x, y: g.y, texto: g.texto, oro: false, vida: 1.15 });
        estado.current.gritos = [];
      }
      marcarGuia(estado.current);
      for (const f of v.floaters) f.vida -= dt;
      v.floaters = v.floaters.filter((f) => f.vida > 0);
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.floor(w * dpr));
      const bh = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      try {
        pintar.current(ctx, w, h, estado.current, v, dpr);
      } catch (err) {
        if (!dibujoAviso) {
          dibujoAviso = true;
          console.warn(err);
        }
      }
      if (estado.current.panel === "sello") colocarSello();
      acc += dt;
      if (acc >= 0.2) {
        acc = 0;
        setSnap(structuredClone(estado.current));
      }
      guardado += dt;
      if (estado.current.panel === "perdida") borrar(estado.current);
      else if (guardado >= 20) {
        guardado = 0;
        guardar(estado.current);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.code)) e.preventDefault();
      // Espacio es la acción del juego; nunca «pulsa» el botón que quedó enfocado (Pausa, menú).
      if (e.code === "Space" && (e.target as HTMLElement | null)?.tagName === "BUTTON") (e.target as HTMLElement).blur();
      keys.current.add(e.code);
      desbloquear();
      const s = estado.current;
      if (e.repeat) return;
      if (s.panel === "sello" && (e.code === "Space" || e.code === "Enter" || e.code === "KeyE" || e.code === "Escape")) {
        cerrarSello();
        return;
      }
      if (e.code === "Space" || e.code === "KeyE") intentarGolpe(vis.current.t);
      else if (e.code === "KeyL" && s.firmado && !s.panel) act((st) => abrirPanel(st, "libreta"));
      else if (e.code === "KeyC" && s.firmado && (!s.panel || s.panel === "pausa")) act((st) => abrirPanel(st, "cuadrilla"));
      else if (e.code === "KeyP" && (!s.panel || s.panel === "pausa")) {
        act((st) => {
          if (st.panel && st.panel !== "pausa") return;
          if (st.panel === "pausa") {
            st.panel = null;
            st.pausa = false;
          } else {
            st.panel = "pausa";
            st.pausa = true;
            guardar(st);
          }
        });
      } else if (e.code === "KeyT" && s.firmado && !s.panel) act((st) => abrirDespacho(st));
      else if (e.code === "Escape") act((st) => cerrarPanel(st));
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement | null)?.tagName === "BUTTON") e.preventDefault();
      keys.current.delete(e.code);
    };
    const blur = () => {
      keys.current.clear();
      // con el dedo en la palanca (p. ej. llega una notificación) no se suelta; se suelta al levantar el dedo.
      if (palancaDedo.id == null) joy.current = { ax: 0, ay: 0 };
    };
    // Safari iOS/iPadOS en segundo plano (visibilitychange o pagehide): se pausa el reloj, se calla el sonido y se guarda.
    const aSegundoPlano = () => {
      const st = estado.current;
      if (st.firmado && !st.panel) {
        st.panel = "pausa";
        st.pausa = true;
      }
      keys.current.clear();
      if (palancaDedo.id == null) joy.current = { ax: 0, ay: 0 };
      if (audio.current && audio.current.state === "running") void audio.current.suspend();
      guardar(st);
      setSnap(structuredClone(st));
    };
    const oculto = () => {
      if (document.hidden) aSegundoPlano();
      else if (audio.current && audio.current.state === "suspended") void audio.current.resume();
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", oculto);
    window.addEventListener("pagehide", aSegundoPlano);
    return () => {
      window.removeEventListener("pagehide", aSegundoPlano);
      muerto = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", oculto);
      if (import.meta.env.DEV) delete window.__controlsTest;
    };
  }, [act, aplicarMando, cerrarSello, desbloquear, intentarGolpe]);

  const mundoDe = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const m = mundoDesde(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, vis.current);
    m.x = Math.max(MAPA.x0, Math.min(MAPA.x1, m.x));
    m.y = Math.max(MAPA.y0, Math.min(MAPA.y1, m.y));
    return m;
  };

  const nuevaObra = () => {
    reiniciarGuia();
    const s = nueva();
    tomarPartida(s);
    if (roto.current) {
      s.avisos.push({ id: 1, texto: AVISO_ROTO });
      s.avisoSeq = 1;
    }
    s.panel = null;
    estado.current = s;
    vis.current.cam = { x: s.jugador.x, y: s.jugador.y };
    vis.current.floaters = [];
    vis.current.ondas = [];
    vis.current.camion = -1;
    vis.current.plomoOn = false;
    setSeguir(false);
    setSnap(structuredClone(s));
    guardar(s);
  };

  return (
    <main className="juego-root relative h-full w-full overflow-hidden bg-noche text-cemento-claro select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" ? e.button !== 0 : e.button > 0) return;
          if (dedoId.current != null && dedoId.current !== e.pointerId) return;
          dedoId.current = e.pointerId;
          toque.current = { x: e.clientX, y: e.clientY };
          if (e.pointerType === "mouse") {
            const rect = e.currentTarget.getBoundingClientRect();
            vis.current.mira = mundoDesde(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, vis.current);
          }
          if (ajustes.control !== "arrastre") return;
          const s = estado.current;
          if (s.panel || s.pausa) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          desbloquear();
        }}
        onPointerMove={(e) => {
          if (dedoId.current != null && e.pointerId !== dedoId.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.pointerType === "mouse") {
            vis.current.mira = mundoDesde(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, vis.current);
          }
          const inicio = toque.current;
          const movido = !!inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) >= 18;
          if (ajustes.control === "arrastre" && movido && e.currentTarget.hasPointerCapture(e.pointerId)) dedo.current = mundoDe(e);
        }}
        onPointerUp={(e) => {
          if (dedoId.current != null && e.pointerId !== dedoId.current) return;
          dedoId.current = null;
          const inicio = toque.current;
          toque.current = null;
          const corto = !!inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 18;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          if (dedo.current) {
            dedo.current = null;
            seguirDedo(estado.current, estado.current.jugador.x, estado.current.jugador.y, true);
          }
          const s = estado.current;
          if (corto && !s.panel && !s.pausa && !s.entregada && palancaDedo.id == null) {
            const m = mundoDe(e);
            s.destino = { x: m.x, y: m.y };
            s.mando.ax = 0;
            s.mando.ay = 0;
            joy.current = { ax: 0, ay: 0 };
          }
        }}
        onPointerCancel={(e) => {
          if (dedoId.current != null && e.pointerId !== dedoId.current) return;
          dedoId.current = null;
          toque.current = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          dedo.current = null;
          seguirDedo(estado.current, estado.current.jugador.x, estado.current.jugador.y, true);
        }}
        onPointerLeave={() => {
          vis.current.mira = null;
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      <Hud
        s={snap}
        movil={movil}
        late={late}
        onLibreta={() => act((s) => abrirPanel(s, "libreta"))}
        onCuadrilla={() => act((s) => abrirPanel(s, "cuadrilla"))}
        onPausa={() =>
          act((s) => {
            if (s.panel && s.panel !== "pausa") return;
            if (s.panel === "pausa") {
              s.panel = null;
              s.pausa = false;
            } else {
              s.panel = "pausa";
              s.pausa = true;
              guardar(s);
            }
          })
        }
        onTerminar={() => {
          act((s) => abrirDespacho(s));
          guardar(estado.current);
        }}
        onQuitar={(id) => act((s) => quitarAviso(s, id))}
        onAdelanto={() =>
          act((s) => {
            const e = adelantar(s);
            if (e) {
              s.avisoSeq += 1;
              s.avisos.push({ id: s.avisoSeq, texto: e });
            }
          })
        }
        onFiar={() =>
          act((s) => {
            const e = fiar(s);
            if (e) {
              s.avisoSeq += 1;
              s.avisos.push({ id: s.avisoSeq, texto: e });
            }
          })
        }
      />

      {movil && ajustes.control !== "arrastre" ? (
        <Palanca
          oculto={!!snap.panel}
          compacto={bajo}
          on={(ax, ay) => {
            joy.current = { ax, ay };
          }}
        />
      ) : null}
      {movil && !snap.panel ? (
        <button
          type="button"
          className={"absolute right-3 bottom-3 z-20 touch-manipulation rounded-md border-2 border-tinta bg-colmado-amarillo font-display text-tinta shadow-[3px_3px_0_#1B1F23] " + (bajo ? "min-h-11 min-w-16 px-2 text-xl" : "min-h-16 min-w-24 px-4 text-3xl")}
          style={{ touchAction: "manipulation" }}
          onClick={() => {
            desbloquear();
            intentarGolpe(vis.current.t);
          }}
        >
          ¡Dale!
        </button>
      ) : null}
      {firmadoSello ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="sello-caer max-w-[92vw] border-8 border-tinta bg-cemento-claro px-4 py-3 text-center font-display text-4xl text-tinta sm:text-6xl">FIRMADO</div>
        </div>
      ) : null}
      {plano != null && PUNTOS_PLANO[plano] ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <section className="pointer-events-auto plancha w-full max-w-md border-2 border-tinta px-4 py-3 text-tinta shadow-[3px_3px_0_#1B1F23]">
            <p className="font-hand text-sm">El plano · {plano + 1} de 4</p>
            <h2 className="font-display text-3xl leading-none">{PUNTOS_PLANO[plano]!.marca}</h2>
            <p className="mt-1 font-hand text-base leading-snug">{PUNTOS_PLANO[plano]!.texto}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 border-2 border-tinta bg-cemento-claro px-3 font-hand text-tinta"
                onClick={() => {
                  marcarPlano();
                  setPlano(null);
                }}
              >
                Saltar
              </button>
              <button
                type="button"
                className="min-h-11 flex-1 border-2 border-tinta bg-tinta px-3 font-hand text-cemento-claro"
                onClick={() => {
                  marcarPlano();
                  setPlano((n) => (n == null || n >= 3 ? null : n + 1));
                }}
              >
                {plano === 3 ? "A trabajar" : "Siguiente"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <Paneles
        s={snap}
        seguir={seguir}
        act={(fn) => {
          act(fn);
          if (estado.current.panel === null && estado.current.firmado) guardar(estado.current);
        }}
        onNueva={nuevaObra}
        onContinuar={() =>
          act((s) => {
            s.pausa = false;
            if (!s.firmado) s.panel = null;
            else if (s.entregada) s.panel = "informe";
            else if (s.sita?.oferta) {
              s.sita.fase = "nota";
              s.panel = "sita";
            } else s.panel = null;
          })
        }
        ajustes={ajustes}
        onAjustes={(a) => {
          ajustesRef.current = a;
          setAjustes(a);
          guardarAjustes(a);
        }}
        selloAncla={selloAncla}
        onTocarSello={(x, y) => cerrarSello(x, y)}
      />
    </main>
  );
}
