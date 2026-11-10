import { useCallback, useState } from 'react';
import { fetchBoxes } from '../lib/inventoryApi';

// Lista de cajas (para los filtros). `reload` se llama al volver a la pestaña por si se crearon cajas nuevas.
export default function useBoxes() {
  const [boxes, setBoxes] = useState([]);
  const reload = useCallback(async () => {
    try {
      setBoxes(await fetchBoxes());
    } catch {
      // si falla, se queda la lista anterior: los filtros siguen funcionando
    }
  }, []);
  return { boxes, reload };
}
