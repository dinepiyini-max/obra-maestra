#!/usr/bin/env python3
"""Uso: comparar.py <dir_tabla_rama>  -> compara con src/game/oro_caseta_1.0.json e imprime resumen por perfil/clima."""
import json, sys, os
oro = json.load(open(os.path.join(os.path.dirname(__file__), "../../src/game/oro_caseta_1.0.json")))
d = sys.argv[1]; difs = 0
print("| perfil | clima | entregadas/40 | día medio | ganancia media P$ | iguales a 1.0 |")
print("|---|---|---|---|---|---|")
for p in ["principiante", "intermedio", "experto"]:
    for c in ["poca", "normal", "mucha"]:
        a = [r for r in oro if r["perfil"] == p and r["clima"] == c]
        b = json.load(open(f"{d}/{p}-{c}.json"))
        ig = sum(x == y for x, y in zip(a, b)); difs += 40 - ig
        ent = [r for r in a if r["entregada"]]
        dia = sum(r["dia"] for r in ent) / max(1, len(ent))
        gan = sum(r["ganancia"] for r in a) / 40
        print(f"| {p} | {c} | {len(ent)} | {dia:.1f} | {gan:,.0f} | {ig}/40 |")
print(f"\nDiferencias: {difs}")
sys.exit(1 if difs else 0)
