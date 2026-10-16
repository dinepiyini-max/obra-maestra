# f3-contratodef: lo que hay que conciliar con la v24 (ed203ca)

- **Historia:** `main` (e562ecb) es un squash de la v23. Su árbol es idéntico al de `2e88e6b`, así que la base común con `v24` es `b61d6c8` y un `git merge` da conflictos falsos. Para llevar la v24 a `main` hay que aplicar `git diff 2e88e6b ed203ca` (o hacer rebase o cherry-pick de `15188a2..ed203ca` sobre `main`), no fusionar.
- **Texto:** `git apply --check` de ese diff sobre `f3-contratodef` entra limpio. La v24 no usa ninguna de las constantes de contrato que se movieron (`CONTRATO`, `ETAPAS`, `PLAZO_ENTREGA`, `BONO_DIA`, `DIRECCION_DIA`, `SOLAR`, `PRESUPUESTO`, `CUADRILLA`, `KIT_PRECIO`). Si un arreglo nuevo de la v24 las usa, se escribe `contratoDe(s).…`.
- **Números:** la v24 cambia el motor en `tandaCabe` (el último pedacito de mezcla se bate) y añade `fiarPedido`. Eso **puede cambiar resultados** de la caseta. Cuando la v24 entre a `main`:
  1. rebase de `f3-contratodef` sobre el nuevo `main`;
  2. regenerar la tabla de oro con el `main` nuevo **sin** el refactor (`scripts/f3/oro.sh` en un worktree limpio) y reemplazar `src/game/oro_caseta_1.0.json` (hay que renombrarlo a `oro_caseta_main.json`);
  3. comprobar que `contratos_oro.test.ts` sigue igual con el refactor.
  Es decir, la prueba de oro compara contra el `main` vigente, no contra una versión fija.
- **Pruebas e2e y `dinero.test.ts`:** la v24 las amplía. No tocan contratos.
