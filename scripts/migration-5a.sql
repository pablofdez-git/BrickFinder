-- Paso 5a · Pegar en Supabase > SQL Editor > Run (se puede ejecutar más de una vez sin problema).

-- 1) Totales para la cabecera de Inventario (se calculan en el servidor).
create or replace function inventory_totals()
returns table (total_pieces bigint, distinct_types bigint, boxes bigint)
language sql stable as $$
  select
    coalesce((select sum(quantity) from inventory), 0)::bigint,
    (select count(*) from (select 1 from inventory group by part_num, color_id) t)::bigint,
    (select count(*) from boxes)::bigint;
$$;

grant execute on function inventory_totals() to anon;

-- 2) La vista gana una columna al final con la foto genérica de la pieza.
create or replace view inventory_summary with (security_invoker = true) as
select i.part_num, p.name as part_name, p.part_cat_id,
       i.color_id, c.name as color_name, c.rgb,
       sum(i.quantity) as total_quantity,
       max(i.img_url)  as img_url,
       json_agg(json_build_object('box_id', b.id, 'box', b.name, 'qty', i.quantity)
                order by b.name) as boxes,
       max(p.img_url)  as part_img_url
from inventory i
join parts  p on p.part_num = i.part_num
join colors c on c.id = i.color_id
join boxes  b on b.id = i.box_id
group by i.part_num, p.name, p.part_cat_id, i.color_id, c.name, c.rgb;

grant select on inventory_summary to anon;
