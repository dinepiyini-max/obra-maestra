"""Lee una partida guardada por el juego.

El juego la guarda en el navegador, en la clave `obra-maestra-v2`, como un
sobre JSON: `{ "v", "partida", "rev", "t", "s" }`. `s` es el estado: día,
caja, etapa (un índice) y la cuadrilla en `gente`.

Este módulo solo lee ese sobre. No escribe en el juego.
"""

from __future__ import annotations

import json
from pathlib import Path

from obra.datos import cargar_datos

# En el motor, `aviso70` salta cuando el cansancio llega a 70.
UMBRAL_CANSANCIO = 70


def cargar_sobre(ruta: str | Path) -> dict:
    """Abre un archivo JSON. Acepta el sobre completo o el estado pelado."""
    path = Path(ruta)
    with path.open(encoding="utf-8") as archivo:
        datos = json.load(archivo)
    if not isinstance(datos, dict):
        raise ValueError(f"{path} no es un objeto JSON")
    return datos


def _estado(sobre: dict) -> dict:
    interno = sobre.get("s")
    if isinstance(interno, dict) and "dia" in interno:
        return interno
    if "dia" in sobre:
        return sobre
    raise ValueError("no parece una partida: falta el día (clave s.dia)")


def _nombre_etapa(indice, etapas: list) -> str | None:
    if not isinstance(indice, int) or indice < 0 or indice >= len(etapas):
        return None
    etapa = etapas[indice]
    if isinstance(etapa, dict):
        nombre = etapa.get("nombre")
        if isinstance(nombre, str):
            return nombre
    return None


def resumen_partida(sobre: dict, datos: dict | None = None) -> dict:
    """Día, caja, etapa y cuántos de la cuadrilla van cansados.

    `datos` es lo que devuelve `cargar_datos()`. Si no se pasa, se carga
    el JSON del juego para ponerle nombre a la etapa.
    """
    estado = _estado(sobre)
    if datos is None:
        datos = cargar_datos()
    etapas = datos.get("etapas") if isinstance(datos.get("etapas"), list) else []
    gente = estado.get("gente") if isinstance(estado.get("gente"), list) else []
    cuadrilla = []
    cansados = 0
    for persona in gente:
        if not isinstance(persona, dict):
            continue
        if persona.get("fuera") or persona.get("falto"):
            continue
        cansancio = persona.get("cansancio") or 0
        if not isinstance(cansancio, (int, float)):
            cansancio = 0
        esta_cansada = cansancio >= UMBRAL_CANSANCIO
        if esta_cansada:
            cansados += 1
        nombre = str(persona.get("nombre") or "").strip()
        apellido = str(persona.get("apellido") or "").strip()
        cuadrilla.append(
            {
                "nombre": f"{nombre} {apellido}".strip(),
                "oficio": persona.get("oficio"),
                "cansancio": cansancio,
                "cansada": esta_cansada,
            }
        )
    indice = estado.get("etapa")
    return {
        "dia": estado.get("dia"),
        "caja": estado.get("caja"),
        "etapa": indice,
        "etapa_nombre": _nombre_etapa(indice, etapas),
        "cuadrilla": cuadrilla,
        "cansados": cansados,
    }
