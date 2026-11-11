import { useCallback, useEffect, useState } from 'react';
import { addSet, deleteSet, fetchSetsSummary, resyncSetParts, setSetStatus } from '../lib/setsApi';

// Lista de sets con progreso, pull-to-refresh y las acciones (añadir, cambiar estado, borrar).
// Las acciones lanzan el error al llamador (para mostrarlo en un Toast) y recargan la lista si van bien.
export default function useSets() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setSets(await fetchSetsSummary());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const add = useCallback(
    async (input) => {
      const set = await addSet(input);
      await reload();
      return set;
    },
    [reload]
  );

  const changeStatus = useCallback(
    async (setNum, status) => {
      await setSetStatus(setNum, status);
      await reload();
    },
    [reload]
  );

  const resync = useCallback(
    async (setNum) => {
      await resyncSetParts(setNum);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (setNum) => {
      await deleteSet(setNum);
      await reload();
    },
    [reload]
  );

  return { sets, loading, refreshing, error, reload, refresh, add, changeStatus, resync, remove };
}
