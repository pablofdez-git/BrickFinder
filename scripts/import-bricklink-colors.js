// Rellena colors.bricklink_id con la equivalencia de colores BrickLink <-> Rebrickable.
// Antes hay que ejecutar scripts/migration-10.sql en Supabase. Se ejecuta en el ordenador:
//   node scripts/import-bricklink-colors.js
// Lee los colores de la API de Rebrickable y usa la service role key del .env. NUNCA forma parte de la app.
// Se puede repetir sin problema: solo actualiza esa columna.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rebrickableKey = process.env.EXPO_PUBLIC_REBRICKABLE_KEY;
if (!url || !serviceKey || !rebrickableKey) {
  console.error('Faltan EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o EXPO_PUBLIC_REBRICKABLE_KEY en el .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const PARALLEL = 20; // actualizaciones a la vez

async function fetchRebrickableColors() {
  const res = await fetch('https://rebrickable.com/api/v3/lego/colors/?page_size=1000', {
    headers: { Authorization: `key ${rebrickableKey}` },
  });
  if (!res.ok) {
    console.error(`Rebrickable respondió ${res.status}`);
    process.exit(1);
  }
  const json = await res.json();
  if (json.next) console.warn('Aviso: hay más de una página de colores y solo se procesa la primera.');
  return json.results;
}

async function main() {
  const all = await fetchRebrickableColors();
  // Cada color tiene como mucho un id de BrickLink; los que no tienen ninguno se saltan.
  const rows = all
    .map((c) => ({ id: c.id, bricklink_id: c.external_ids?.BrickLink?.ext_ids?.[0] }))
    .filter((r) => Number.isInteger(r.bricklink_id));
  console.log(`Colores en Rebrickable: ${all.length} · con id de BrickLink: ${rows.length}`);

  let done = 0;
  for (let i = 0; i < rows.length; i += PARALLEL) {
    const chunk = rows.slice(i, i + PARALLEL);
    const results = await Promise.all(
      chunk.map((r) => supabase.from('colors').update({ bricklink_id: r.bricklink_id }).eq('id', r.id))
    );
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error(`\nError: ${failed.error.message}`);
      console.error('¿Has ejecutado antes scripts/migration-10.sql en Supabase?');
      process.exit(1);
    }
    done += chunk.length;
    process.stdout.write(`\rActualizados: ${done}/${rows.length}`);
  }
  console.log(' ✓');

  const { count, error } = await supabase
    .from('colors')
    .select('*', { count: 'exact', head: true })
    .not('bricklink_id', 'is', null);
  console.log(`Colores con bricklink_id en la base de datos: ${error ? 'error: ' + error.message : count}`);
}

main();
