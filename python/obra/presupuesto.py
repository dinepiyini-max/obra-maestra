"""Totales y porcentajes del presupuesto de la caseta.

Estas son las cuentas del taller. El ejercicio 1 pide las mismas tres
funciones, para practicarlas a mano, en `ejercicios/ejercicio_01_presupuesto.py`.
"""

from __future__ import annotations


def total(presupuesto: dict[str, int | float]) -> int | float:
    """Suma lo que cuesta cada partida."""
    return sum(presupuesto.values())


def partida_mas_cara(presupuesto: dict[str, int | float]) -> str:
    """Nombre de la partida con el monto más alto."""
    if not presupuesto:
        raise ValueError("el presupuesto está vacío")
    return max(presupuesto, key=presupuesto.get)


def porcentajes(presupuesto: dict[str, int | float]) -> dict[str, float]:
    """Qué tanto pesa cada partida, en % del total, con 1 decimal."""
    suma = total(presupuesto)
    if not suma:
        raise ValueError("el total del presupuesto es 0")
    return {nombre: round(monto * 100 / suma, 1) for nombre, monto in presupuesto.items()}


def ganancia(contrato: int | float, presupuesto: dict[str, int | float]) -> int | float:
    """Lo que queda si todo sale exactamente como el presupuesto."""
    return contrato - total(presupuesto)
