// Importa el catálogo de Rebrickable (CSV en scripts/data/) a Supabase.
// Se ejecuta en el ordenador:  node scripts/import-rebrickable.js
// Usa la service role key del .env. NUNCA forma parte de la app.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Faltan EXPO_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const BATCH = 1000;

function readCsv(name) {
  const file = path.join(__dirname, 'data', `${name}.csv`);
  return parse(fs.readFileSync(file, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
}

// Quita filas repetidas por clave (nos quedamos con la última).
function dedupe(rows, key) {
  return [...new Map(rows.map((r) => [r[key], r])).values()];
}

async function upsertInBatches(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) {
      console.error(`\nError en ${table} (filas ${i}-${i + chunk.length}): ${error.message}`);
      process.exit(1);
    }
    process.stdout.write(`\r${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(' ✓');
}

async function main() {
  const colors = dedupe(
    readCsv('colors').map((r) => ({
      id: Number(r.id),
      name: r.name,
      rgb: r.rgb,
      is_trans: String(r.is_trans).toLowerCase() === 'true' || r.is_trans === 't',
      num_parts: Number(r.num_parts) || 0,
    })),
    'id'
  );

  const categories = dedupe(
    readCsv('part_categories').map((r) => ({ id: Number(r.id), name: r.name })),
    'id'
  );

  const parts = dedupe(
    readCsv('parts').map((r) => ({
      part_num: r.part_num,
      name: r.name,
      part_cat_id: r.part_cat_id ? Number(r.part_cat_id) : null,
      part_material: r.part_material || null,
    })),
    'part_num'
  );

  // Orden: colors → part_categories → parts (parts depende de part_categories).
  await upsertInBatches('colors', colors, 'id');
  await upsertInBatches('part_categories', categories, 'id');
  await upsertInBatches('parts', parts, 'part_num');

  for (const t of ['colors', 'part_categories', 'parts']) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t} en la base de datos: ${error ? 'error: ' + error.message : count}`);
  }
}

main();
