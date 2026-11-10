import { useCallback, useRef, useState } from 'react';
import { hapticError, hapticTap } from '../lib/haptics';
import { addToInventory } from '../lib/inventoryApi';

// Piezas añadidas desde que se abrió la app (no se guardan al cerrarla) y la opción de deshacer cada una.
export default function useSession() {
  const [entries, setEntries] = useState([]);
  const [undoingId, setUndoingId] = useState(null);
  const [error, setError] = useState(null);
  const nextId = useRef(1);

  // entry: { boxId, boxName, partNum, partName, colorId, colorName, rgb, qty }
  const addEntry = useCallback((entry) => {
    setEntries((prev) => [{ ...entry, id: nextId.current++ }, ...prev]);
  }, []);

  // Deshacer = sumar la misma cantidad en negativo en la misma caja.
  const undo = useCallback(
    async (entry) => {
      if (undoingId !== null) return;
      setUndoingId(entry.id);
      setError(null);
      try {
        await addToInventory({
          boxId: entry.boxId,
          partNum: entry.partNum,
          colorId: entry.colorId,
          qty: -entry.qty,
        });
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
        hapticTap();
      } catch (e) {
        hapticError();
        setError(`No se pudo deshacer: ${e.message}`);
      } finally {
        setUndoingId(null);
      }
    },
    [undoingId]
  );

  return { entries, addEntry, undo, undoingId, error };
}
