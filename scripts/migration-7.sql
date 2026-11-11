-- Fase 2 · Corrección · Pegar en Supabase > SQL Editor > Run (se puede ejecutar más de una vez sin problema).
-- Un set en estado 'montado' está completo por definición: todas sus piezas cuentan como que las tienes,
-- aunque no estén inventariadas en cajas. Los sets pendientes siguen comparándose con el inventario
-- menos las piezas de los sets montados.

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
    select (case when s.status = 'montado' then sp.quantity::bigint
                 else greatest(coalesce(a.available, 0), 0) end) as v
  ) av
  where sp.set_num = p_set_num
  order by (sp.quantity - av.v) desc, sp.part_num;
$$;

create or replace view sets_summary with (security_invoker = true) as
select s.set_num, s.name, s.year, s.num_parts, s.img_url, s.status, s.created_at,
       coalesce(t.needed, 0)::bigint as needed,
       coalesce(case when s.status = 'montado' then t.needed else t.have end, 0)::bigint as have
from sets s
left join lateral (
  select sum(sp.quantity) as needed,
         sum(least(sp.quantity, greatest(coalesce(a.available, 0), 0))) as have
  from set_parts sp
  left join available_inventory a on a.part_num = sp.part_num and a.color_id = sp.color_id
  where sp.set_num = s.set_num and not sp.is_spare
) t on true;

grant select on sets_summary to anon;
grant execute on function set_check(text) to anon;
