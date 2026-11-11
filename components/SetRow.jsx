import { StyleSheet, Text, View } from 'react-native';
import BrickCard from './BrickCard';
import PartImage from './PartImage';
import { colors, radius } from '../lib/theme';

// Una fila de la lista de sets: foto, nombre, número, estado y barra de progreso (piezas que ya tienes).
// `needed` / `have` vienen de la vista sets_summary (los repuestos no cuentan).
export default function SetRow({ item, onPress, onLongPress }) {
  const { needed, have } = item;
  const ratio = needed > 0 ? Math.min(have / needed, 1) : 0;
  const complete = needed > 0 && have >= needed;
  const mounted = item.status === 'montado';

  return (
    <BrickCard edge={colors.border} studs={3} onPress={() => onPress?.(item)} onLongPress={() => onLongPress?.(item)} style={styles.card}>
      <PartImage uri={item.img_url} size={72} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.numPill}>
            <Text style={styles.num}>{item.set_num}</Text>
          </View>
          {!!item.year && <Text style={styles.year}>{item.year}</Text>}
          <View style={[styles.status, mounted && styles.statusMounted]}>
            <Text style={[styles.statusText, mounted && styles.statusTextMounted]}>
              {mounted ? 'MONTADO' : 'PENDIENTE'}
            </Text>
          </View>
        </View>

        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: complete ? colors.success : colors.accent }]}
          />
        </View>
        <Text style={styles.progress}>
          {have.toLocaleString('es-ES')} / {needed.toLocaleString('es-ES')} piezas · {Math.floor(ratio * 100)}%
        </Text>
      </View>
    </BrickCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  numPill: { backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  num: { fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  year: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  status: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#EFEBDD' },
  statusMounted: { backgroundColor: colors.blue },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6, color: colors.textMuted },
  statusTextMounted: { color: '#fff' },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: '#EFEBDD', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  progress: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
});
