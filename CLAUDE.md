# CLAUDE.md — App de inventario LEGO (nombre provisional)

## Contexto del proyecto

Pablo tiene una colección grande de LEGO de muchos años. Todos los sets están **desmontados** y las piezas repartidas en cajas físicas etiquetadas (ej. `caja1`, `cajaBlancas`), ordenadas solo un poco.

**Objetivo:** inventariar todas las piezas, **caja por caja** y durante una temporada (más o menos "un día por caja"). Cuando el inventario esté completo, podrá montar sets rápido: la app le dirá qué piezas necesita, en qué caja está cada una y cuáles le faltan.

- App personal: **un solo usuario, sin login**.
- Cuando un set se monta, se queda montado. **No** hace falta registrar de dónde salió cada pieza al montar.
- Este proyecto empieza **desde cero**. No hay código ni esquema anterior que reutilizar.

## Estado inicial de la carpeta (léelo primero)

Pablo ya ha preparado esto en la raíz del proyecto:

```
./
  CLAUDE.md
  .env                      # YA RELLENO con las 4 claves (ver "Variables de entorno")
  scripts/
    data/
      colors.csv            # descargados de rebrickable.com/downloads y ya descomprimidos
      part_categories.csv
      parts.csv
```

- **No sobrescribas, muevas ni borres** el `.env` ni los CSV. **Nunca muestres** el contenido del `.env` en la terminal ni en las respuestas: como mucho, comprueba que las 4 variables existen.
- Si no existe `.gitignore`, créalo con al menos `.env`, `scripts/data/` y `node_modules/`.
- La carpeta **no está vacía**, y `create-expo-app` puede negarse a crear el proyecto en una carpeta con archivos. Lo más seguro es crear el proyecto en una subcarpeta temporal y mover su contenido a la raíz, sin tocar los archivos de arriba. Explícale a Pablo lo que vas a hacer antes de hacerlo.
- Antes de escribir el script de importación, **lee la cabecera real** de cada CSV y adapta el SQL y el script a esas columnas.

### Supabase ya creado

- El proyecto ya existe. Al crearlo se marcaron: *Enable Data API* ✅, *Automatically expose new tables* ✅ y *Enable automatic RLS* ✅. Eso significa que **cada tabla nueva nace con RLS activado y sin políticas**, así que estará bloqueada hasta que crees sus políticas. Las políticas tienen que ir en el mismo SQL que crea las tablas.
- **Claude Code no tiene acceso directo a la base de datos** (no hay `SUPABASE_DB_URL`). Cuando haya que ejecutar SQL, dale a Pablo el bloque completo para que lo pegue en el **SQL Editor** de Supabase, y espera a que confirme que ha funcionado.
- Las claves pueden tener el formato nuevo (`sb_publishable_...` / `sb_secret_...`) o el antiguo (JWT `eyJ...`). Las dos funcionan con `supabase-js`.

## Cómo trabajar con Pablo

- Pablo estudia 2º de DAM. Sus apps anteriores las hizo sobre todo con ayuda de IA, así que **explica el razonamiento antes de implementar**.
- Avanza **paso a paso**: un paso cada vez, y confirma con Pablo antes de seguir con el siguiente.
- Da comandos y código **listos para copiar y pegar**, indicando el archivo exacto donde va cada cosa.
- Si algo falla, explica el error de forma clara y sin complicarlo.
- Estructura **modular**: archivos pequeños y con una sola responsabilidad. Nada de archivos gigantes.
- Si Pablo te corrige porque algo no encaja con su configuración real, adáptate a lo que dice él.

## Stack

- **React Native + Expo** (probar en Expo Go) con **Expo Router** y navegación por pestañas.
- **Supabase** (Postgres) como base de datos.
- **Rebrickable** como fuente del catálogo de piezas, colores y categorías (CSV + API v3).
- JavaScript (`.jsx` / `.js`).
- `@react-native-async-storage/async-storage` para lo local (piezas y colores recientes).

## Alcance del MVP (fase 1)

Solo **dos pantallas** (dos pestañas):

1. **Añadir**: meter piezas en una caja de forma rápida.
2. **Inventario**: ver todas las piezas que ya están metidas.

Los sets y la comprobación de piezas que faltan son la **fase 2**. El reconocimiento por foto es la **fase 3** y es opcional. No los construyas en la fase 1, pero el esquema no debe impedir añadirlos más adelante.

---

## Pantalla 1: Añadir piezas (`app/(tabs)/anadir.jsx`)

**Prioridad absoluta: velocidad.** Pablo se sienta con una caja y mete piezas sin parar.

De arriba a abajo:

1. **Caja activa** (`BoxSelector`): un selector desplegable. **Se queda fija** entre guardados y se recuerda (AsyncStorage) aunque cierres la app. Incluye la opción "+ Nueva caja" para crearla sin salir de la pantalla.
2. **Buscar pieza** (`PartSearch`):
   - Campo de texto que busca por `part_num` (el número que viene grabado en la pieza, ej. `3001`) o por nombre (`brick 2x4`).
   - Búsqueda con debounce (~300 ms) y como máximo unos 30 resultados.
   - **Chips de categoría** (Ladrillos, Placas, Tejas, Technic…) para filtrar.
   - Resultados en lista o cuadrícula **con foto**.
   - Antes de escribir nada, se muestran las **piezas recientes** (las últimas ~20 usadas).
3. **Color** (`ColorPicker`): cuadrícula de muestras de color usando el `rgb` de cada color, con los **más usados / recientes primero** y la opción de ver todos. **El último color elegido se mantiene** después de guardar.
4. **Cantidad** (`QuantityStepper`): botones grandes **+1, +5, +10**, un botón −1 y el número editable a mano. Empieza en 1.
5. **Botón Guardar**: llama a la función RPC `add_to_inventory`. Después de guardar:
   - **No** cambia de pantalla.
   - Se mantienen la caja y el color. Solo se limpia la pieza elegida y la cantidad vuelve a 1.
   - El foco vuelve al buscador.
6. **Añadidas en esta sesión**: lista corta debajo (ej. "3001 · Rojo · x12 ✓"), cada fila con un botón **Deshacer**, que llama a `add_to_inventory` con la cantidad en negativo.

Regla clave: si ya existen esa **caja + pieza + color**, la cantidad **se suma**. Nunca se crean filas duplicadas.

## Pantalla 2: Inventario (`app/(tabs)/inventario.jsx`)

- **Cabecera con totales**: piezas totales (suma de cantidades), tipos distintos (pieza + color) y número de cajas.
- **Buscador** por número o nombre, más **filtros** por caja, color y categoría.
- **Lista** (`PartRow`, usando `FlatList` con paginación o scroll infinito): foto, nombre, número de pieza, punto de color con su nombre, **cantidad total** y desglose por cajas (ej. "x23 · caja1 (15), cajaBlancas (8)"). Agrupa por pieza + color usando la vista `inventory_summary`.
- **Al tocar una fila** se abre el detalle (modal o pantalla nueva): cantidad en cada caja, con opción de editarla o borrarla.
- Pull-to-refresh, y que la lista se actualice al volver a la pestaña.

---

## Base de datos (Supabase)

### Catálogo (se importa una vez desde Rebrickable)

CSV de https://rebrickable.com/downloads/ : `colors.csv`, `part_categories.csv`, `parts.csv`.

```sql
create extension if not exists pg_trgm;

create table colors (
  id        integer primary key,      -- id de color de Rebrickable
  name      text not null,
  rgb       text not null,            -- hex sin '#', ej. 'C91A09'
  is_trans  boolean not null default false
);

create table part_categories (
  id    integer primary key,
  name  text not null
);

create table parts (
  part_num       text primary key,
  name           text not null,
  part_cat_id    integer references part_categories(id),
  part_material  text,
  img_url        text                 -- caché de la imagen genérica (se rellena bajo demanda)
);

create index parts_name_trgm on parts using gin (name gin_trgm_ops);
create index parts_num_trgm  on parts using gin (part_num gin_trgm_ops);
```

> Comprueba las columnas reales de los CSV al descargarlos (Rebrickable a veces añade columnas) y ajusta el SQL si hace falta. Si `is_trans` llega como `t`/`f`, conviértelo a booleano.

### Datos de Pablo

```sql
create table boxes (
  id          bigint generated always as identity primary key,
  name        text not null unique,   -- 'caja1', 'cajaBlancas'...
  created_at  timestamptz not null default now()
);

create table inventory (
  id          bigint generated always as identity primary key,
  box_id      bigint  not null references boxes(id) on delete cascade,
  part_num    text    not null references parts(part_num),
  color_id    integer not null references colors(id),
  quantity    integer not null check (quantity > 0),
  img_url     text,                   -- imagen de esa pieza en ese color (caché)
  updated_at  timestamptz not null default now(),
  unique (box_id, part_num, color_id)
);
```

### Función para sumar / restar cantidades

```sql
create or replace function add_to_inventory(
  p_box_id bigint, p_part_num text, p_color_id integer, p_qty integer, p_img_url text default null
) returns void language plpgsql as $$
begin
  insert into inventory (box_id, part_num, color_id, quantity, img_url)
  values (p_box_id, p_part_num, p_color_id, greatest(p_qty, 1), p_img_url)
  on conflict (box_id, part_num, color_id)
  do update set quantity   = inventory.quantity + p_qty,
                img_url    = coalesce(excluded.img_url, inventory.img_url),
                updated_at = now();

  delete from inventory
  where box_id = p_box_id and part_num = p_part_num and color_id = p_color_id
    and quantity <= 0;
end $$;
```

> Ojo: con `p_qty` negativo y una fila que no existe, el `insert` crearía una fila con cantidad 1. Revisa esta lógica y protégela (por ejemplo, si `p_qty < 0` haz solo `update` + `delete`) antes de usarla.

### Vista resumen para la pantalla Inventario

```sql
create view inventory_summary as
select i.part_num, p.name as part_name, p.part_cat_id,
       i.color_id, c.name as color_name, c.rgb,
       sum(i.quantity) as total_quantity,
       max(i.img_url)  as img_url,
       json_agg(json_build_object('box_id', b.id, 'box', b.name, 'qty', i.quantity)
                order by b.name) as boxes
from inventory i
join parts  p on p.part_num = i.part_num
join colors c on c.id = i.color_id
join boxes  b on b.id = i.box_id
group by i.part_num, p.name, p.part_cat_id, i.color_id, c.name, c.rgb;
```

### Seguridad (RLS)

La app es de un solo usuario y sin login, así que la app usa la **anon key**. Activa RLS con políticas permisivas para `anon` en `boxes` e `inventory` (lectura y escritura), y **solo lectura** en `parts`, `colors` y `part_categories`. Explícale a Pablo que cualquiera con la anon key podría escribir en la base de datos. Para un proyecto personal es aceptable, y más adelante se puede añadir login.

### Fase 2 (no implementar todavía)

Las tablas futuras serán `sets` (set_num, name, status: `pendiente` / `montado`) y `set_parts` (set_num, part_num, color_id, quantity, is_spare), importadas desde la API de Rebrickable. Al marcar un set como `montado`, sus piezas tienen que dejar de contar como disponibles. Las cantidades en `inventory` son por caja y la comprobación de un set cruzará `set_parts` con `inventory_summary`.

---

## Importación del catálogo

Crea un script Node aparte, `scripts/import-rebrickable.js`, que se ejecuta en el ordenador y **no** forma parte de la app:

- Lee los CSV descargados (con `csv-parse` o similar).
- Inserta en lotes de ~1000 filas con `upsert`, usando la **service role key** desde un `.env` que **nunca** se sube a Git.
- Orden de importación: `colors` → `part_categories` → `parts`.
- `parts.csv` tiene decenas de miles de filas, por eso no se usa el importador del panel de Supabase.

## API de Rebrickable (dentro de la app)

- Base: `https://rebrickable.com/api/v3/lego/`
- Cabecera: `Authorization: key <API_KEY>`. La key se consigue gratis creando una cuenta en Rebrickable (Settings → API).
- Imagen de una pieza en un color: `GET parts/{part_num}/colors/{color_id}/` → `part_img_url`.
- Imagen genérica de una pieza: `GET parts/{part_num}/` → `part_img_url`.
- Guarda las URL obtenidas en caché (`parts.img_url` / `inventory.img_url`) para no repetir llamadas. Tiene límite de peticiones, así que pide las imágenes bajo demanda y nunca de golpe.
- Si no hay imagen, muestra un placeholder.

## Variables de entorno (`.env` en la raíz, en `.gitignore`)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REBRICKABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # solo para scripts/, nunca se usa en la app
```

## Estructura de carpetas

```
app/
  _layout.jsx
  (tabs)/
    _layout.jsx          # pestañas: Añadir, Inventario
    anadir.jsx
    inventario.jsx
  pieza/[id].jsx         # detalle de pieza (o un modal)
components/
  BoxSelector.jsx
  PartSearch.jsx
  CategoryChips.jsx
  ColorPicker.jsx
  QuantityStepper.jsx
  SessionList.jsx
  PartRow.jsx
  PartImage.jsx          # imagen con placeholder y caché
lib/
  supabase.js            # cliente de Supabase
  rebrickable.js         # llamadas a la API de Rebrickable
  inventoryApi.js        # funciones de BD: buscar, añadir, resumen...
hooks/
  useInventory.js
  useRecents.js          # piezas y colores recientes (AsyncStorage)
  useActiveBox.js
scripts/
  import-rebrickable.js
```

## Orden de trabajo

1. Crear el proyecto Expo con Expo Router y pestañas (sin tocar `.env` ni `scripts/data/`), instalar dependencias, crear `.gitignore` si falta y crear `lib/supabase.js`. Comprobar que la app arranca en Expo Go.
2. Preparar el SQL completo (tablas + políticas RLS + función + vista) y dárselo a Pablo para que lo ejecute en el SQL Editor. Revisar antes la lógica de `add_to_inventory` con cantidades negativas.
3. Crear y ejecutar `scripts/import-rebrickable.js` con los CSV que ya están en `scripts/data/`. Comprobar que hay datos en `parts`.
4. Pantalla **Añadir**, en este orden: BoxSelector → PartSearch → ColorPicker → QuantityStepper → Guardar → SessionList.
5. Pantalla **Inventario**: totales, lista, filtros y detalle.
6. Pulir la velocidad de uso: recientes, colores frecuentes, foco automático, feedback al guardar (vibración o toast).
7. (Fase 2) Sets y comprobación de piezas que faltan.

En cada paso, explica qué vas a hacer y por qué, haz el cambio y dile a Pablo cómo probarlo en Expo Go antes de pasar al siguiente.
