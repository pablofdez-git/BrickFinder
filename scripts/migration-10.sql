-- Fase 3 (foto) · Paso 1 · Pegar en Supabase > SQL Editor > Run (se puede ejecutar más de una vez sin problema).
-- Brickognize (el servicio que reconoce piezas por foto) usa los ids de color de BrickLink, y la app usa los de
-- Rebrickable. Esta columna guarda la equivalencia; la rellena scripts/import-bricklink-colors.js.
-- No es única: dos colores de Rebrickable comparten id de BrickLink, y al traducir se elige el más usado.

alter table colors add column if not exists bricklink_id integer;

create index if not exists colors_bricklink_idx on colors (bricklink_id);
