import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import BoxManagerModal from '../../components/BoxManagerModal';
import InventoryFilters from '../../components/InventoryFilters';
import InventoryTotals from '../../components/InventoryTotals';
import PartDetailModal from '../../components/PartDetailModal';
import PartRow from '../../components/PartRow';
import ScreenHeader from '../../components/ScreenHeader';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import useBoxes from '../../hooks/useBoxes';
import useColors from '../../hooks/useColors';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useInventory from '../../hooks/useInventory';
import { CATEGORY_GROUPS } from '../../lib/categoryGroups';
import { colors, spacing, TAB_BAR_SPACE } from '../../lib/theme';

const NO_FILTERS = { query: '', boxId: null, colorId: null, groupKey: null, onlyUsed: false };

// Definido fuera del componente para que React no lo vuelva a crear en cada pintado.
const RowSeparator = () => <View style={{ height: spacing.md }} />;

export default function Inventario() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [detailItem, setDetailItem] = useState(null); // fila abierta en el detalle
  const [managingBoxes, setManagingBoxes] = useState(false); // gestor de cajas abierto
  const listRef = useRef(null);
  const [showTop, setShowTop] = useState(false); // el botón "subir" solo aparece tras bajar un trozo
  const debouncedQuery = useDebouncedValue(filters.query, 300);
  const { boxes, reload: reloadBoxes } = useBoxes();
  const colorsState = useColors();

  // Filtros "limpios" para la consulta (el texto va con debounce).
  const queryFilters = useMemo(
    () => ({
      query: debouncedQuery,
      boxId: filters.boxId,
      colorId: filters.colorId,
      catIds: CATEGORY_GROUPS.find((g) => g.key === filters.groupKey)?.ids ?? [],
      onlyUsed: filters.onlyUsed,
    }),
    [debouncedQuery, filters.boxId, filters.colorId, filters.groupKey, filters.onlyUsed]
  );

  const inv = useInventory(queryFilters);
  const { reload } = inv;
  const filtering =
    !!debouncedQuery.trim() || filters.boxId != null || filters.colorId != null || !!filters.groupKey || filters.onlyUsed;

  // Cada vez que se vuelve a esta pestaña (o cambian los filtros) se actualiza la lista.
  useFocusEffect(
    useCallback(() => {
      reload();
      reloadBoxes();
    }, [reload, reloadBoxes])
  );

  // Tras renombrar, mover o borrar cajas: se recargan cajas y lista, y si la caja por la que se filtraba
  // ya no existe se quita ese filtro (si no, la lista se quedaría vacía sin explicación).
  const handleBoxesChanged = useCallback(async () => {
    const list = await reloadBoxes();
    if (list) setFilters((f) => (f.boxId != null && !list.some((b) => b.id === f.boxId) ? { ...f, boxId: null } : f));
    reload();
  }, [reloadBoxes, reload]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Inventario" subtitle="Todo lo que ya tienes en cajas" />

      <FlatList
        ref={listRef}
        onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 600)}
        scrollEventThrottle={100}
        data={inv.items}
        keyExtractor={(it) => `${it.part_num}-${it.color_id}`}
        renderItem={({ item }) => <PartRow item={item} highlightBoxId={filters.boxId} onPress={setDetailItem} />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={RowSeparator}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.listHead}>
            <InventoryTotals totals={inv.totals} onPressBoxes={() => setManagingBoxes(true)} />
            <InventoryFilters
              value={filters}
              onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
              boxes={boxes}
              allColors={colorsState.colors}
              resultCount={filtering ? inv.count : undefined}
            />
            {!!inv.error && <Text style={styles.error}>No se pudo cargar el inventario: {inv.error}</Text>}
          </View>
        }
        ListEmptyComponent={
          inv.loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            !inv.error && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>{filtering ? 'Nada coincide' : 'Aún no hay piezas'}</Text>
                <Text style={styles.emptyText}>
                  {filtering
                    ? 'Prueba con otro texto o quita algún filtro.'
                    : 'Ve a la pestaña Añadir para meter las primeras.'}
                </Text>
              </View>
            )
          )
        }
        ListFooterComponent={inv.loadingMore ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        onEndReached={inv.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={inv.refreshing} onRefresh={inv.refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />

      {/* bottom: por encima de la barra de pestañas flotante (66 de alto + 18 de margen) */}
      <ScrollToTopButton
        visible={showTop}
        bottom={100}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
      />

      <BoxManagerModal visible={managingBoxes} onClose={() => setManagingBoxes(false)} onChanged={handleBoxesChanged} />

      <PartDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onChanged={reload}
        allBoxes={boxes}
        allColors={colorsState.colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_SPACE },
  listHead: { gap: spacing.lg, marginBottom: spacing.xl },
  loader: { marginVertical: spacing.xl },
  error: { color: colors.danger, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
});
