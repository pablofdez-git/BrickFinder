import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import PartImage from './PartImage';
import { cardColorsFor } from '../lib/colorUtils';
import { colors, radius } from '../lib/theme';

// Una pieza + color de un set: lo que necesita, lo que tienes disponible y en qué cajas está.
// `row` viene de set_check: { part_num, part_name, color_name, rgb, is_spare, needed, available, missing, boxes, img_url }.
function SetPartRow({ row }) {
  const ok = row.missing === 0;
  const boxes = row.boxes ?? [];
  const card = cardColorsFor(row.rgb);

  return (
    // La tarjeta toma el color real de la pieza (fondo suave, borde y tetones en el color puro).
    <BrickCard color={card.body} edge={card.edge} studs={3} style={styles.card}>
      <PartImage uri={row.img_url} size={56} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {row.part_name ?? row.part_num}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.numPill}>
            <Text style={styles.num}>{row.part_num}</Text>
          </View>
          <View style={[styles.dot, { backgroundColor: `#${row.rgb}` }]} />
          <Text style={styles.color} numberOfLines={1}>
            {row.color_name}
          </Text>
          {row.is_spare && <Text style={styles.spare}>REPUESTO</Text>}
        </View>
        <Text style={styles.boxes} numberOfLines={2}>
          {boxes.length > 0 ? boxes.map((b) => `${b.box} (${b.qty})`).join(', ') : 'No está en ninguna caja'}
        </Text>
      </View>

      <View style={[styles.badge, ok ? styles.badgeOk : styles.badgeMissing]}>
        {ok ? (
          <>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.badgeNum}>x{row.needed}</Text>
          </>
        ) : (
          <>
            <Text style={styles.badgeLabel}>FALTAN</Text>
            <Text style={styles.badgeNum}>{row.missing}</Text>
            <Text style={styles.badgeSub}>
              {row.available}/{row.needed}
            </Text>
          </>
        )}
      </View>
    </BrickCard>
  );
}

export default memo(SetPartRow);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  numPill: { backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  num: { fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  color: { flexShrink: 1, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  spare: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6, color: colors.textMuted },
  boxes: { fontSize: 12, color: colors.textMuted },
  badge: { minWidth: 58, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 8 },
  badgeOk: { backgroundColor: colors.success },
  badgeMissing: { backgroundColor: colors.primary },
  badgeLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: 'rgba(255,255,255,0.8)' },
  badgeNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
  badgeSub: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
});
