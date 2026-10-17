import { obraPerdida, sanear, validar, type Estado } from "./motor.ts";

/**
 * v23: el guardado lleva sobre con versión y dueño. Clave nueva (v2) para que una pestaña vieja de v22 o antes,
 * que sigue escribiendo «obra-maestra-v1», no pise la partida nueva. Además, una pestaña solo escribe o borra si
 * lo guardado es su propia partida, o si es más viejo que el momento en que ella tomó la suya.
 */
export const KEY = "obra-maestra-v2";
export const KEY_VIEJA = "obra-maestra-v1";
export const VERSION_GUARDADO = 2;
/** v27: una obra perdida no se queda en la clave de la partida: se archiva aquí (la última) y se empieza otra. */
export const KEY_PERDIDA = "obra-maestra-v2-perdida";

type Sobre = { v: number; partida: string; rev: number; t: number; s: unknown };

let mia: { partida: string; desde: number; rev: number } | null = null;
let vieja = false;

function partidaDe(s: Estado): string {
  return String(s.seed);
}

function leerSobre(): Sobre | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Sobre;
    if (j && typeof j === "object" && typeof j.partida === "string" && typeof j.t === "number") return j;
  } catch {
    /* roto: lo trata cargar() */
  }
  return null;
}

/** Esta pestaña se queda con la partida s (al cargar o al empezar una nueva). */
export function tomarPartida(s: Estado, ahora = Date.now()) {
  const sobre = typeof localStorage === "undefined" ? null : leerSobre();
  const rev = sobre && sobre.partida === partidaDe(s) ? sobre.rev : 0;
  mia = { partida: partidaDe(s), desde: ahora, rev };
  vieja = false;
}

/** true si otra pestaña guardó una partida más nueva y esta ya no debe escribir. */
export function pestanaVieja(): boolean {
  return vieja;
}

function puedoEscribir(s: Estado): boolean {
  if (vieja) return false;
  if (!mia || mia.partida !== partidaDe(s)) tomarPartida(s);
  const sobre = leerSobre();
  if (!sobre) return true;
  if (sobre.partida === mia!.partida) {
    // La misma partida avanzada por otra pestaña: no la retrocedemos.
    if (sobre.rev > mia!.rev) {
      vieja = true;
      return false;
    }
    return true;
  }
  // Otra partida guardada después de que esta pestaña tomó la suya: gana la más nueva.
  if (sobre.t > mia!.desde) {
    vieja = true;
    return false;
  }
  return true;
}

/** v27: archiva la obra perdida (solo la última) y borra la partida, para que «Continuar» no la abra. */
export function archivarPerdida(s: Estado, ahora = Date.now()) {
  if (typeof localStorage === "undefined") return;
  try {
    const sobre = leerSobre();
    // Una pestaña vieja no archiva ni borra la partida (distinta) de otra.
    if (sobre && sobre.partida !== partidaDe(s) && (vieja || (mia && sobre.t > mia.desde))) return;
    localStorage.setItem(KEY_PERDIDA, JSON.stringify({ v: VERSION_GUARDADO, partida: partidaDe(s), rev: 0, t: ahora, s }));
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_VIEJA);
  } catch {
    /* ignore */
  }
}

export function guardar(s: Estado, ahora = Date.now()): boolean {
  if (typeof localStorage === "undefined") return false;
  if (obraPerdida(s)) {
    archivarPerdida(s, ahora);
    return false;
  }
  try {
    if (!puedoEscribir(s)) return false;
    const rev = mia!.rev + 1;
    const sobre: Sobre = { v: VERSION_GUARDADO, partida: partidaDe(s), rev, t: ahora, s };
    localStorage.setItem(KEY, JSON.stringify(sobre));
    mia!.rev = rev;
    return true;
  } catch {
    /* la caja del navegador puede estar llena */
    return false;
  }
}

export function cargar(): { s: Estado | null; roto: boolean; perdida?: boolean } {
  if (typeof localStorage === "undefined") return { s: null, roto: false };
  let raw = localStorage.getItem(KEY);
  let clave = KEY;
  let data: unknown = null;
  if (!raw) {
    // Migración: la partida de v22 o antes sigue en la clave vieja; se lee una vez y se pasa a la nueva.
    raw = localStorage.getItem(KEY_VIEJA);
    clave = KEY_VIEJA;
  }
  if (!raw) return { s: null, roto: false };
  try {
    const j: unknown = JSON.parse(raw);
    data = clave === KEY ? (j as Sobre).s : j;
    if (!validar(data)) throw new Error("forma");
    // v27: una obra perdida guardada (p. ej. al pasar a segundo plano en el teléfono) no se carga: se archiva.
    if (obraPerdida(data as Estado)) {
      try {
        localStorage.setItem(KEY_PERDIDA, raw);
        localStorage.removeItem(clave);
      } catch {
        /* ignore */
      }
      return { s: null, roto: false, perdida: true };
    }
    const s = sanear(data);
    tomarPartida(s);
    if (clave === KEY_VIEJA) guardar(s);
    return { s, roto: false };
  } catch {
    try {
      localStorage.setItem(`${clave}-roto`, raw);
      localStorage.removeItem(clave);
    } catch {
      /* ignore */
    }
    return { s: null, roto: true };
  }
}

/** Borra el guardado solo si es de esta partida (una pestaña con la obra perdida no borra la de otra). */
export function borrar(s?: Estado) {
  if (typeof localStorage === "undefined") return;
  try {
    if (s) {
      const sobre = leerSobre();
      if (sobre && sobre.partida !== partidaDe(s)) return;
      if (vieja) return;
    }
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hayGuardado(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(KEY) != null || localStorage.getItem(KEY_VIEJA) != null;
}

/** Solo para pruebas. */
export function _reiniciarPestana() {
  mia = null;
  vieja = false;
}

const AJUSTES_KEY = "obra-maestra-ajustes";

export type Ajustes = { sonido: boolean; vel: 1 | 2; control: "circulo" | "arrastre" };

function ajustesBase(): Ajustes {
  return { sonido: true, vel: 1, control: "circulo" };
}

export function cargarAjustes(): Ajustes {
  if (typeof localStorage === "undefined") return ajustesBase();
  try {
    const raw = localStorage.getItem(AJUSTES_KEY);
    if (!raw) return ajustesBase();
    const j = JSON.parse(raw) as { sonido?: unknown; vel?: unknown; control?: unknown };
    return {
      sonido: j.sonido !== false,
      vel: j.vel === 2 ? 2 : 1,
      control: j.control === "arrastre" ? "arrastre" : "circulo",
    };
  } catch {
    return ajustesBase();
  }
}

export function guardarAjustes(a: Ajustes) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      AJUSTES_KEY,
      JSON.stringify({
        sonido: a.sonido !== false,
        vel: a.vel === 2 ? 2 : 1,
        control: a.control === "arrastre" ? "arrastre" : "circulo",
      }),
    );
  } catch {
    /* la caja del navegador puede estar llena */
  }
}
