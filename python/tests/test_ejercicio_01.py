"""Pruebas del ejercicio 1.

Las de las funciones se quedan en rojo hasta que completes
`ejercicios/ejercicio_01_presupuesto.py`. La primera solo comprueba que
los números copiados siguen siendo los del juego.
"""

from ejercicios.ejercicio_01_presupuesto import (
    CONTRATO,
    PRESUPUESTO,
    partida_mas_cara,
    porcentajes,
    total,
)
from obra.datos import cargar_datos


def test_numeros_son_los_del_juego():
    datos = cargar_datos()
    assert CONTRATO == datos["contrato"] == 300_000
    for nombre, monto in PRESUPUESTO.items():
        assert datos["presupuesto_por_nombre"][nombre] == monto
    # Acarreo y Tiempo muerto van en 0: la suma del juego es la misma.
    assert datos["presupuesto_total"] == 199_708
    assert sum(PRESUPUESTO.values()) == 199_708


def test_total():
    assert total(PRESUPUESTO) == 199_708


def test_ganancia():
    assert CONTRATO - total(PRESUPUESTO) == 100_292


def test_mas_cara():
    assert partida_mas_cara(PRESUPUESTO) == "Hormigón 1:2:3"


def test_porcentaje_hormigon():
    assert porcentajes(PRESUPUESTO)["Hormigón 1:2:3"] == 24.7
