-- Fase 2 · Paso 1 · Pegar en Supabase > SQL Editor > Run (se puede ejecutar más de una vez sin problema).
-- Sets, sus piezas, disponibilidad (inventario menos sets montados) y comprobación de piezas que faltan.
-- No toca la tabla inventory: "montado" solo cambia el estado del set.

-- ───────────── Tablas ─────────────
create table if not exists sets (
  set_num     text primary key,                 -- id de Rebrickable, ej. '75192-1'
  name        text not null,
  year        integer,
  num_parts   integer,
  img_url     text,
  status      text not null default 'pendiente' check (status in ('pendiente', 'montado')),
  created_at  timestamptz not null default now()
);

create table if not exists set_parts (
  id        bigint generated always as identity primary key,
  set_num   text    not null references sets(set_num) on delete cascade,
  part_num  text    not null,                   -- sin FK a parts: la API puede ir por delante del CSV
  color_id  integer not null references colors(id),
  quantity  integer not null check (quantity > 0),
  is_spare  boolean not null default false,
  img_url   text,
  unique (set_num, part_num, color_id, is_spare)
);

create index if not exists set_parts_set_idx  on set_parts (set_num);
create index if not exists set_parts_part_idx on set_parts (part_num, color_id);

-- ───────────── Disponibilidad ─────────────
-- disponible = total en inventory - piezas (no repuesto) de los sets en estado 'montado'.
-- Puede salir negativo si un set montado usa piezas que no están inventariadas.
create or replace view available_inventory with (security_invoker = true) as
with inv as (
  select part_num, color_id, sum(quantity) as q
  from inventory group by part_num, color_id
), used as (
  select sp.part_num, sp.color_id, sum(sp.quantity) as q
  from set_parts sp
  join sets s on s.set_num = sp.set_num
  where s.status = 'montado' and not sp.is_spare
  group by sp.part_num, sp.color_id
)
select coalesce(i.part_num, u.part_num) as part_num,
       coalesce(i.color_id, u.color_id) as color_id,
       (coalesce(i.q, 0) - coalesce(u.q, 0))::bigint as available
from inv i
full join used u on u.part_num = i.part_num and u.color_id = i.color_id;

-- ───────────── Comprobación de un set ─────────────
-- Una fila por pieza + color del set: necesaria, disponible, faltante y cajas donde está.
-- Si el propio set está montado, sus piezas se le devuelven (se ve completo, no "faltan todas").
create or replace function set_check(p_set_num text)
returns table (
  part_num text, part_name text, color_id integer, color_name text, rgb text,
  is_spare boolean, needed integer, available bigint, missing bigint,
  boxes json, img_url text
)
language sql stable as $$
  select sp.part_num,
         p.name,
         sp.color_id,
         c.name,
         c.rgb,
         sp.is_spare,
         sp.quantity,
         av.v,
         greatest(sp.quantity - av.v, 0)::bigint,
         (select json_agg(json_build_object('box_id', b.id, 'box', b.name, 'qty', i.quantity) order by b.name)
            from inventory i join boxes b on b.id = i.box_id
           where i.part_num = sp.part_num and i.color_id = sp.color_id),
         coalesce(sp.img_url, p.img_url)
  from set_parts sp
  join sets s on s.set_num = sp.set_num
  join colors c on c.id = sp.color_id
  left join parts p on p.part_num = sp.part_num
  left join available_inventory a on a.part_num = sp.part_num and a.color_id = sp.color_id
  cross join lateral (
    select greatest(
      coalesce(a.available, 0) + case when s.status = 'montado' and not sp.is_spare then sp.quantity else 0 end,
      0
    ) as v
  ) av
  where sp.set_num = p_set_num
  order by (sp.quantity - av.v) desc, sp.part_num;
$$;

-- ───────────── Resumen para la lista de sets ─────────────
-- needed = piezas necesarias (sin repuestos); have = las que ya tienes disponibles.
create or replace view sets_summary with (security_invoker = true) as
select s.set_num, s.name, s.year, s.num_parts, s.img_url, s.status, s.created_at,
       coalesce(t.needed, 0)::bigint as needed,
       coalesce(t.have, 0)::bigint   as have
from sets s
left join lateral (
  select sum(sp.quantity) as needed,
         sum(least(sp.quantity, greatest(
               coalesce(a.available, 0) + case when s.status = 'montado' then sp.quantity else 0 end, 0))) as have
  from set_parts sp
  left join available_inventory a on a.part_num = sp.part_num and a.color_id = sp.color_id
  where sp.set_num = s.set_num and not sp.is_spare
) t on true;

-- ───────────── Seguridad (RLS) ─────────────
alter table sets      enable row level security;
alter table set_parts enable row level security;

drop policy if exists "anon todo sets"      on sets;
drop policy if exists "anon todo set_parts" on set_parts;
create policy "anon todo sets"      on sets      for all to anon using (true) with check (true);
create policy "anon todo set_parts" on set_parts for all to anon using (true) with check (true);

grant select, insert, update, delete on sets, set_parts to anon;
grant select on available_inventory, sets_summary to anon;
grant usage, select on all sequences in schema public to anon;
grant execute on function set_check(text) to anon;
