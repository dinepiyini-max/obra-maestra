# Taller Python de Obra Maestra

El juego sigue en TypeScript, porque es lo que corre en el teléfono.
Esta carpeta es el taller de al lado: mides y practicas con **los números
reales del juego**, sin modificarlo.

Python solo lee. Si cambia un precio en el juego, alguien corre
`npm run exportar-datos` (desde la carpeta de arriba, la del repo) y
vuelve a escribir `datos_juego.json`. No edites ese JSON a mano.

## Abrirlo en PyCharm

1. **File → Open** y elige la carpeta `obra-maestra/python` (esta, no todo el repo).
2. **Settings → Project → Python Interpreter → Add Interpreter → Virtualenv → New**.
   PyCharm crea la carpeta `.venv` aquí. No se sube a GitHub.
3. Abre `requirements.txt`. PyCharm ofrece instalarlo: dale **Install requirements**.
   Si no sale el aviso, en la terminal de PyCharm (con el entorno activado):

   ```bash
   pip install -r requirements.txt
   ```

4. Clic derecho en la carpeta `tests` → **Run 'pytest in tests'**.

Qué vas a ver:

- `test_obra.py` en verde: el taller ya sabe sumar el presupuesto.
- En `test_ejercicio_01.py`, la prueba de los números sale verde.
  Las otras cuatro salen rojas hasta que completes el ejercicio. Eso es lo esperado.

## El ejercicio 1

Abre `ejercicios/ejercicio_01_presupuesto.py`. Hay tres funciones con `TODO`:
`total`, `partida_mas_cara` y `porcentajes`. Las pistas están en el archivo.

Cuando las cuatro pruebas rojas pasen a verde, la caseta cuadra:
el presupuesto suma P$199,708, de un contrato de P$300,000 quedan P$100,292,
y la partida más cara es Hormigón 1:2:3, el 24.7 %.

Esos números son los de `src/game/datos.ts`. Acarreo y Tiempo muerto están
en el juego a P$0, así que no cambian la suma.

## Qué hay en cada archivo

| Archivo | Para qué |
|---|---|
| `datos_juego.json` | Números exportados del juego. No se edita a mano. |
| `obra/datos.py` | `cargar_datos()` los lee. |
| `obra/presupuesto.py` | Totales, ganancia y el % de cada partida. |
| `obra/partida.py` | Lee una partida guardada (`{v, partida, rev, t, s}`) y dice el día, la caja, la etapa y quién va cansado. |
| `ejercicios/` | Lo que haces tú. |
| `tests/` | pytest. |

Una partida guardada vive en el navegador, en la clave `obra-maestra-v2`.
Más adelante se podrá copiar a un archivo y pasársela a `resumen_partida`.
El juego no trae un botón de exportar partida todavía.
