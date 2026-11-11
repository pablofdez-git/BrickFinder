import { translateTerms } from './searchTerms';
import { supabase } from './supabase';

// ───────────── Búsqueda de piezas ─────────────

const PART_COLS = 'part_num, name, part_cat_id, img_url';

// Separa la búsqueda en términos. "2x4" → "2 x 4", que es como se llama en el catálogo.
// Las palabras en español se traducen al inglés ("ladrillo" → "brick"), que es el idioma del catálogo.
function tokenize(query) {
  const safe = query.replace(/[,()%*\\_"]/g, ' '); // caracteres que romperían el filtro
  const tokens = safe.match(/\d+\s*x\s*\d+(?:\s*x\s*\d+)?|\S+/gi) ?? [];
  const normalized = tokens.map((t) => (/\d\s*x\s*\d/i.test(t) ? t.replace(/\s*x\s*/gi, ' x ') : t));
  return tokens.length === 0 ? [] : translateTerms(normalized);
}

function baseQuery(catIds) {
  let q = supabase.from('parts').select(PART_COLS);
  if (catIds?.length) q = q.in('part_cat_id', catIds);
  return q;
}

async function run(q) {
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// Busca por número o nombre (máx. `limit` resultados), opcionalmente dentro de unas categorías.
export async function searchParts({ query = '', catIds = [], limit = 30 }) {
  const tokens = tokenize(query);

  // Sin texto: solo se explora la categoría elegida.
  if (tokens.length === 0) {
    if (!catIds.length) return [];
    return run(baseQuery(catIds).order('part_num').limit(limit));
  }

  // Varias palabras: primero los nombres que EMPIEZAN así ("Brick 2 x 4..."), luego los que
  // contienen todas las palabras en cualquier orden.
  if (tokens.length > 1) {
    const starts = await run(
      baseQuery(catIds).ilike('name', `${tokens.join(' ')}%`).order('name').limit(limit)
    );
    if (starts.length >= limit) return starts;

    let q = baseQuery(catIds);
    for (const t of tokens) q = q.ilike('name', `%${t}%`);
    const rest = await run(q.order('name').limit(limit));
    const seen = new Set(starts.map((p) => p.part_num));
    return [...starts, ...rest.filter((p) => !seen.has(p.part_num))].slice(0, limit);
  }

  // Un solo término, por relevancia: 1º números que EMPIEZAN así, 2º nombres que EMPIEZAN así
  // ("Wheel ..."), 3º el resto (número o nombre que lo contenga).
  const t = tokens[0];
  let found = await run(baseQuery(catIds).ilike('part_num', `${t}%`).order('part_num').limit(limit));
  if (found.length >= limit) return found;

  const startsWithName = await run(baseQuery(catIds).ilike('name', `${t}%`).order('name').limit(limit));
  found = mergeUnique(found, startsWithName);
  if (found.length >= limit) return found.slice(0, limit);

  const contains = await run(
    baseQuery(catIds).or(`part_num.ilike.%${t}%,name.ilike.%${t}%`).order('name').limit(limit)
  );
  return mergeUnique(found, contains).slice(0, limit);
}

// Une dos listas de piezas sin repetir ninguna (por part_num), manteniendo el orden.
function mergeUnique(first, second) {
  const seen = new Set(first.map((p) => p.part_num));
  return [...first, ...second.filter((p) => !seen.has(p.part_num))];
}

// Guarda en parts.img_url las imágenes obtenidas de Rebrickable (caché).
export async function cachePartImages(imagesByPartNum) {
  await Promise.all(
    Object.entries(imagesByPartNum).map(([partNum, img_url]) =>
      supabase.from('parts').update({ img_url }).eq('part_num', partNum)
    )
  );
}

// ───────────── Inventario ─────────────

// Suma (qty > 0) o resta (qty < 0) piezas en una caja. Si ya existe caja + pieza + color, la cantidad se
// suma; nunca se duplican filas. La lógica vive en la función SQL `add_to_inventory`.
export async function addToInventory({ boxId, partNum, colorId, qty, imgUrl = null }) {
  const { error } = await supabase.rpc('add_to_inventory', {
    p_box_id: boxId,
    p_part_num: partNum,
    p_color_id: colorId,
    p_qty: qty,
    p_img_url: imgUrl,
  });
  if (error) throw error;
}

// Fija la cantidad (qty >= 1) de una pieza + color en una caja concreta.
export async function setInventoryQuantity({ boxId, partNum, colorId, qty }) {
  const { error } = await supabase
    .from('inventory')
    .update({ quantity: qty, updated_at: new Date().toISOString() })
    .eq('box_id', boxId)
    .eq('part_num', partNum)
    .eq('color_id', colorId);
  if (error) throw error;
}

// Quita por completo una pieza + color de una caja.
export async function deleteInventoryRow({ boxId, partNum, colorId }) {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('box_id', boxId)
    .eq('part_num', partNum)
    .eq('color_id', colorId);
  if (error) throw error;
}

export const INVENTORY_PAGE_SIZE = 30;

// Aplica los filtros de la pantalla Inventario: texto (número o nombre), caja, color y categorías.
function applyInventoryFilters(q, { query = '', boxId = null, colorId = null, catIds = [], onlyUsed = false }) {
  if (onlyUsed) q = q.gt('used_quantity', 0); // solo piezas usadas en algún set montado
  if (boxId != null) q = q.contains('box_ids', [boxId]);
  if (colorId != null) q = q.eq('color_id', colorId);
  if (catIds?.length) q = q.in('part_cat_id', catIds);

  const tokens = tokenize(query);
  if (tokens.length === 1) {
    q = q.or(`part_num.ilike.%${tokens[0]}%,part_name.ilike.%${tokens[0]}%`);
  } else {
    for (const t of tokens) q = q.ilike('part_name', `%${t}%`);
  }
  return q;
}

// Una página del resumen agrupado por pieza + color. `boxes` = [{ box_id, box, qty }, ...].
// Devuelve { rows, count }: `count` (total con esos filtros) solo viene en la primera página.
export async function fetchInventoryPage(offset = 0, filters = {}, limit = INVENTORY_PAGE_SIZE) {
  let q = supabase
    .from('inventory_summary')
    .select('*', offset === 0 ? { count: 'exact' } : undefined);
  q = applyInventoryFilters(q, filters)
    .order('part_name')
    .order('part_num') // desempates estables para que la paginación no repita ni se salte filas
    .order('color_id')
    .range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: data, count };
}

// Totales de la cabecera: piezas, tipos distintos (pieza + color) y cajas.
export async function fetchInventoryTotals() {
  const { data, error } = await supabase.rpc('inventory_totals').single();
  if (error) throw error;
  return {
    totalPieces: Number(data.total_pieces),
    distinctTypes: Number(data.distinct_types),
    boxes: Number(data.boxes),
  };
}

// ───────────── Colores ─────────────

// Todos los colores, los más usados en LEGO primero. Se ocultan los ids negativos ([Unknown]).
export async function fetchColors() {
  const { data, error } = await supabase
    .from('colors')
    .select('id, name, rgb, is_trans, num_parts')
    .gte('id', 0)
    .order('num_parts', { ascending: false });
  if (error) throw error;
  return data;
}

// ───────────── Cajas ─────────────

export async function fetchBoxes() {
  const { data, error } = await supabase.from('boxes').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export async function createBox(name) {
  const clean = name.trim();
  if (!clean) throw new Error('Escribe un nombre para la caja');

  const { data, error } = await supabase.from('boxes').insert({ name: clean }).select('id, name').single();
  if (error) {
    // 23505 = violación de unique (ya existe una caja con ese nombre)
    if (error.code === '23505') throw new Error(`Ya existe una caja llamada "${clean}"`);
    throw error;
  }
  return data;
}
