import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cargar, borrar, guardar, cargarAjustes, guardarAjustes, type Ajustes } from "@/game/guardar";
import { VEL_MAESTRO } from "@/game/datos";
import { dibujar, mundoDesde, puntoEnPantalla, type Floater, type Vis } from "@/game/dibujo";
import { reiniciarGuia } from "@/game/guia";
import {
  abrirPanel,
  adelantar,
  cerrarPanel,
  golpe,
  nueva,
  marcarGuia,
  quitarAviso,
  seguirDedo,
  terminarJornada,
  tick,
  type Estado,
} from "@/game/motor";
import { Hud } from "./Hud";
import { Paneles } from "./Paneles";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPos: () => ({ x: number; y: number });
      setKeys: (codes: string[]) => void;
      setPos: (x: number, y: number) => void;
    };
  }
}

const AVISO_ROTO = "El guardado estaba dañado. Lo aparté y esta es una obra nueva.";

function crear(): { s: Estado; seguir: boolean; roto: boolean } {
  const c = cargar();
  if (c.s) {
    c.s.mando = { ax: 0, ay: 0 };
    c.s.destino = null;
    c.s.vel = 0;
    if (c.s.panel !== "pausa") c.s.pausa = false;
    return { s: c.s, seguir: true, roto: false };
  }
  const s = nueva();
  if (c.roto) {
    s.avisos.push({ id: 1, texto: AVISO_ROTO });
    s.avisoSeq = 1;
  }
  return { s, seguir: false, roto: c.roto };
}

function sonar(ctx: AudioContext | null, tipo: "toc" | "compas" | "sello" | "plomo" | "moneda" | "motor", callado: boolean) {
  if (!ctx || callado) return;
  const nota = (freq: number, t: number, dur: number, gain = 0.04) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo === "motor" ? "sawtooth" : "triangle";
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + dur);
    o.stop(ctx.currentTime + t + dur);
  };
  if (tipo === "toc") nota(196, 0, 0.06, 0.03);
  else if (tipo === "compas") nota(620, 0, 0.07, 0.035);
  else if (tipo === "sello") nota(140, 0, 0.18, 0.05);
  else if (tipo === "plomo") {
    nota(520, 0, 0.1, 0.03);
    nota(390, 0.12, 0.14, 0.03);
  } else if (tipo === "moneda") nota(880, 0, 0.12, 0.03);
  else nota(70, 0, 0.25, 0.02);
}

function Palanca({ on }: { on: (ax: number, ay: number) => void }) {
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
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    setKnob({ x: 0, y: 0 });
    on(0, 0);
  };
  return (
    <div
      ref={ref}
      className="absolute bottom-4 left-4 z-20 h-28 w-28 rounded-full border-2 border-papel/80 bg-fondo/50"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        mover(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) mover(e);
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <div
        className="absolute top-1/2 left-1/2 h-12 w-12 rounded-full border-2 border-tinta bg-papel"
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
  const [late, setLate] = useState(false);
  const [vuelo, setVuelo] = useState<"entra" | "sale" | null>(null);
  const [vueloSello, setVueloSello] = useState<{ id: number; texto: string; x: number; y: number; tx: number; ty: number } | null>(null);
  const [firmadoSello, setFirmadoSello] = useState(false);
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
  });
  const keys = useRef(new Set<string>());
  const joy = useRef({ ax: 0, ay: 0 });
  const dedo = useRef<{ x: number; y: number } | null>(null);
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
      fn(estado.current);
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
      ax = joy.current.ax;
      ay = joy.current.ay;
    }
    s.mando.ax = ax;
    s.mando.ay = ay;
  }, []);

  const intentarGolpe = useCallback(
    (t: number) => {
      const s = estado.current;
      if (!s.firmado || s.panel || s.pausa || s.entregada) return;
      if (t - ultimo.current < 0.6) return;
      ultimo.current = t;
      const fase = vis.current.compas;
      const al = fase <= 0.15 || fase >= 0.85;
      const f = golpe(s, al);
      if (f) {
        vis.current.floaters = [{ x: f.x, y: f.y, texto: f.texto, oro: f.oro, vida: 0.9 }];
        if (f.oro) vis.current.ondas.push({ x: f.x, y: f.y, t: vis.current.t });
        const callado = !ajustesRef.current.sonido || estado.current.pausa || estado.current.panel === "pausa";
        sonar(audio.current, f.oro ? "compas" : "toc", callado);
      }
      flush();
    },
    [flush],
  );

  useEffect(() => {
    const mq = () => setMovil(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900);
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);

  useEffect(() => {
    if (snap.cobrado > cobrado.current + 1) {
      setLate(true);
      setVuelo("entra");
      sonar(audio.current, "moneda", !ajustesRef.current.sonido || snap.pausa || snap.panel === "pausa");
      const a = window.setTimeout(() => setLate(false), 350);
      const b = window.setTimeout(() => setVuelo(null), 700);
      cobrado.current = snap.cobrado;
      return () => {
        window.clearTimeout(a);
        window.clearTimeout(b);
      };
    }
    cobrado.current = snap.cobrado;
  }, [snap.cobrado]);

  const nominaYa = useRef(snap.nominaPagada);
  const firmadoYa = useRef(snap.firmado);
  useEffect(() => {
    if (!nominaYa.current && snap.nominaPagada && snap.firmado) {
      setVuelo("sale");
      const id = window.setTimeout(() => setVuelo(null), 700);
      nominaYa.current = snap.nominaPagada;
      return () => window.clearTimeout(id);
    }
    nominaYa.current = snap.nominaPagada;
  }, [snap.nominaPagada, snap.firmado]);
  useEffect(() => {
    if (!firmadoYa.current && snap.firmado) {
      setFirmadoSello(true);
      const id = window.setTimeout(() => setFirmadoSello(false), 1200);
      firmadoYa.current = true;
      return () => window.clearTimeout(id);
    }
    firmadoYa.current = snap.firmado;
  }, [snap.firmado]);

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

    const qa =
      import.meta.env.DEV || new URLSearchParams(window.location.search).has("qa");
    if (qa) {
      window.__controlsTest = {
        getYaw: () => estado.current.yaw,
        getSpeed: () => estado.current.vel,
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
      };
    }

    let dibujoAviso = false;
    const frame = (now: number) => {
      if (muerto) return;
      const dt = Math.min(0.1, (now - ultimoT) / 1000);
      ultimoT = now;
      const v = vis.current;
      v.t += dt;
      v.dt = dt;
      v.compas = v.t % 1;
      aplicarMando();
      const callado = !ajustesRef.current.sonido || estado.current.pausa || estado.current.panel === "pausa";
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
        sonar(audio.current, "motor", callado);
      }
      v.pedidos = estado.current.pedidos.length;
      if (v.hit > 0) v.hit -= dt;
      else tick(estado.current, Math.min(0.1, dt * ajustesRef.current.vel));
      if (
        dedo.current &&
        ajustesRef.current.control === "arrastre" &&
        estado.current.firmado &&
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
      if (estado.current.panel === "perdida") borrar();
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
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      keys.current.add(e.code);
      desbloquear();
      const s = estado.current;
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "KeyE") intentarGolpe(vis.current.t);
      else if (e.code === "KeyL" && s.firmado && !s.panel) act((st) => abrirPanel(st, "libreta"));
      else if (e.code === "KeyC" && s.firmado && (!s.panel || s.panel === "pausa")) act((st) => abrirPanel(st, "cuadrilla"));
      else if (e.code === "KeyP" && s.firmado) {
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
      } else if (e.code === "KeyT" && s.firmado && !s.panel) act((st) => terminarJornada(st));
      else if (e.code === "Escape") act((st) => cerrarPanel(st));
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    const blur = () => {
      keys.current.clear();
      joy.current = { ax: 0, ay: 0 };
    };
    const oculto = () => {
      if (document.hidden) guardar(estado.current);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", oculto);
    return () => {
      muerto = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", oculto);
      if (qa) delete window.__controlsTest;
    };
  }, [act, aplicarMando, desbloquear, intentarGolpe]);

  const mundoDe = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const m = mundoDesde(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, vis.current);
    m.x = Math.max(0.6, Math.min(33.4, m.x));
    m.y = Math.max(3.75, Math.min(25.5, m.y));
    return m;
  };

  const nuevaObra = () => {
    reiniciarGuia();
    const s = nueva();
    if (roto.current) {
      s.avisos.push({ id: 1, texto: AVISO_ROTO });
      s.avisoSeq = 1;
    }
    s.panel = "contrato";
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
    <main className="juego-root relative h-full w-full overflow-hidden bg-fondo text-papel select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onPointerDown={(e) => {
          if (e.button !== 0 || ajustes.control !== "arrastre") return;
          const s = estado.current;
          if (!s.firmado || s.panel || s.pausa) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dedo.current = mundoDe(e);
          desbloquear();
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          vis.current.mira = mundoDesde(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, vis.current);
          if (dedo.current && e.currentTarget.hasPointerCapture(e.pointerId)) dedo.current = mundoDe(e);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          if (!dedo.current) return;
          dedo.current = null;
          seguirDedo(estado.current, estado.current.jugador.x, estado.current.jugador.y, true);
        }}
        onPointerCancel={(e) => {
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
          act((s) => terminarJornada(s));
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
        vuelo={vuelo}
      />

      {movil && snap.firmado && !snap.panel && ajustes.control !== "arrastre" ? (
        <Palanca
          on={(ax, ay) => {
            joy.current = { ax, ay };
          }}
        />
      ) : null}
      {movil && snap.firmado && !snap.panel ? (
        <button
          type="button"
          className="absolute right-4 bottom-4 z-20 min-h-16 min-w-24 border-2 border-tinta bg-oro px-4 font-display text-3xl text-tinta"
          onPointerDown={(e) => {
            e.preventDefault();
            desbloquear();
            intentarGolpe(vis.current.t);
          }}
        >
          ¡Dale!
        </button>
      ) : null}
      {firmadoSello ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="sello-caer border-8 border-tinta bg-papel px-6 py-3 font-display text-6xl text-tinta">FIRMADO</div>
        </div>
      ) : null}
      {vueloSello ? (
        <div className="pointer-events-none fixed z-50" style={{ left: vueloSello.x, top: vueloSello.y }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={vueloSello.id + "-" + i}
              className="moneda-vuelo absolute h-10 w-10 rounded-full border-4 border-tinta bg-oro"
              style={{
                left: (i - 2) * 18,
                top: (i % 2) * 12 - 8,
                animationDelay: `${i * 40}ms`,
                ["--tx" as string]: `${vueloSello.tx - (i - 2) * 10}px`,
                ["--ty" as string]: `${vueloSello.ty}px`,
              }}
            />
          ))}
          <span
            className="moneda-vuelo absolute font-display text-5xl whitespace-nowrap text-oro"
            style={{
              left: 0,
              top: -8,
              textShadow: "0 2px 0 #1d1712, 2px 0 0 #1d1712, -2px 0 0 #1d1712, 0 -2px 0 #1d1712",
              animationDelay: "30ms",
              ["--tx" as string]: `${vueloSello.tx}px`,
              ["--ty" as string]: `${vueloSello.ty}px`,
            }}
          >
            {vueloSello.texto}
          </span>
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
            if (!s.firmado) s.panel = "contrato";
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
        onTocarSello={(texto, x, y) => {
          const caja = document.querySelector("[data-caja]")?.getBoundingClientRect();
          const cx = caja ? caja.left + caja.width * 0.42 : window.innerWidth - 78;
          const cy = caja ? caja.top + caja.height * 0.35 : 28;
          const neto = Number(texto.replace(/[^\d]/g, ""));
          if (neto > 0) cobrado.current = estado.current.cobrado + neto;
          setLate(true);
          setVueloSello({ id: performance.now(), texto, x, y, tx: cx - x, ty: cy - y });
          sonar(audio.current, "moneda", !ajustesRef.current.sonido || estado.current.pausa);
          window.setTimeout(() => setLate(false), 350);
          window.setTimeout(() => setVueloSello(null), 900);
        }}
      />
    </main>
  );
}
