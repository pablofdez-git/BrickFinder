import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import { matchesQuery } from '../lib/searchTerms';
import { colors as theme, radius } from '../lib/theme';

const COMPACT_COUNT = 18;

// Texto/check oscuro o blanco según la luminosidad de la muestra.
function checkColor(rgb) {
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#15171E' : '#FFFFFF';
}

function Swatch({ color, selected, onPress }) {
  const hex = `#${color.rgb}`;
  return (
    <Pressable
      onPress={() => onPress(color.id)}
      style={({ pressed }) => [styles.swatchOuter, selected && styles.swatchOuterOn, pressed && { opacity: 0.7 }]}
      accessibilityLabel={color.name}
    >
      <View
        style={[
          styles.swatch,
          { backgroundColor: color.is_trans ? `${hex}99` : hex },
          color.is_trans && styles.swatchTrans,
        ]}
      >
        {selected && <Ionicons name="checkmark" size={22} color={checkColor(color.rgb)} />}
      </View>
    </Pressable>
  );
}

// `colors` llega ordenada de más a menos usado; `recentIds` son los últimos usados (el más reciente primero).
export default function ColorPicker({ colors, recentIds, selectedId, onSelect, loading, error }) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('');

  const selected = colors.find((c) => c.id === selectedId) ?? null;

  // Vista compacta: recientes primero y se completa con los más usados.
  const compact = useMemo(() => {
    const byId = new Map(colors.map((c) => [c.id, c]));
    const recents = recentIds.map((id) => byId.get(id)).filter(Boolean);
    const used = new Set(recents.map((c) => c.id));
    const fill = colors.filter((c) => !used.has(c.id));
    const list = [...recents, ...fill].slice(0, COMPACT_COUNT);
    // El color elegido siempre visible, aunque lo haya escogido en "ver todos".
    if (selected && !list.some((c) => c.id === selected.id)) list.unshift(selected);
    return list;
  }, [colors, recentIds, selected]);

  const all = useMemo(() => {
    return filter.trim() ? colors.filter((c) => matchesQuery(c.name, filter)) : colors;
  }, [colors, filter]);

  const visible = showAll ? all : compact;

  return (
    <BrickCard edge={theme.border} studs={4}>
      <View style={styles.headRow}>
        <Text style={styles.label}>COLOR</Text>
        {selected && (
          <View style={styles.selectedPill}>
            <View style={[styles.dot, { backgroundColor: `#${selected.rgb}` }]} />
            <Text style={styles.selectedName} numberOfLines={1}>
              {selected.name}
            </Text>
          </View>
        )}
      </View>

      {loading && <ActivityIndicator color={theme.primary} style={{ marginVertical: 18 }} />}
      {!!error && <Text style={styles.error}>No se pudieron cargar los colores: {error}</Text>}

      {showAll && (
        <View style={styles.filterWrap}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={styles.filterInput}
            value={filter}
            onChangeText={setFilter}
            placeholder="Filtrar colores (ej. rojo, blue)"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      <View style={styles.grid}>
        {visible.map((c) => (
          <Swatch key={c.id} color={c} selected={c.id === selectedId} onPress={onSelect} />
        ))}
      </View>
      {showAll && visible.length === 0 && <Text style={styles.empty}>Ningún color coincide</Text>}

      {colors.length > 0 && (
        <Pressable
          style={styles.toggle}
          onPress={() => {
            setShowAll((v) => !v);
            setFilter('');
          }}
        >
          <Text style={styles.toggleText}>{showAll ? 'Ver menos' : `Ver todos (${colors.length})`}</Text>
          <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} />
        </Pressable>
      )}
    </BrickCard>
  );
}

const SIZE = 46;

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: theme.textMuted },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.ink,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 12,
    maxWidth: '65%',
  },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  selectedName: { color: theme.accent, fontWeight: '800', fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchOuter: {
    width: SIZE + 8,
    height: SIZE + 8,
    borderRadius: (SIZE + 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchOuterOn: { borderColor: theme.ink },
  swatch: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchTrans: { borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.4)' },

  filterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F5F0',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  filterInput: { flex: 1, fontSize: 15, color: theme.text, paddingVertical: 0 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    paddingVertical: 8,
  },
  toggleText: { color: theme.primary, fontWeight: '800', fontSize: 14 },
  empty: { color: theme.textMuted, textAlign: 'center', paddingVertical: 12 },
  error: { color: theme.danger, fontWeight: '600' },
});
