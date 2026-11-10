import { Pressable, StyleSheet, Text, View } from 'react-native';
import PartImage from './PartImage';
import { colors, radius } from '../lib/theme';

// Una pieza en la lista de resultados / recientes.
export default function PartResultRow({ part, onPress }) {
  return (
    <Pressable onPress={() => onPress(part)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <PartImage uri={part.img_url} size={56} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {part.name}
        </Text>
        <View style={styles.numPill}>
          <Text style={styles.num}>{part.part_num}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: '#FFF6C2' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  numPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  num: { fontSize: 12, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
});
