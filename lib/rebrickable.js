const BASE = 'https://rebrickable.com/api/v3/lego/';
const KEY = process.env.EXPO_PUBLIC_REBRICKABLE_KEY;
const CHUNK = 50; // part_nums por petición (para no pasarnos de longitud de URL)

// Imágenes genéricas de varias piezas en UNA sola petición por bloque.
// Devuelve { part_num: url } solo para las que tienen imagen.
export async function fetchPartImages(partNums) {
  const result = {};
  if (!KEY || partNums.length === 0) return result;

  for (let i = 0; i < partNums.length; i += CHUNK) {
    const chunk = partNums.slice(i, i + CHUNK);
    const url = `${BASE}parts/?part_nums=${encodeURIComponent(chunk.join(','))}&page_size=${CHUNK}`;
    try {
      const res = await fetch(url, { headers: { Authorization: `key ${KEY}` } });
      // 429 = demasiadas peticiones: lo dejamos para otro momento, sin romper la app.
      if (!res.ok) break;
      const json = await res.json();
      for (const p of json.results ?? []) {
        if (p.part_img_url) result[p.part_num] = p.part_img_url;
      }
    } catch {
      break; // sin red: las fotos son opcionales
    }
  }
  return result;
}

// part_num de Rebrickable a partir de un id de pieza de BrickLink, o null si no hay equivalencia.
// Se usa como plan B cuando un id de BrickLink no coincide con ningún part_num del catálogo.
export async function fetchPartNumByBricklinkId(bricklinkId) {
  const json = await apiGet(`${BASE}parts/?bricklink_id=${encodeURIComponent(bricklinkId)}&page_size=1`);
  return json.results?.[0]?.part_num ?? null;
}

// ───────────── Sets (fase 2) ─────────────

// Rebrickable identifica los sets como '75192-1'. Si Pablo escribe solo '75192', añadimos '-1'.
export function normalizeSetNum(input) {
  const s = String(input ?? '').trim();
  return /-\d+$/.test(s) ? s : `${s}-1`;
}

// GET con la key y errores claros (a diferencia de las fotos, aquí el usuario espera una respuesta).
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_TRIES = 4;

// Se reintenta si Rebrickable responde 429 (demasiadas peticiones) o un error temporal del servidor (5xx).
// Se respeta la cabecera Retry-After si viene; si no, se espera un poco más en cada intento.
async function apiGet(url) {
  if (!KEY) throw new Error('Falta EXPO_PUBLIC_REBRICKABLE_KEY en el .env');
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { Authorization: `key ${KEY}` } });
    } catch {
      throw new Error('Sin conexión con Rebrickable');
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_TRIES) {
      const retryAfter = Number(res.headers.get('Retry-After'));
      await sleep(retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 1500 * attempt);
      continue;
    }
    if (res.ok) return res.json();

    const err = new Error(
      res.status === 429
        ? 'Rebrickable limita las peticiones: espera unos segundos'
        : res.status === 404
          ? 'Rebrickable no encuentra ese dato (404)'
          : `Error de Rebrickable (${res.status})`
    );
    err.status = res.status;
    throw err;
  }
}

// Todos los resultados de un endpoint paginado (sigue `next` hasta que no haya más).
async function fetchAllResults(url) {
  const all = [];
  while (url) {
    const json = await apiGet(url);
    all.push(...(json.results ?? []));
    url = json.next; // null cuando no hay más páginas
  }
  return all;
}

// Fila de pieza en el formato de la app. `times` multiplica la cantidad (minifig x2 → sus piezas x2).
const toPartRow = (r, times = 1) => ({
  part_num: r.part.part_num,
  color_id: r.color.id,
  quantity: r.quantity * times,
  is_spare: !!r.is_spare,
  img_url: r.part.part_img_url ?? null,
});

// Cabecera de un set. Devuelve { set_num, name, year, num_parts, img_url }.
export async function fetchSet(setNum) {
  let s;
  try {
    s = await apiGet(`${BASE}sets/${encodeURIComponent(setNum)}/`);
  } catch (e) {
    // Solo aquí un 404 significa de verdad "ese set no existe".
    if (e.status === 404) throw new Error('Set no encontrado en Rebrickable');
    throw e;
  }
  return {
    set_num: s.set_num,
    name: s.name,
    year: s.year ?? null,
    num_parts: s.num_parts ?? null,
    img_url: s.set_img_url ?? null,
  };
}

// Todas las piezas de un set (sigue la paginación con `next`).
// Devuelve [{ part_num, color_id, quantity, is_spare, img_url }].
export async function fetchSetParts(setNum) {
  const results = await fetchAllResults(`${BASE}sets/${encodeURIComponent(setNum)}/parts/?page_size=1000`);
  return results.map((r) => toPartRow(r));
}

// Piezas de las minifiguras del set (el endpoint de piezas del set no las incluye).
// Pide la lista de minifigs y luego las piezas de cada una, de una en una para no pasarse del límite.
// Si una minifig viene x2, sus piezas se multiplican por 2.
export async function fetchSetMinifigParts(setNum) {
  const figs = await fetchAllResults(`${BASE}sets/${encodeURIComponent(setNum)}/minifigs/?page_size=1000`);
  const parts = [];
  for (const fig of figs) {
    const results = await fetchAllResults(`${BASE}minifigs/${encodeURIComponent(fig.set_num)}/parts/?page_size=1000`);
    for (const r of results) parts.push(toPartRow(r, fig.quantity));
  }
  return parts;
}
