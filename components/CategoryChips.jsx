import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { CATEGORY_GROUPS } from '../lib/categoryGroups';
import { colors, radius } from '../lib/theme';

// Chips para filtrar por categoría. Tocar el chip activo lo desactiva.
export default function CategoryChips({ selectedKey, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
    >
      {CATEGORY_GROUPS.map((g) => {
        const on = g.key === selectedKey;
        return (
          <Pressable
            key={g.key}
            onPress={() => onSelect(on ? null : g)}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.text, on && styles.textOn]}>{g.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#F2EFE8',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { fontSize: 14, fontWeight: '700', color: colors.text },
  textOn: { color: colors.accent },
});
