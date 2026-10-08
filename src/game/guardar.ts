import { sanear, validar, type Estado } from "./motor.ts";

const KEY = "obra-maestra-v1";

export function guardar(s: Estado) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* la caja del navegador puede estar llena */
  }
}

export function cargar(): { s: Estado | null; roto: boolean } {
  if (typeof localStorage === "undefined") return { s: null, roto: false };
  const raw = localStorage.getItem(KEY);
  if (!raw) return { s: null, roto: false };
  try {
    const data: unknown = JSON.parse(raw);
    if (!validar(data)) throw new Error("forma");
    return { s: sanear(data), roto: false };
  } catch {
    try {
      localStorage.setItem(`${KEY}-roto`, raw);
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return { s: null, roto: true };
  }
}

export function borrar() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hayGuardado(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(KEY) != null;
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
