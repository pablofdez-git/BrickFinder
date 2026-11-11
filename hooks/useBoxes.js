import { useCallback, useState } from 'react';
import { fetchBoxes } from '../lib/inventoryApi';

// Lista de cajas (para los filtros). `reload` se llama al volver a la pestaña por si se crearon cajas nuevas.
export default function useBoxes() {
  const [boxes, setBoxes] = useState([]);
  // Devuelve la lista nueva (o null si falla) por si quien llama necesita comprobar algo con ella.
  const reload = useCallback(async () => {
    try {
      const list = await fetchBoxes();
      setBoxes(list);
      return list;
    } catch {
      // si falla, se queda la lista anterior: los filtros siguen funcionando
      return null;
    }
  }, []);
  return { boxes, reload };
}
