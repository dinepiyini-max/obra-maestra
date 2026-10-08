export const GUIA_MS = 20_000;
const VUELTA_MS = 60_000;

type Reloj = { paso: number; nace: number; cerrada: number; escondida: number; vuelta: number };

const reloj: Reloj = { paso: -1, nace: 0, cerrada: -1, escondida: 0, vuelta: -1 };
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
  reloj.nace = ahora;
  reloj.escondida = 0;
}

function asegurar() {
  if (timer != null || typeof window === "undefined") return;
  timer = window.setInterval(() => {
    const ahora = Date.now();
    if (reloj.paso < 0 || reloj.paso >= 8) return;
    if (reloj.cerrada === reloj.paso) {
      const antes = reloj.nace;
      recordar(reloj.paso, ahora);
      if (reloj.nace !== antes) avisar();
      return;
    }
    if (ahora - reloj.nace >= GUIA_MS) {
      reloj.cerrada = reloj.paso;
      if (reloj.paso === 1 && reloj.vuelta !== 1) reloj.escondida = ahora;
      avisar();
    }
  }, 200);
}

export function reiniciarGuia() {
  reloj.paso = -1;
  reloj.nace = 0;
  reloj.cerrada = -1;
  reloj.escondida = 0;
  reloj.vuelta = -1;
  avisar();
}

export function cerrarGuia(paso: number) {
  reloj.paso = paso;
  reloj.cerrada = paso;
  if (paso === 1 && reloj.vuelta !== 1 && reloj.escondida <= 0) reloj.escondida = Date.now();
  avisar();
}

export function guiaVisible(paso: number, mostrar: boolean, ahora = Date.now()): boolean {
  if (paso < 0 || paso >= 8) return false;
  if (mostrar && reloj.paso !== paso) {
    reloj.paso = paso;
    reloj.nace = ahora;
    reloj.escondida = 0;
    asegurar();
  }
  if (reloj.paso !== paso) return false;
  recordar(paso, ahora);
  if (reloj.cerrada === paso) return false;
  if (ahora - reloj.nace >= GUIA_MS) {
    reloj.cerrada = paso;
    if (paso === 1 && reloj.vuelta !== 1) reloj.escondida = ahora;
    return false;
  }
  return mostrar;
}

export function alCambioGuia(fn: () => void): () => void {
  oyen.add(fn);
  asegurar();
  return () => {
    oyen.delete(fn);
  };
}