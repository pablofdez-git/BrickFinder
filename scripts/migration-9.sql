-- Gestores (cajas y piezas) · Pegar en Supabase > SQL Editor > Run (se puede ejecutar más de una vez sin problema).
-- Añade: boxes_summary (contenido de cada caja), move_inventory (mover piezas entre cajas)
-- y change_inventory_color (corregir el color de una pieza). Las dos funciones son atómicas:
-- si algo falla, no se pierde ni se duplica ninguna pieza.

-- ───────────── Contenido de cada caja ─────────────
-- Incluye las cajas vacías (total 0), para poder renombrarlas o borrarlas.
create or replace view boxes_summary with (security_invoker = true) as
select b.id, b.name, b.created_at,
       coalesce(sum(i.quantity), 0)::bigint as total_pieces,
       count(i.id)::bigint                  as distinct_types
from boxes b
left join inventory i on i.box_id = b.id
group by b.id, b.name, b.created_at;

grant select on boxes_summary to anon;

-- ───────────── Mover piezas entre cajas ─────────────
-- Sin p_part_num: mueve TODO el contenido de la caja de origen a la de destino.
-- Con p_part_num + p_color_id: mueve esa pieza (p_qty unidades; sin p_qty, todas).
-- Si en la caja destino ya existe la pieza + color, las cantidades se suman.
create or replace function move_inventory(
  p_from_box bigint, p_to_box bigint,
  p_part_num text default null, p_color_id integer default null, p_qty integer default null
) returns void language plpgsql as $$
declare
  v_have integer;
  v_img  text;
  v_move integer;
begin
  if p_from_box = p_to_box then
    raise exception 'La caja de origen y la de destino son la misma';
  end if;
  if not exists (select 1 from boxes where id = p_to_box) then
    raise exception 'La caja de destino no existe';
  end if;

  if p_part_num is null then
    insert into inventory (box_id, part_num, color_id, quantity, img_url)
    select p_to_box, part_num, color_id, quantity, img_url
    from inventory where box_id = p_from_box
    on conflict (box_id, part_num, color_id)
    do update set quantity   = inventory.quantity + excluded.quantity,
                  img_url    = coalesce(excluded.img_url, inventory.img_url),
                  updated_at = now();
    delete from inventory where box_id = p_from_box;
  else
    select quantity, img_url into v_have, v_img
    from inventory
    where box_id = p_from_box and part_num = p_part_num and color_id = p_color_id;

    if v_have is null then
      raise exception 'Esa pieza no está en la caja de origen';
    end if;
    v_move := coalesce(p_qty, v_have);
    if v_move < 1 or v_move > v_have then
      raise exception 'Cantidad no válida: en la caja hay %', v_have;
    end if;

    perform add_to_inventory(p_to_box,   p_part_num, p_color_id,  v_move, v_img);
    perform add_to_inventory(p_from_box, p_part_num, p_color_id, -v_move);
  end if;
end $$;

grant execute on function move_inventory(bigint, bigint, text, integer, integer) to anon;

-- ───────────── Corregir el color de una pieza ─────────────
-- Cambia el color de una pieza en una caja. Si ya había esa pieza en el color nuevo, se suman.
create or replace function change_inventory_color(
  p_box_id bigint, p_part_num text, p_old_color integer, p_new_color integer
) returns void language plpgsql as $$
declare
  v_qty integer;
begin
  if p_old_color = p_new_color then
    return;
  end if;
  if not exists (select 1 from colors where id = p_new_color) then
    raise exception 'Ese color no existe';
  end if;

  select quantity into v_qty
  from inventory
  where box_id = p_box_id and part_num = p_part_num and color_id = p_old_color;

  if v_qty is null then
    raise exception 'Esa pieza no está en la caja';
  end if;

  -- La foto de la fila vieja era del color antiguo, así que no se copia (se pedirá de nuevo).
  perform add_to_inventory(p_box_id, p_part_num, p_new_color, v_qty, null);
  delete from inventory
  where box_id = p_box_id and part_num = p_part_num and color_id = p_old_color;
end $$;

grant execute on function change_inventory_color(bigint, text, integer, integer) to anon;
