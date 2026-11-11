import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// Dos interruptores para la lista de piezas de un set: solo las que faltan y mostrar repuestos.
export default function SetPartFilters({ onlyMissing, showSpares, onChange }) {
  return (
    <View style={styles.row}>
      <Chip label="Solo las que faltan" active={onlyMissing} onPress={() => onChange({ onlyMissing: !onlyMissing })} />
      <Chip label="Con repuestos" active={showSpares} onPress={() => onChange({ showSpares: !showSpares })} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  chipTextActive: { color: colors.accent },
});
