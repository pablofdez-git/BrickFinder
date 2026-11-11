import { useCallback, useEffect, useState } from 'react';
import { fetchSetCheck } from '../lib/setsApi';

// Piezas de un set con lo que tienes y lo que falta (para la pantalla de detalle).
export default function useSetCheck(setNum) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!setNum) return;
    try {
      setRows(await fetchSetCheck(setNum));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setNum]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { rows, loading, error, reload };
}
