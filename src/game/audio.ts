/** Qué hacer con el audio en el próximo toque. «interrupted» es el de iOS al bloquear el teléfono. */
export function pasoAudio(state: string): "crear" | "reanudar" | "listo" {
  if (state === "sin" || state === "closed") return "crear";
  if (state !== "running") return "reanudar";
  return "listo";
}
