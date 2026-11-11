-- Fase 2 · Piezas usadas en sets montados · Pegar en Supabase > SQL Editor > Run
-- (se puede ejecutar más de una vez sin problema).
-- Añade dos columnas al final de inventory_summary:
--   used_quantity : unidades de esa pieza + color usadas en sets MONTADOS (sin contar repuestos).
--   used_in       : esos sets, como [{ set_num, name, qty }, ...].
-- Las piezas de un set montado siguen contando en el inventario (están registradas en las cajas);
-- esto solo permite verlas marcadas. Las columnas existentes no cambian.

create or replace view inventory_summary with (security_invoker = true) as
select i.part_num, p.name as part_name, p.part_cat_id,
       i.color_id, c.name as color_name, c.rgb,
       sum(i.quantity) as total_quantity,
       max(i.img_url)  as img_url,
       json_agg(json_build_object('box_id', b.id, 'box', b.name, 'qty', i.quantity)
                order by b.name) as boxes,
       max(p.img_url)  as part_img_url,
       array_agg(distinct b.id) as box_ids,
       (select coalesce(sum(sp.quantity), 0)
          from set_parts sp
          join sets s on s.set_num = sp.set_num
         where s.status = 'montado' and not sp.is_spare
           and sp.part_num = i.part_num and sp.color_id = i.color_id)::bigint as used_quantity,
       (select coalesce(json_agg(json_build_object('set_num', s.set_num, 'name', s.name, 'qty', sp.quantity)
                                 order by s.name), '[]'::json)
          from set_parts sp
          join sets s on s.set_num = sp.set_num
         where s.status = 'montado' and not sp.is_spare
           and sp.part_num = i.part_num and sp.color_id = i.color_id) as used_in
from inventory i
join parts  p on p.part_num = i.part_num
join colors c on c.id = i.color_id
join boxes  b on b.id = i.box_id
group by i.part_num, p.name, p.part_cat_id, i.color_id, c.name, c.rgb;

grant select on inventory_summary to anon;
