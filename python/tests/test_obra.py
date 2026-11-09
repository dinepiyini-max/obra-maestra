"""Pruebas del taller (estas sí deben salir verdes)."""

from obra.datos import cargar_datos
from obra.partida import resumen_partida
from obra.presupuesto import ganancia, partida_mas_cara, porcentajes, total


def test_datos_del_juego():
    datos = cargar_datos()
    assert datos["contrato"] == 300_000
    assert datos["anticipo"] == 90_000
    assert datos["plazo_dias"] == 30
    assert datos["presupuesto_total"] == 199_708
    assert datos["presupuesto_por_nombre"]["Hormigón 1:2:3"] == 49_312
    assert datos["jornales"]


def test_presupuesto_real():
    datos = cargar_datos()
    montos = datos["presupuesto_por_nombre"]
    assert total(montos) == 199_708
    assert ganancia(datos["contrato"], montos) == 100_292
    assert partida_mas_cara(montos) == "Hormigón 1:2:3"
    assert porcentajes(montos)["Hormigón 1:2:3"] == 24.7


def test_resumen_de_un_sobre():
    datos = cargar_datos()
    sobre = {
        "v": 2,
        "partida": "7",
        "rev": 3,
        "t": 1,
        "s": {
            "dia": 18,
            "caja": 42000,
            "etapa": 4,
            "gente": [
                {"nombre": "Moncho", "apellido": "Taveras", "oficio": "albanil", "cansancio": 80},
                {"nombre": "Toño", "apellido": "Batista", "oficio": "peon", "cansancio": 10, "fuera": True},
                {"nombre": "Fefa", "apellido": "Peñaló", "oficio": "ayudante", "cansancio": 20},
            ],
        },
    }
    resumen = resumen_partida(sobre, datos)
    assert resumen["dia"] == 18
    assert resumen["caja"] == 42000
    assert resumen["etapa_nombre"] == datos["etapas"][4]["nombre"]
    assert resumen["cansados"] == 1
    assert [p["nombre"] for p in resumen["cuadrilla"]] == ["Moncho Taveras", "Fefa Peñaló"]
