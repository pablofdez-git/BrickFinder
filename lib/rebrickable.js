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

// ───────────── Sets (fase 2) ─────────────

// Rebrickable identifica los sets como '75192-1'. Si Pablo escribe solo '75192', añadimos '-1'.
export function normalizeSetNum(input) {
  const s = String(input ?? '').trim();
  return /-\d+$/.test(s) ? s : `${s}-1`;
}

// GET con la key y errores claros (a diferencia de las fotos, aquí el usuario espera una respuesta).
async function apiGet(url) {
  if (!KEY) throw new Error('Falta EXPO_PUBLIC_REBRICKABLE_KEY en el .env');
  let res;
  try {
    res = await fetch(url, { headers: { Authorization: `key ${KEY}` } });
  } catch {
    throw new Error('Sin conexión con Rebrickable');
  }
  if (res.status === 404) throw new Error('Set no encontrado en Rebrickable');
  if (res.status === 429) throw new Error('Rebrickable limita las peticiones: espera unos segundos');
  if (!res.ok) throw new Error(`Error de Rebrickable (${res.status})`);
  return res.json();
}

// Cabecera de un set. Devuelve { set_num, name, year, num_parts, img_url }.
export async function fetchSet(setNum) {
  const s = await apiGet(`${BASE}sets/${encodeURIComponent(setNum)}/`);
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
  const parts = [];
  let url = `${BASE}sets/${encodeURIComponent(setNum)}/parts/?page_size=1000`;
  while (url) {
    const json = await apiGet(url);
    for (const r of json.results ?? []) {
      parts.push({
        part_num: r.part.part_num,
        color_id: r.color.id,
        quantity: r.quantity,
        is_spare: !!r.is_spare,
        img_url: r.part.part_img_url ?? null,
      });
    }
    url = json.next; // null cuando no hay más páginas
  }
  return parts;
}
