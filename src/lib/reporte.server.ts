const REPO = "dinepiyini-max/obra-maestra";
const VENTANA_MS = 10 * 60 * 1000;
const TOPE = 4;
const envios: number[] = [];

export interface ReporteIn {
  texto: string;
  version: string;
  dia: number;
  etapa: string;
}

export type ReporteOut = { ok: true; url: string; numero: number } | { ok: false; error: string };

function recortar(s: string, n: number): string {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

export async function crearIssueReporte(input: ReporteIn): Promise<ReporteOut> {
  const texto = recortar(input.texto ?? "", 800);
  const version = recortar(input.version ?? "", 40) || "sin versión";
  const etapa = recortar(input.etapa ?? "", 80) || "sin etapa";
  const dia = Number.isFinite(input.dia) ? Math.max(0, Math.round(input.dia)) : 0;
  if (texto.length < 4) return { ok: false, error: "Escribe qué pasó, aunque sea una frase." };
  const ahora = Date.now();
  while (envios.length && ahora - envios[0]! > VENTANA_MS) envios.shift();
  if (envios.length >= TOPE) return { ok: false, error: "Ya enviaste varios reportes. Espera unos minutos." };
  const token = process.env.GITHUB_REPORT_TOKEN?.trim();
  if (!token) return { ok: false, error: "No se pudo enviar: el servidor no tiene el token de reportes." };
  const title = `Reporte · día ${dia} · ${etapa}`.slice(0, 120);
  const body = [`Versión: ${version}`, `Día: ${dia}`, `Etapa: ${etapa}`, "", texto].join("\n");
  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "obra-maestra-reporte",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ title, body }),
    });
  } catch {
    return { ok: false, error: "No se pudo enviar: falló la conexión con GitHub." };
  }
  if (!res.ok) {
    let detalle = "";
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) detalle = recortar(j.message, 140);
    } catch {
      detalle = "";
    }
    return { ok: false, error: detalle ? `GitHub no creó el issue (${res.status}): ${detalle}` : `GitHub no creó el issue (${res.status}).` };
  }
  const creado = (await res.json()) as { html_url?: string; number?: number };
  envios.push(ahora);
  if (!creado.html_url || !creado.number) return { ok: false, error: "GitHub respondió sin número de issue." };
  return { ok: true, url: creado.html_url, numero: creado.number };
}
