import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import PartImage from './PartImage';
import ScrollToTopButton from './ScrollToTopButton';
import SetPartFilters from './SetPartFilters';
import SetPartRow from './SetPartRow';
import Toast from './Toast';
import useSetCheck from '../hooks/useSetCheck';
import { colors, radius, spacing } from '../lib/theme';

const Separator = () => <View style={{ height: spacing.md }} />;
const keyOf = (r) => `${r.part_num}-${r.color_id}-${r.is_spare}`;

// Detalle de un set a pantalla completa: qué piezas tienes, cuáles faltan y en qué caja está cada una.
// `set` es una fila de sets_summary (o null si está cerrado). Los cambios (estado, borrar) los hace quien llama
// con `onChangeStatus(setNum, status)` y `onDelete(setNum)`; ambas devuelven una promesa.
export default function SetDetailModal({ set, toast, onClose, onChangeStatus, onResync, onDelete }) {
  const insets = useSafeAreaInsets();
  const { rows, loading, error, reload } = useSetCheck(set?.set_num);
  const [filters, setFilters] = useState({ onlyMissing: false, showSpares: false });
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const [showTop, setShowTop] = useState(false); // el botón "subir" solo aparece tras bajar un trozo

  const { visible, missingPieces, missingTypes } = useMemo(() => {
    const needed = rows.filter((r) => !r.is_spare);
    return {
      visible: rows.filter((r) => (filters.showSpares || !r.is_spare) && (!filters.onlyMissing || r.missing > 0)),
      missingPieces: needed.reduce((sum, r) => sum + r.missing, 0),
      missingTypes: needed.filter((r) => r.missing > 0).length,
    };
  }, [rows, filters]);

  if (!set) return null;

  const mounted = set.status === 'montado';
  const failed = !loading && !!error; // sin datos no se puede decir ni que está completo ni que falta algo
  const complete = !failed && missingPieces === 0;

  async function toggleStatus() {
    setBusy(true);
    try {
      await onChangeStatus(set.set_num, mounted ? 'pendiente' : 'montado');
      await reload(); // la disponibilidad cambia al marcar/desmarcar
    } finally {
      setBusy(false);
    }
  }

  // Vuelve a bajar las piezas de Rebrickable (incluye las de las minifigs) y recarga la lista.
  async function resync() {
    setBusy(true);
    try {
      if (await onResync(set.set_num)) await reload();
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Borrar set', `¿Borrar "${set.name}" (${set.set_num}) y sus piezas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          if (await onDelete(set.set_num)) onClose();
        },
      },
    ]);
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.screen}>
        <FlatList
          ref={listRef}
          onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 600)}
          scrollEventThrottle={100}
          data={visible}
          keyExtractor={keyOf}
          renderItem={({ item }) => (
            <View style={styles.rowPad}>
              <SetPartRow row={item} />
            </View>
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          ListHeaderComponent={
            <View>
              {/* Cabecera oscura con Volver */}
              <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.topRow}>
                  <Pressable onPress={onClose} style={({ pressed }) => [styles.back, pressed && { opacity: 0.8 }]} hitSlop={8}>
                    <Ionicons name="arrow-back" size={20} color={colors.ink} />
                    <Text style={styles.backText}>Volver</Text>
                  </Pressable>
                  <View style={styles.tools}>
                    <Pressable onPress={resync} disabled={busy} hitSlop={10} style={[styles.tool, busy && { opacity: 0.4 }]}>
                      <Ionicons name="sync" size={22} color="#fff" />
                    </Pressable>
                    <Pressable onPress={confirmDelete} hitSlop={10} style={styles.tool}>
                      <Ionicons name="trash-outline" size={22} color="#fff" />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.headRow}>
                  <PartImage uri={set.img_url} size={96} />
                  <View style={styles.headInfo}>
                    <Text style={styles.name} numberOfLines={3}>
                      {set.name}
                    </Text>
                    <View style={styles.numPill}>
                      <Text style={styles.num}>
                        {set.set_num}
                        {set.year ? ` · ${set.year}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.body}>
                {/* Resultado de la comprobación */}
                <BrickCard
                  color={failed ? colors.inkSoft : complete ? colors.success : colors.primary}
                  edge={failed ? colors.ink : complete ? '#146B3C' : colors.primaryDark}
                  studs={5}
                  style={styles.summary}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : failed ? (
                    <>
                      <Text style={styles.sumLabel}>NO SE PUDO COMPROBAR</Text>
                      <Text style={styles.sumSub}>Cierra y vuelve a abrir el set para reintentarlo</Text>
                    </>
                  ) : complete ? (
                    <>
                      <Text style={styles.sumLabel}>{mounted ? 'SET MONTADO' : 'PUEDES MONTARLO'}</Text>
                      <Text style={styles.sumNum}>¡Completo!</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.sumLabel}>TE FALTAN</Text>
                      <Text style={styles.sumNum}>{missingPieces.toLocaleString('es-ES')} piezas</Text>
                      <Text style={styles.sumSub}>en {missingTypes} tipos distintos</Text>
                    </>
                  )}
                </BrickCard>

                <Pressable
                  onPress={toggleStatus}
                  disabled={busy}
                  style={({ pressed }) => [styles.action, mounted && styles.actionAlt, busy && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Text style={styles.actionText}>
                      {mounted ? 'Desmontar (volver a pendiente)' : 'Marcar como montado'}
                    </Text>
                  )}
                </Pressable>
                {!mounted && (
                  <Text style={styles.hint}>
                    Al marcarlo como montado, sus piezas dejan de contar como disponibles para los demás sets.
                  </Text>
                )}

                <Text style={styles.section}>PIEZAS</Text>
                <SetPartFilters {...filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} />
                {!!error && <Text style={styles.error}>No se pudieron cargar las piezas: {error}</Text>}
              </View>
            </View>
          }
          ListEmptyComponent={
            !loading && !error ? (
              <Text style={styles.empty}>{filters.onlyMissing ? 'No falta ninguna pieza.' : 'Este set no tiene piezas.'}</Text>
            ) : null
          }
          style={styles.list}
        />

        <ScrollToTopButton
          visible={showTop}
          bottom={insets.bottom + 20}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        />

        {/* El modal tapa el Toast de la pantalla de Sets, así que los avisos se pintan también aquí dentro. */}
        <Toast message={toast} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1 },
  rowPad: { paddingHorizontal: spacing.lg }, // margen lateral de las filas (la cabecera va a todo el ancho)

  header: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    gap: 18,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backText: { fontSize: 15, fontWeight: '900', color: colors.ink },
  tools: { flexDirection: 'row', gap: 10 },
  tool: { padding: 6 },

  headRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  headInfo: { flex: 1, gap: 8 },
  name: { fontSize: 20, fontWeight: '900', color: '#fff' },
  numPill: { alignSelf: 'flex-start', backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  num: { fontSize: 13, fontWeight: '900', color: colors.ink, letterSpacing: 0.5 },

  body: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  summary: { alignItems: 'center', paddingVertical: 18 },
  sumLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.8)' },
  sumNum: { fontSize: 34, fontWeight: '900', color: '#fff' },
  sumSub: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  action: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
    paddingVertical: 14,
  },
  actionAlt: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, borderBottomWidth: 4 },
  actionText: { fontSize: 16, fontWeight: '900', color: colors.ink },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: -6 },

  section: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted, marginBottom: -6 },
  error: { color: colors.danger, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: 30 },
});
