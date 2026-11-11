import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import PartImage from './PartImage';
import { colors, radius } from '../lib/theme';

// Una fila del inventario: pieza + color con su cantidad total y el desglose por cajas.
// `highlightBoxId`: si se está filtrando por una caja, se resalta en el desglose.
export default function PartRow({ item, onPress, highlightBoxId = null }) {
  // Unidades usadas en sets montados (siguen contando en el total: están registradas en las cajas).
  // Si un set usara más de lo registrado, "libres" se queda en 0 y no sale un número negativo.
  const used = Number(item.used_quantity ?? 0);
  const free = Math.max(Number(item.total_quantity) - used, 0);

  return (
    <BrickCard edge={colors.border} studs={3} onPress={() => onPress?.(item)} style={styles.card}>
      <PartImage uri={item.img_url ?? item.part_img_url} size={64} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.part_name}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.numPill}>
            <Text style={styles.num}>{item.part_num}</Text>
          </View>
          <View style={[styles.dot, { backgroundColor: `#${item.rgb}` }]} />
          <Text style={styles.color} numberOfLines={1}>
            {item.color_name}
          </Text>
        </View>
        <Text style={styles.boxes} numberOfLines={2}>
          {(item.boxes ?? []).map((b, i) => (
            <Text key={b.box_id} style={b.box_id === highlightBoxId && styles.boxHighlight}>
              {i > 0 ? ', ' : ''}
              {b.box} ({b.qty})
            </Text>
          ))}
        </Text>
        {used > 0 && (
          <View style={styles.usedPill}>
            <Ionicons name="construct" size={12} color="#fff" />
            <Text style={styles.usedText}>
              En sets: {used.toLocaleString('es-ES')} · libres: {free.toLocaleString('es-ES')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.qty}>
        <Text style={styles.qtyX}>x</Text>
        <Text style={styles.qtyNum}>{Number(item.total_quantity).toLocaleString('es-ES')}</Text>
      </View>
    </BrickCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numPill: { backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  num: { fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  color: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  boxes: { fontSize: 12, color: colors.textMuted },
  usedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.blue,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 2,
  },
  usedText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  boxHighlight: { color: colors.ink, fontWeight: '900' },
  qty: {
    minWidth: 54,
    flexDirection: 'row',
    alignItems: 'baseline', // la "x" y el número comparten línea base
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  qtyX: { fontSize: 13, fontWeight: '800', color: 'rgba(21,23,30,0.6)', marginRight: 2 },
  qtyNum: { fontSize: 20, fontWeight: '900', color: colors.ink },
});
