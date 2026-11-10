import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OptionSheet from './OptionSheet';
import { CATEGORY_GROUPS } from '../lib/categoryGroups';
import { colors, radius } from '../lib/theme';

function FilterPill({ icon, label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, active && styles.pillOn, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={16} color={active ? colors.accent : colors.textMuted} />
      <Text style={[styles.pillText, active && styles.pillTextOn]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-down" size={14} color={active ? colors.accent : colors.textMuted} />
    </Pressable>
  );
}

// Buscador + filtros por caja, color y categoría.
// `value`: { query, boxId, colorId, groupKey }. `onChange(parcial)` actualiza solo lo que cambia.
export default function InventoryFilters({ value, onChange, boxes, allColors, resultCount }) {
  const [open, setOpen] = useState(null); // 'box' | 'color' | 'group' | null

  const boxOptions = useMemo(() => boxes.map((b) => ({ key: b.id, label: b.name })), [boxes]);
  const colorOptions = useMemo(
    () => allColors.map((c) => ({ key: c.id, label: c.name, rgb: c.rgb })),
    [allColors]
  );
  const groupOptions = useMemo(() => CATEGORY_GROUPS.map((g) => ({ key: g.key, label: g.label })), []);

  const boxName = boxes.find((b) => b.id === value.boxId)?.name;
  const colorName = allColors.find((c) => c.id === value.colorId)?.name;
  const groupLabel = CATEGORY_GROUPS.find((g) => g.key === value.groupKey)?.label;

  const anyActive = !!value.query.trim() || value.boxId != null || value.colorId != null || !!value.groupKey;

  return (
    <View style={styles.wrap}>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          value={value.query}
          onChangeText={(query) => onChange({ query })}
          placeholder="Buscar por número o nombre"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.query.length > 0 && (
          <Pressable onPress={() => onChange({ query: '' })} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.pills}>
        <FilterPill icon="cube" label={boxName ?? 'Caja'} active={value.boxId != null} onPress={() => setOpen('box')} />
        <FilterPill
          icon="color-palette"
          label={colorName ?? 'Color'}
          active={value.colorId != null}
          onPress={() => setOpen('color')}
        />
        <FilterPill
          icon="grid"
          label={groupLabel ?? 'Categoría'}
          active={!!value.groupKey}
          onPress={() => setOpen('group')}
        />
      </View>

      {anyActive && (
        <View style={styles.summaryRow}>
          <Text style={styles.summary}>
            {resultCount == null ? 'Buscando...' : `${resultCount.toLocaleString('es-ES')} resultado${resultCount === 1 ? '' : 's'}`}
          </Text>
          <Pressable onPress={() => onChange({ query: '', boxId: null, colorId: null, groupKey: null })} hitSlop={8}>
            <Text style={styles.clear}>Limpiar filtros</Text>
          </Pressable>
        </View>
      )}

      <OptionSheet
        visible={open === 'box'}
        title="Filtrar por caja"
        options={boxOptions}
        selectedKey={value.boxId}
        allLabel="Todas las cajas"
        onSelect={(boxId) => onChange({ boxId })}
        onClose={() => setOpen(null)}
      />
      <OptionSheet
        visible={open === 'color'}
        title="Filtrar por color"
        options={colorOptions}
        selectedKey={value.colorId}
        allLabel="Todos los colores"
        searchable
        onSelect={(colorId) => onChange({ colorId })}
        onClose={() => setOpen(null)}
      />
      <OptionSheet
        visible={open === 'group'}
        title="Filtrar por categoría"
        options={groupOptions}
        selectedKey={value.groupKey}
        allLabel="Todas las categorías"
        onSelect={(groupKey) => onChange({ groupKey })}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, paddingVertical: 0 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { flexShrink: 1, fontSize: 13, fontWeight: '800', color: colors.text },
  pillTextOn: { color: colors.accent },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summary: { color: colors.textMuted, fontWeight: '700' },
  clear: { color: colors.primary, fontWeight: '800' },
});
