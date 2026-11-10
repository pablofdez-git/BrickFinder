import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchInventoryPage, fetchInventoryTotals, INVENTORY_PAGE_SIZE } from '../lib/inventoryApi';
import { loadMissingImages } from '../lib/partImages';

const keyOf = (it) => `${it.part_num}-${it.color_id}`;

// Lista del inventario con filtros, paginación (scroll infinito), totales y pull-to-refresh.
// `filters`: { query, boxId, colorId, catIds }. Debe ser un objeto estable (useMemo).
export default function useInventory(filters) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null); // resultados con los filtros actuales
  const [totals, setTotals] = useState(null); // totales globales de la cabecera
  const [loading, setLoading] = useState(true); // primera carga o cambio de filtros
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0); // descarta respuestas de peticiones antiguas

  // Al cambiar los filtros, la lista anterior ya no vale: se vacía y se muestra la carga.
  const filtersKey = JSON.stringify(filters);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setItems([]);
    setCount(null);
    setHasMore(true);
    setLoading(true);
  }, [filtersKey]);

  // Carga la primera página y los totales. Al volver a la pestaña no vacía la lista, para que no parpadee.
  const reload = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const [page, tot] = await Promise.all([fetchInventoryPage(0, filters), fetchInventoryTotals()]);
      if (id !== requestId.current) return;
      setItems(page.rows);
      setCount(page.count);
      setTotals(tot);
      setHasMore(page.rows.length === INVENTORY_PAGE_SIZE);
      setError(null);
    } catch (e) {
      if (id === requestId.current) setError(e.message);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchInventoryPage(items.length, filters);
      if (id !== requestId.current) return; // mientras tanto se recargó la lista
      setItems((prev) => {
        const seen = new Set(prev.map(keyOf));
        return [...prev, ...page.rows.filter((p) => !seen.has(keyOf(p)))];
      });
      setHasMore(page.rows.length === INVENTORY_PAGE_SIZE);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, refreshing, loadingMore, hasMore, items.length, filtersKey]);

  // Fotos bajo demanda: solo para las filas que no tienen ninguna.
  useEffect(() => {
    const missing = items.filter((it) => !it.img_url && !it.part_img_url).map((it) => it.part_num);
    if (missing.length === 0) return;
    let cancelled = false;
    loadMissingImages(missing).then((images) => {
      if (cancelled || Object.keys(images).length === 0) return;
      setItems((prev) => prev.map((it) => (images[it.part_num] ? { ...it, part_img_url: images[it.part_num] } : it)));
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  return { items, count, totals, loading, refreshing, loadingMore, hasMore, error, reload, refresh, loadMore };
}
