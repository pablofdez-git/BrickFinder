-- Paso 5b · Pegar en Supabase > SQL Editor > Run (se puede ejecutar más de una vez sin problema).
-- Añade a la vista una columna al final con los ids de las cajas donde está cada pieza + color,
-- para poder filtrar el inventario por caja.

create or replace view inventory_summary with (security_invoker = true) as
select i.part_num, p.name as part_name, p.part_cat_id,
       i.color_id, c.name as color_name, c.rgb,
       sum(i.quantity) as total_quantity,
       max(i.img_url)  as img_url,
       json_agg(json_build_object('box_id', b.id, 'box', b.name, 'qty', i.quantity)
                order by b.name) as boxes,
       max(p.img_url)  as part_img_url,
       array_agg(distinct b.id) as box_ids
from inventory i
join parts  p on p.part_num = i.part_num
join colors c on c.id = i.color_id
join boxes  b on b.id = i.box_id
group by i.part_num, p.name, p.part_cat_id, i.color_id, c.name, c.rgb;

grant select on inventory_summary to anon;
