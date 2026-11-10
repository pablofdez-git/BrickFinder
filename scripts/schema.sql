-- BrickFinder · esquema completo. Pegar entero en Supabase > SQL Editor > Run.

create extension if not exists pg_trgm;

-- ───────────── Catálogo (se importa desde Rebrickable) ─────────────
create table colors (
  id         integer primary key,
  name       text not null,
  rgb        text not null,                 -- hex sin '#'
  is_trans   boolean not null default false,
  num_parts  integer not null default 0     -- para ordenar "más usados"
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
  img_url        text
);

create index parts_name_trgm on parts using gin (name gin_trgm_ops);
create index parts_num_trgm  on parts using gin (part_num gin_trgm_ops);
create index parts_cat_idx   on parts (part_cat_id);

-- ───────────── Datos de Pablo ─────────────
create table boxes (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table inventory (
  id          bigint generated always as identity primary key,
  box_id      bigint  not null references boxes(id) on delete cascade,
  part_num    text    not null references parts(part_num),
  color_id    integer not null references colors(id),
  quantity    integer not null check (quantity > 0),
  img_url     text,
  updated_at  timestamptz not null default now(),
  unique (box_id, part_num, color_id)
);

create index inventory_part_idx on inventory (part_num, color_id);

-- ───────────── Sumar / restar cantidades ─────────────
create or replace function add_to_inventory(
  p_box_id bigint, p_part_num text, p_color_id integer, p_qty integer, p_img_url text default null
) returns void language plpgsql as $$
begin
  if p_qty > 0 then
    insert into inventory (box_id, part_num, color_id, quantity, img_url)
    values (p_box_id, p_part_num, p_color_id, p_qty, p_img_url)
    on conflict (box_id, part_num, color_id)
    do update set quantity   = inventory.quantity + excluded.quantity,
                  img_url    = coalesce(excluded.img_url, inventory.img_url),
                  updated_at = now();

  elsif p_qty < 0 then
    -- Si la resta deja 0 o menos, se borra la fila (evita violar el check).
    delete from inventory
    where box_id = p_box_id and part_num = p_part_num and color_id = p_color_id
      and quantity + p_qty <= 0;

    -- Si sigue existiendo, queda cantidad positiva: se resta. Si no existía, no hace nada.
    update inventory
    set quantity = quantity + p_qty, updated_at = now()
    where box_id = p_box_id and part_num = p_part_num and color_id = p_color_id;
  end if;
  -- p_qty = 0: no hace nada.
end $$;

-- ───────────── Vista resumen (pantalla Inventario) ─────────────
create view inventory_summary with (security_invoker = true) as
select i.part_num, p.name as part_name, p.part_cat_id,
       i.color_id, c.name as color_name, c.rgb,
       sum(i.quantity) as total_quantity,
       max(i.img_url)  as img_url,
       json_agg(json_build_object('box_id', b.id, 'box', b.name, 'qty', i.quantity)
                order by b.name) as boxes,
       max(p.img_url)  as part_img_url,     -- foto genérica de la pieza (migration-5a)
       array_agg(distinct b.id) as box_ids  -- para filtrar por caja (migration-5b)
from inventory i
join parts  p on p.part_num = i.part_num
join colors c on c.id = i.color_id
join boxes  b on b.id = i.box_id
group by i.part_num, p.name, p.part_cat_id, i.color_id, c.name, c.rgb;

-- Totales para la cabecera de Inventario (migration-5a)
create or replace function inventory_totals()
returns table (total_pieces bigint, distinct_types bigint, boxes bigint)
language sql stable as $$
  select
    coalesce((select sum(quantity) from inventory), 0)::bigint,
    (select count(*) from (select 1 from inventory group by part_num, color_id) t)::bigint,
    (select count(*) from boxes)::bigint;
$$;
grant execute on function inventory_totals() to anon;

-- ───────────── Seguridad (RLS) ─────────────
-- Las tablas nacen con RLS activado (Automatic RLS); por si acaso:
alter table colors          enable row level security;
alter table part_categories enable row level security;
alter table parts           enable row level security;
alter table boxes           enable row level security;
alter table inventory       enable row level security;

-- Catálogo: solo lectura para anon
create policy "anon lee colors"     on colors          for select to anon using (true);
create policy "anon lee categorias" on part_categories for select to anon using (true);
create policy "anon lee parts"      on parts           for select to anon using (true);

-- parts: la app solo puede actualizar la caché de imagen (columna img_url)
revoke update on parts from anon;
grant  update (img_url) on parts to anon;
create policy "anon cachea img de parts" on parts for update to anon using (true) with check (true);

-- Datos de Pablo: lectura y escritura para anon
create policy "anon todo boxes"     on boxes     for all to anon using (true) with check (true);
create policy "anon todo inventory" on inventory for all to anon using (true) with check (true);

-- Permisos (por si "expose new tables" no los dio)
grant select on colors, part_categories, parts, inventory_summary to anon;
grant select, insert, update, delete on boxes, inventory to anon;
grant usage, select on all sequences in schema public to anon;
grant execute on function add_to_inventory(bigint, text, integer, integer, text) to anon;
