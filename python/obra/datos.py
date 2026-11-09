"""Carga los números del juego.

El archivo `datos_juego.json` lo escribe `npm run exportar-datos` a partir
de `src/game/datos.ts`. Python no lee TypeScript. Si cambia un precio en
el juego, se vuelve a exportar y este módulo lo ve al cargarlo de nuevo.
"""

from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RUTA_DATOS = RAIZ / "datos_juego.json"


def cargar_datos(ruta: str | Path | None = None) -> dict:
    """Devuelve el contrato, el presupuesto, los materiales y los jornales."""
    path = Path(ruta) if ruta is not None else RUTA_DATOS
    with path.open(encoding="utf-8") as archivo:
        datos = json.load(archivo)
    if not isinstance(datos, dict):
        raise ValueError(f"{path} no es un objeto JSON")
    return datos
