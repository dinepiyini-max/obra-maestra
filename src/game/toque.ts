/** Un toque corto camina. Un dedo que se mueve, o la palanca, no. */
export const TOQUE_CAMINAR_PX = 28;

export function esToqueDeCaminar(opts: {
  dx: number;
  dy: number;
  panel: boolean;
  pausa: boolean;
  entregada: boolean;
  palanca: boolean;
}): boolean {
  if (opts.panel || opts.pausa || opts.entregada || opts.palanca) return false;
  return Math.hypot(opts.dx, opts.dy) < TOQUE_CAMINAR_PX;
}
