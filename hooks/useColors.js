import { useEffect, useState } from 'react';
import { fetchColors } from '../lib/inventoryApi';

// El catálogo de colores no cambia: se descarga una vez y se reutiliza mientras la app esté abierta.
let cache = null;

export default function useColors() {
  const [colors, setColors] = useState(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetchColors()
      .then((list) => {
        cache = list;
        if (!cancelled) setColors(list);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { colors, loading, error };
}
