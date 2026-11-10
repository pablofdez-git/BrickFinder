import { useEffect, useState } from 'react';
import { searchParts } from '../lib/inventoryApi';
import { loadMissingImages } from '../lib/partImages';

const DEBOUNCE_MS = 300;

// Búsqueda con debounce. `group` es un grupo de CATEGORY_GROUPS o null.
export default function usePartSearch(query, group) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const active = query.trim().length > 0 || !!group;
  const groupKey = group?.key ?? null;

  useEffect(() => {
    if (!active) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const found = await searchParts({ query, catIds: group?.ids ?? [] });
        if (cancelled) return;
        setResults(found);
        setError(null);
        setLoading(false);

        // Fotos bajo demanda: una sola petición para las piezas que aún no tienen.
        const images = await loadMissingImages(found.filter((p) => !p.img_url).map((p) => p.part_num));
        if (cancelled || Object.keys(images).length === 0) return;
        setResults((prev) => prev.map((p) => (images[p.part_num] ? { ...p, img_url: images[p.part_num] } : p)));
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, groupKey, active]);

  return { results, loading, error, active };
}
