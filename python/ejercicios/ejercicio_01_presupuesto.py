"""Ejercicio 1 — ¿Cuánto me queda de la caseta?

Estos números salen del juego (`src/game/datos.ts`), exportados a
`python/datos_juego.json`. Aquí van copiados para que practiques sin
abrir archivos. Acarreo y Tiempo muerto existen en el juego con monto 0,
así que no cambian la suma.

Completa las tres funciones. Las pistas están en los comentarios.
Cuando `pytest` pinte de verde `test_total`, `test_ganancia`,
`test_mas_cara` y `test_porcentaje_hormigon`, lo lograste.

Debe imprimir, si corres este archivo:

    Total presupuesto: P$199,708
    Ganancia si todo sale exacto: P$100,292
    La partida más cara: Hormigón 1:2:3 (24.7%)
"""

CONTRATO = 300_000  # lo que paga Doña Carmen

PRESUPUESTO = {
    "Replanteo y limpieza": 3700,
    "Excavación": 1680,
    "Acero": 19807,
    "Encofrado": 14474,
    "Hormigón 1:2:3": 49312,
    "Block y mortero": 48096,
    "Techo": 23016,
    "Piso y terminación": 3014,
    "Dirección (tu jornal)": 28000,
    "Herramienta": 2609,
    "Fletes": 6000,
}


def total(presupuesto):
    """Suma todos los montos.

    TODO: devuelve la suma.
    Pista: sum(presupuesto.values())
    """
    raise NotImplementedError("Completa total(): suma los valores del presupuesto.")


def partida_mas_cara(presupuesto):
    """El nombre de la partida que más cuesta.

    TODO: devuelve el nombre (un texto), no el monto.
    Pista: max(presupuesto, key=presupuesto.get)
    """
    raise NotImplementedError("Completa partida_mas_cara(): devuelve el nombre.")


def porcentajes(presupuesto):
    """Un diccionario {nombre: % del total}, redondeado a 1 decimal.

    TODO: para cada partida, (monto / total) * 100, y round(..., 1).
    """
    raise NotImplementedError("Completa porcentajes(): un diccionario de porcentajes.")


def _mostrar():
    suma = total(PRESUPUESTO)
    queda = CONTRATO - suma
    cara = partida_mas_cara(PRESUPUESTO)
    parte = porcentajes(PRESUPUESTO)[cara]
    print(f"Total presupuesto: P${suma:,}")
    print(f"Ganancia si todo sale exacto: P${queda:,}")
    print(f"La partida más cara: {cara} ({parte}%)")


if __name__ == "__main__":
    _mostrar()
