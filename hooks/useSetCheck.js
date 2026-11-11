import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSetCheck } from '../lib/setsApi';

// Piezas de un set con lo que tienes y lo que falta (para la pantalla de detalle).
export default function useSetCheck(setNum) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!!setNum);
  const [error, setError] = useState(null);
  const requestId = useRef(0); // descarta respuestas de peticiones antiguas (otro set, o una recarga posterior)

  const reload = useCallback(async () => {
    if (!setNum) return;
    const id = ++requestId.current;
    try {
      const data = await fetchSetCheck(setNum);
      if (id !== requestId.current) return;
      setRows(data);
      setError(null);
    } catch (e) {
      if (id === requestId.current) setError(e.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [setNum]);

  // Al cambiar de set se vacía lo del anterior para no mostrar sus piezas mientras carga.
  useEffect(() => {
    setRows([]);
    setError(null);
    setLoading(!!setNum);
    reload();
  }, [reload, setNum]);

  return { rows, loading, error, reload };
}
