import { fetchColorsByBricklinkIds, fetchPartsByNums } from './inventoryApi';
import { fetchPartNumByBricklinkId } from './rebrickable';

// Reconocimiento de piezas por foto con Brickognize (servicio gratuito de terceros, sin clave).
// OJO: la foto sale del móvil hacia ese servicio. Brickognize usa ids de BrickLink (piezas y colores);
// aquí se traducen a los de nuestro catálogo (Rebrickable).

const ENDPOINT = 'https://api.brickognize.com/predict/parts/?predict_color=true&top_k_items=6&top_k_colors=4';
const TIMEOUT_MS = 30000;
const MAX_FALLBACK = 3; // ids de pieza que se intentan traducir con la API de Rebrickable cuando no coinciden

// Manda la foto y devuelve lo que ve:
//   { candidates: [{ part, thumb, score }], colors: [{ color, score }] }
// `part` es una fila de nuestra tabla parts (se puede guardar en el inventario); `thumb` es la miniatura que
// devuelve Brickognize (solo para mostrar). Piezas o colores sin equivalente en el catálogo se descartan.
export async function identifyPart(photoUri) {
  const form = new FormData();
  // En React Native un fichero se adjunta con { uri, name, type }; fetch pone solo la cabecera multipart.
  form.append('query_image', { uri: photoUri, name: 'pieza.jpg', type: 'image/jpeg' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', body: form, signal: controller.signal });
  } catch (e) {
    throw new Error(
      e.name === 'AbortError' ? 'El servicio de fotos tardó demasiado: prueba otra vez' : 'Sin conexión con el servicio de fotos'
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) throw new Error('Demasiadas fotos seguidas: espera unos segundos');
  if (!res.ok) throw new Error(`El servicio de fotos respondió con un error (${res.status})`);
  return mapPrediction(await res.json());
}

// Traduce la respuesta de Brickognize a piezas y colores de nuestro catálogo.
export async function mapPrediction(json) {
  const items = json.items ?? [];

  // 1) Lo normal: el id de BrickLink coincide con el part_num de Rebrickable (ej. 3001).
  const ids = [...new Set(items.map((i) => String(i.id)))];
  const byNum = new Map((await fetchPartsByNums(ids)).map((p) => [p.part_num, p]));

  // 2) Plan B para los que no coinciden: preguntar a Rebrickable (pocos, para no gastar peticiones).
  const byBricklink = new Map();
  for (const id of ids.filter((id) => !byNum.has(id)).slice(0, MAX_FALLBACK)) {
    try {
      const num = await fetchPartNumByBricklinkId(id);
      if (num) byBricklink.set(id, num);
    } catch {
      // sin equivalencia o sin red: esa pieza se descarta y el resto sigue funcionando
    }
  }
  if (byBricklink.size > 0) {
    const extra = await fetchPartsByNums([...byBricklink.values()]);
    for (const p of extra) byNum.set(p.part_num, p);
  }

  const seen = new Set();
  const candidates = [];
  for (const item of items) {
    const id = String(item.id);
    const part = byNum.get(id) ?? byNum.get(byBricklink.get(id));
    if (!part || seen.has(part.part_num)) continue;
    seen.add(part.part_num);
    candidates.push({ part, thumb: item.img_url ?? null, score: item.score ?? 0 });
  }

  // Colores: id de BrickLink -> nuestro color. fetchColorsByBricklinkIds viene ordenado por más usado.
  const blIds = (json.colors ?? []).map((c) => Number(c.id)).filter(Number.isInteger);
  const colorRows = await fetchColorsByBricklinkIds(blIds);
  const byBl = new Map();
  for (const c of colorRows) if (!byBl.has(c.bricklink_id)) byBl.set(c.bricklink_id, c);

  const colors = [];
  for (const c of json.colors ?? []) {
    const row = byBl.get(Number(c.id));
    if (row) colors.push({ color: { id: row.id, name: row.name, rgb: row.rgb, is_trans: row.is_trans }, score: c.score ?? 0 });
  }

  return { candidates, colors };
}
