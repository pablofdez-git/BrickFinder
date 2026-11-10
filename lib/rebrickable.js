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
