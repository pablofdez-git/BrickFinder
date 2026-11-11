import { fetchSet, fetchSetParts, normalizeSetNum } from './rebrickable';
import { supabase } from './supabase';

const INSERT_CHUNK = 500; // filas por insert (un set grande tiene cientos de piezas distintas)

// Lista de sets con su progreso: needed (piezas necesarias) y have (las que ya tienes disponibles).
export async function fetchSetsSummary() {
  const { data, error } = await supabase
    .from('sets_summary')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((s) => ({ ...s, needed: Number(s.needed), have: Number(s.have) }));
}

// Comprobación de un set: una fila por pieza + color con necesaria / disponible / faltante / cajas.
// (Un set tiene como mucho unos cientos de piezas distintas: cabe en el límite de 1000 filas de Supabase.)
export async function fetchSetCheck(setNum) {
  const { data, error } = await supabase.rpc('set_check', { p_set_num: setNum });
  if (error) throw error;
  return data.map((r) => ({ ...r, available: Number(r.available), missing: Number(r.missing) }));
}

// Añade un set: lo baja de Rebrickable y guarda cabecera + piezas.
// Primero se pide TODO a la API; solo si va bien se escribe en la BD (así un fallo de red no deja nada a medias).
export async function addSet(input) {
  const setNum = normalizeSetNum(input);
  if (setNum === '-1') throw new Error('Escribe el número del set (ej. 75192)');

  const existing = await supabase.from('sets').select('set_num').eq('set_num', setNum).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) throw new Error(`El set ${setNum} ya está añadido`);

  const [set, parts] = await Promise.all([fetchSet(setNum), fetchSetParts(setNum)]);
  if (parts.length === 0) throw new Error('Ese set no tiene piezas en Rebrickable');

  // Por si la API repite pieza + color + repuesto: se suman (la clave única de set_parts no admite duplicados).
  const merged = new Map();
  for (const p of parts) {
    const key = `${p.part_num}|${p.color_id}|${p.is_spare}`;
    const prev = merged.get(key);
    if (prev) prev.quantity += p.quantity;
    else merged.set(key, { ...p, set_num: set.set_num });
  }
  const rows = [...merged.values()];

  const { error: setError } = await supabase.from('sets').insert(set);
  if (setError) throw setError;

  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const { error } = await supabase.from('set_parts').insert(rows.slice(i, i + INSERT_CHUNK));
    if (error) {
      // Deshacer: borrar el set borra también sus piezas (on delete cascade).
      await supabase.from('sets').delete().eq('set_num', set.set_num);
      throw error;
    }
  }
  return set;
}

// 'pendiente' | 'montado'. No toca inventory: la disponibilidad se calcula en la BD.
export async function setSetStatus(setNum, status) {
  const { error } = await supabase.from('sets').update({ status }).eq('set_num', setNum);
  if (error) throw error;
}

export async function deleteSet(setNum) {
  const { error } = await supabase.from('sets').delete().eq('set_num', setNum);
  if (error) throw error;
}
