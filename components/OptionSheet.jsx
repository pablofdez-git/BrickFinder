import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchesQuery } from '../lib/searchTerms';
import { colors, radius, spacing } from '../lib/theme';

// Hoja para elegir una opción de una lista (caja, color, categoría...).
// options: [{ key, label, rgb? }]. onSelect(key) o onSelect(null) para quitar el filtro.
// Se coloca ARRIBA de la pantalla para que el teclado del filtro de texto nunca la tape.
export default function OptionSheet({
  visible,
  title,
  options,
  selectedKey,
  onSelect,
  onClose,
  searchable = false,
  allLabel = 'Todas',
  showAll = true, // false = sin la opción "Todas" (por ejemplo, al elegir un destino obligatorio)
}) {
  const [filter, setFilter] = useState('');
  const { height } = useWindowDimensions();

  const close = () => {
    setFilter('');
    onClose();
  };

  const choose = (key) => {
    onSelect(key);
    close();
  };

  const f = filter.trim();
  const shown = f ? options.filter((o) => matchesQuery(o.label, f)) : options;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { maxHeight: height * 0.62 }]}>
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={close} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {searchable && (
          <View style={styles.filterWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.filterInput}
              value={filter}
              onChangeText={setFilter}
              placeholder="Buscar (ej. rojo, azul claro)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <FlatList
          data={shown}
          keyExtractor={(o) => String(o.key)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            showAll && !f ? (
              <Pressable
                style={[styles.option, selectedKey == null && styles.optionOn]}
                onPress={() => choose(null)}
              >
                <Text style={[styles.optionText, selectedKey == null && styles.optionTextOn]}>{allLabel}</Text>
                {selectedKey == null && <Ionicons name="checkmark-circle" size={22} color={colors.ink} />}
              </Pressable>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>Sin resultados</Text>}
          renderItem={({ item }) => {
            const on = item.key === selectedKey;
            return (
              <Pressable style={[styles.option, on && styles.optionOn]} onPress={() => choose(item.key)}>
                {!!item.rgb && <View style={[styles.dot, { backgroundColor: `#${item.rgb}` }]} />}
                <Text style={[styles.optionText, on && styles.optionTextOn]} numberOfLines={1}>
                  {item.label}
                </Text>
                {on && <Ionicons name="checkmark-circle" size={22} color={colors.ink} />}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    top: 80,
    left: 12,
    right: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg + 6,
    padding: spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  filterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: spacing.sm,
  },
  filterInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionOn: { backgroundColor: colors.accent },
  optionText: { flex: 1, fontSize: 16, color: colors.text },
  optionTextOn: { fontWeight: '900', color: colors.ink },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
