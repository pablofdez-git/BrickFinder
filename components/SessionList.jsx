import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import { colors, radius } from '../lib/theme';

const MAX_VISIBLE = 20;

// "Añadidas en esta sesión": la más reciente arriba, cada fila con su botón Deshacer.
export default function SessionList({ entries, onUndo, undoingId, error }) {
  if (entries.length === 0) return null;

  const totalPieces = entries.reduce((sum, e) => sum + e.qty, 0);
  const visible = entries.slice(0, MAX_VISIBLE);

  return (
    <BrickCard edge={colors.border} studs={4}>
      <View style={styles.head}>
        <Text style={styles.label}>AÑADIDAS EN ESTA SESIÓN</Text>
        <View style={styles.total}>
          <Text style={styles.totalText}>{totalPieces} pzs</Text>
        </View>
      </View>

      {visible.map((e, i) => (
        <View key={e.id} style={[styles.row, i > 0 && styles.rowBorder]}>
          <View style={[styles.dot, { backgroundColor: `#${e.rgb}` }]} />
          <View style={styles.info}>
            <Text style={styles.main} numberOfLines={1}>
              {e.partNum} · {e.colorName} · x{e.qty} <Text style={styles.check}>✓</Text>
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {e.partName} · {e.boxName}
            </Text>
          </View>
          <Pressable
            onPress={() => onUndo(e)}
            disabled={undoingId !== null}
            style={({ pressed }) => [styles.undo, pressed && { opacity: 0.6 }, undoingId !== null && styles.undoOff]}
            hitSlop={6}
          >
            {undoingId === e.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="arrow-undo" size={16} color={colors.primary} />
                <Text style={styles.undoText}>Deshacer</Text>
              </>
            )}
          </Pressable>
        </View>
      ))}

      {entries.length > MAX_VISIBLE && (
        <Text style={styles.more}>… y {entries.length - MAX_VISIBLE} más anteriores</Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </BrickCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted },
  total: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  totalText: { color: colors.accent, fontWeight: '800', fontSize: 12 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  info: { flex: 1 },
  main: { fontSize: 15, fontWeight: '800', color: colors.text },
  check: { color: colors.success },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 92,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  undoOff: { opacity: 0.5 },
  undoText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  more: { textAlign: 'center', color: colors.textMuted, paddingTop: 8, fontSize: 12 },
  error: { color: colors.danger, fontWeight: '600', paddingTop: 8 },
});
