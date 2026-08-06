# Bitácora del viaje

Sitio estático para GitHub Pages con el itinerario del viaje (25 oct – 14 nov) y comentarios por día vía [giscus](https://giscus.app) (GitHub Discussions). Sin backend, sin base de datos.

## Estructura de archivos

```
site/
├── index.html              ← página única, se completa con JS
├── css/
│   └── style.css
├── js/
│   └── app.js               ← acá está la config de giscus (arriba del todo)
├── data/
│   ├── itinerario.json      ← EDITAR ACÁ para actualizar el viaje, sin tocar código
│   ├── transporte.json      ← checklist de vuelos / trenes / auto
│   └── hospedajes.json      ← checklist de hospedajes
└── README.md
```

## 1. Subir el sitio a un repo de GitHub

```bash
git init
git add .
git commit -m "Bitácora del viaje"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

Puede ser un repo **privado** (solo tu grupo tiene cuenta de GitHub igual, y giscus funciona con repos privados si el que comenta tiene acceso).

## 2. Activar GitHub Discussions en el repo

1. Andá a **Settings** del repo → sección **Features**.
2. Tildá **Discussions**.
3. Andá a la pestaña **Discussions** del repo y creá una categoría nueva llamada, por ejemplo, `Itinerario` (tipo "Open-ended discussion" o similar). Cada día del viaje va a usar esta categoría como "carpeta" de comentarios.

## 3. Configurar giscus

1. Entrá a **[giscus.app](https://giscus.app)**.
2. En "repository", poné `TU-USUARIO/TU-REPO` (el mismo que subiste).
3. Esperá el tilde verde que confirma que el repo es público (o que tenés instalada la app de giscus si es privado — te va a dar el link para instalarla).
4. En **"Page ↔ Discussions Mapping"** elegí **`Discussion title contains a specific term`** — esto es clave, porque así cada día tiene su propia discusión aunque todo viva en una sola página HTML.
5. En **"Discussion Category"** elegí la categoría `Itinerario` que creaste en el paso 2.
6. Al final de la página, giscus te muestra un bloque de configuración con:
   - `data-repo="TU-USUARIO/TU-REPO"`
   - `data-repo-id="R_kg..."`
   - `data-category="Itinerario"`
   - `data-category-id="DIC_kw..."`
7. Copiá esos 4 valores y pegalos en **`js/app.js`**, arriba del todo, en `GISCUS_CONFIG`:

```js
const GISCUS_CONFIG = {
  repo: "TU-USUARIO/TU-REPO",
  repoId: "R_kg...",          // el que te dio giscus.app
  category: "Itinerario",
  categoryId: "DIC_kw...",    // el que te dio giscus.app
  mapping: "specific",
  lang: "es"
};
```

No hace falta tocar nada más: el sitio ya arma un `data-term="dia-N"` distinto para cada día, así que giscus va a crear (la primera vez que alguien comenta) una discusión separada por cada día del viaje.

## 4. Activar GitHub Pages

1. **Settings** → **Pages**.
2. En "Build and deployment" → **Source**: `Deploy from a branch`.
3. **Branch**: `main`, carpeta `/ (root)` (si pusiste todo directo en la raíz del repo como en este proyecto).
4. Guardá. En un par de minutos el sitio va a estar en:
   `https://TU-USUARIO.github.io/TU-REPO/`

> Si el repo es privado, GitHub Pages con repo privado requiere plan GitHub Pro/Team/Enterprise, o bien tener el repo público. Si quieren mantenerlo privado pero gratis, la alternativa es un repo público (los comentarios en Discussions igual quedan a la vista de cualquiera con el link, como cualquier Discussion pública).

## 5. Actualizar el itinerario

Todo el contenido del viaje vive en **`data/itinerario.json`**. Para agregar, mover o corregir un día, editá ese archivo — no hace falta tocar HTML/CSS/JS. Estructura de cada día:

```json
{
  "dia": 10,
  "fecha": "Mar 3 nov",
  "bloque": "amsterdam-suiza",
  "tramo": "Ámsterdam → Chur",
  "medio": "tren",
  "notas": "Tren nocturno, salida 16:38, llegada miércoles 6:48.",
  "aviso": "Texto opcional — si lo agregás, aparece como aviso pendiente arriba del todo y como sello en la tarjeta del día."
}
```

- `medio` puede ser: `"vuelo"`, `"tren"`, `"auto"`, `"tren-auto"` o `"quieto"` (define el ícono).
- `bloque` tiene que coincidir con uno de los `id` definidos en `viaje.bloques` (dentro del mismo JSON), donde también se define el nombre y color de cada tramo del viaje.
- `aviso` es opcional — sacalo cuando el tema quede resuelto y listo, desaparece solo del panel de pendientes.

## 6. Actualizar los pasajes y hospedajes

Los pasajes y hospedajes **no son una lista aparte**: cada uno vive embebido dentro de la tarjeta del día que le corresponde (colapsado, con un resumen, y expandible para ver el resto de los datos). Igual que el itinerario, esto es 100% manual — no hay backend que guarde qué está reservado, así que **marcar algo como confirmado es editar el archivo y volver a hacer `git push`**.

### `data/transporte.json`

Cada pasaje tiene esta forma:

```json
{
  "id": "vuelo-santiago-londres",
  "tipo": "vuelo",
  "titulo": "Vuelo Santiago → Londres",
  "tramo": "Coruña/Santiago → Londres",
  "fecha": "Mié 28 oct",
  "dia": 4,
  "hecho": false,
  "campos": [
    { "label": "Aerolínea", "valor": "" },
    { "label": "N° de vuelo", "valor": "" },
    { "label": "Horario", "valor": "" },
    { "label": "Confirmación", "valor": "" }
  ],
  "notas": ""
}
```

- `dia` es el número de día (según `itinerario.json`) donde va a aparecer la caja completa del pasaje.
- Algunos ítems (el tren nocturno y el auto de Italia) también tienen `"diaFin"` — el día donde ese pasaje "termina" (llegada del tren, devolución del auto). Ese día muestra una nota más liviana ("Llega hoy: ...", "Devolución hoy: ...") en vez de la caja completa.
- Para marcarlo como reservado: poné `"hecho": true` y completá los `valor` de cada campo. La caja va a mostrar esos datos automáticamente en lugar de "Pendiente de reservar". `tipo` puede ser `"vuelo"`, `"tren"`, `"tren-auto"` o `"auto"` (define el ícono).

### `data/hospedajes.json`

Misma lógica, por ciudad/etapa, pero con `diaInicio` (check-in, muestra la caja completa) y `diaFin` (check-out, muestra la nota liviana "Salís hoy de..."):

```json
{
  "id": "londres",
  "titulo": "Londres",
  "fechas": "28 – 31 oct",
  "diaInicio": 4,
  "diaFin": 7,
  "hecho": false,
  "campos": [
    { "label": "Alojamiento", "valor": "" },
    { "label": "Dirección", "valor": "" },
    { "label": "Check-in", "valor": "" },
    { "label": "Check-out", "valor": "" },
    { "label": "Confirmación", "valor": "" }
  ],
  "notas": ""
}
```

Arriba del todo, en el encabezado del sitio, hay una línea que resume el total ("X de Y pasajes reservados · X de Y hospedajes confirmados") — se actualiza sola según cuántos ítems tengan `"hecho": true` en cada archivo.

## Notas

- Los comentarios de cada día se cargan recién cuando alguien abre "Comentarios y sugerencias" en esa tarjeta (así la página no arranca cargando 21 hilos de comentarios de una).
- El sitio es una sola página (`index.html`); no hay rutas ni build step. Cualquier editor de texto alcanza para modificar `itinerario.json`.