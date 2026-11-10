import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBox, fetchBoxes } from '../lib/inventoryApi';

const STORAGE_KEY = 'activeBoxId';

// Lista de cajas + caja activa (recordada aunque cierres la app).
export default function useActiveBox() {
  const [boxes, setBoxes] = useState([]);
  const [activeBoxId, setActiveBoxId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, storedId] = await Promise.all([fetchBoxes(), AsyncStorage.getItem(STORAGE_KEY)]);
        if (cancelled) return;
        setBoxes(list);
        const stored = storedId ? Number(storedId) : null;
        // Solo restauramos la caja si sigue existiendo.
        if (stored && list.some((b) => b.id === stored)) setActiveBoxId(stored);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectBox = useCallback((id) => {
    setActiveBoxId(id);
    AsyncStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  // Crea la caja y la deja seleccionada. Lanza error si falla (lo muestra el componente).
  const addBox = useCallback(
    async (name) => {
      const box = await createBox(name);
      setBoxes((prev) => [...prev, box].sort((a, b) => a.name.localeCompare(b.name)));
      selectBox(box.id);
      return box;
    },
    [selectBox]
  );

  const activeBox = boxes.find((b) => b.id === activeBoxId) ?? null;

  return { boxes, activeBox, selectBox, addBox, loading, error };
}
