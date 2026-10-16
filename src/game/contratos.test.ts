import { test } from "node:test";
import assert from "node:assert/strict";
import { CASETA, CONTRATOS, contratoDe } from "./contratos.ts";
import { nueva, sanear, precioDe, bonoEntrega } from "./motor.ts";
import { ETAPAS, PRESUPUESTO } from "./datos.ts";

test("la caseta conserva los montos de la 1.0", () => {
  assert.equal(CASETA.presupuesto, 300_000);
  assert.equal(CASETA.adelanto, 90_000);
  assert.equal(CASETA.kit, 600);
  assert.equal(CASETA.cajaInicial, 89_400);
  assert.equal(CASETA.direccionDia, 1750);
  assert.equal(CASETA.plazo, 30);
  assert.equal(CASETA.bonoDia, 1500);
  assert.equal(CASETA.partidasTotal, 199_708);
  assert.deepEqual(CASETA.partidas, PRESUPUESTO);
  assert.equal(CASETA.etapas, ETAPAS);
  assert.equal(CASETA.etapas.length, 9);
  assert.deepEqual(Object.keys(CONTRATOS), ["caseta"]);
});

test("sin campo contrato (guardado 1.0) se juega la caseta", () => {
  const s = nueva(7);
  assert.equal(s.contrato, undefined);
  assert.equal(contratoDe(s), CASETA);
  assert.equal(contratoDe(sanear(JSON.parse(JSON.stringify(s)))), CASETA);
  assert.equal(contratoDe({ contrato: "no-existe" }), CASETA);
  assert.equal(precioDe(s), 300_000);
  assert.equal(bonoEntrega(s, 20), 15_000);
  assert.equal(bonoEntrega(s, 31), 0);
});
