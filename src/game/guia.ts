export const GUIA_MS = 20_000;
const VUELTA_MS = 60_000;

type Reloj = { paso: number; nace: number; acum: number; cerrada: number; escondida: number; vuelta: number; vista: number };

const reloj: Reloj = { paso: -1, nace: -1, acum: 0, cerrada: -1, escondida: 0, vuelta: -1, vista: -1 };
const oyen = new Set<() => void>();
let timer: number | null = null;

function avisar() {
  for (const fn of oyen) fn();
}

function recordar(paso: number, ahora: number) {
  if (paso !== 1 || reloj.vuelta === 1) return;
  if (reloj.cerrada !== 1 || reloj.escondida <= 0) return;
  if (ahora - reloj.escondida < VUELTA_MS) return;
  reloj.vuelta = 1;
  reloj.cerrada = -1;
  reloj.acum = 0;
  reloj.nace = ahora;
  reloj.escondida = 0;
  reloj.vista = -1;
}

function transcurrido(ahora: number): number {
  const corriendo = reloj.nace >= 0 ? Math.max(0, ahora - reloj.nace) : 0;
  return reloj.acum + corriendo;
}

function pausar(ahora: number) {
  if (reloj.nace < 0) return;
  reloj.acum += Math.max(0, ahora - reloj.nace);
  reloj.nace = -1;
}

function vencer(ahora: number) {
  reloj.cerrada = reloj.paso;
  reloj.nace = -1;
  if (reloj.paso === 1 && reloj.vuelta !== 1) reloj.escondida = ahora;
}

function asegurar() {
  if (timer != null || typeof window === "undefined") return;
  timer = window.setInterval(() => {
    const ahora = Date.now();
    if (reloj.paso < 0 || reloj.paso >= 8) return;
    if (reloj.vista !== reloj.paso) return;
    if (reloj.cerrada === reloj.paso) {
      const antes = reloj.nace;
      recordar(reloj.paso, ahora);
      if (reloj.nace !== antes) avisar();
      return;
    }
    if (reloj.nace < 0) return;
    if (transcurrido(ahora) >= GUIA_MS) {
      vencer(ahora);
      avisar();
    }
  }, 200);
}

export function reiniciarGuia() {
  reloj.paso = -1;
  reloj.nace = -1;
  reloj.acum = 0;
  reloj.cerrada = -1;
  reloj.escondida = 0;
  reloj.vuelta = -1;
  reloj.vista = -1;
  avisar();
}

export function cerrarGuia(paso: number) {
  reloj.paso = paso;
  reloj.cerrada = paso;
  reloj.vista = paso;
  if (paso === 1 && reloj.vuelta !== 1 && reloj.escondida <= 0) reloj.escondida = Date.now();
  avisar();
}

/** Arranca los 20 s en el instante en que la línea se ve. Lo anterior no cuenta. */
export function guiaAnclar(paso: number, ahora = Date.now()) {
  if (paso < 0 || paso >= 8) return;
  if (reloj.vista === paso) return;
  if (reloj.cerrada === paso) return;
  reloj.vista = paso;
  reloj.paso = paso;
  reloj.nace = ahora;
  reloj.acum = 0;
  reloj.escondida = 0;
  asegurar();
}

export function guiaVisible(paso: number, mostrar: boolean, ahora = Date.now()): boolean {
  if (paso < 0 || paso >= 8) return false;
  if (!mostrar) {
    if (reloj.paso === paso && reloj.cerrada !== paso) pausar(ahora);
    return false;
  }
  if (reloj.paso !== paso) {
    reloj.paso = paso;
    reloj.nace = ahora;
    reloj.acum = 0;
    reloj.escondida = 0;
    reloj.vista = -1;
    asegurar();
  } else if (reloj.nace < 0 && reloj.cerrada !== paso) {
    reloj.nace = ahora;
    asegurar();
  }
  recordar(paso, ahora);
  if (reloj.cerrada === paso) return false;
  if (transcurrido(ahora) >= GUIA_MS) {
    vencer(ahora);
    return false;
  }
  return true;
}

export function alCambioGuia(fn: () => void): () => void {
  oyen.add(fn);
  asegurar();
  return () => {
    oyen.delete(fn);
  };
}
