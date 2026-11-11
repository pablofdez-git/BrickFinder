import { useCallback, useState } from 'react';
import { deleteBox, fetchBoxesSummary, moveBoxContents, renameBox } from '../lib/inventoryApi';

// Cajas con su contenido y las acciones del gestor (renombrar, mover todo, borrar).
// Las acciones lanzan el error al llamador y, si van bien, recargan la lista y avisan con `onChanged`
// (para que las pantallas que muestran cajas se actualicen).
export default function useBoxManager(onChanged) {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setBoxes(await fetchBoxesSummary());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const run = async (action) => {
    await action();
    await reload();
    onChanged?.();
  };

  return {
    boxes,
    loading,
    error,
    reload,
    rename: (id, name) => run(() => renameBox(id, name)),
    remove: (id) => run(() => deleteBox(id)),
    move: (fromId, toId) => run(() => moveBoxContents(fromId, toId)),
  };
}
