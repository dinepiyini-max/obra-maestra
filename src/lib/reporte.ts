import { createServerFn } from "@tanstack/react-start";

export const VERSION_REPORTE = "1";

export type ReporteResultado = { ok: true; url: string; numero: number } | { ok: false; error: string };

export const reportarObra = createServerFn({ method: "POST" })
  .validator((data: { texto: string; version: string; dia: number; etapa: string }) => ({
    texto: String(data?.texto ?? "").slice(0, 800),
    version: String(data?.version ?? "").slice(0, 40),
    dia: Number(data?.dia ?? 0),
    etapa: String(data?.etapa ?? "").slice(0, 80),
  }))
  .handler(async ({ data }): Promise<ReporteResultado> => {
    const { crearIssueReporte } = await import("./reporte.server.ts");
    return crearIssueReporte(data);
  });
