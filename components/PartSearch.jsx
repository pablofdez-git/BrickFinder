import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import CategoryChips from './CategoryChips';
import PartImage from './PartImage';
import PartResultRow from './PartResultRow';
import usePartSearch from '../hooks/usePartSearch';
import { colors, radius } from '../lib/theme';

// Buscador de piezas. `selected` es la pieza elegida (o null); `recents` se muestra antes de escribir.
// Cuando `resetKey` cambia (tras guardar) se vacía el texto, para empezar la siguiente búsqueda limpia.
export default function PartSearch({ selected, onSelect, recents, inputRef, resetKey }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(null);
  const { results, loading, error, active } = usePartSearch(query, group);

  useEffect(() => setQuery(''), [resetKey]);

  const handleSelect = (part) => {
    Keyboard.dismiss();
    onSelect(part);
  };

  const handleChange = () => {
    onSelect(null);
    setTimeout(() => inputRef?.current?.focus(), 50);
  };

  // Pieza ya elegida: vista compacta para dejar sitio a color y cantidad.
  if (selected) {
    return (
      <BrickCard edge={colors.border} studs={4}>
        <Text style={styles.label}>PIEZA</Text>
        <View style={styles.selectedRow}>
          <PartImage uri={selected.img_url} size={72} />
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName} numberOfLines={2}>
              {selected.name}
            </Text>
            <View style={styles.numPill}>
              <Text style={styles.num}>{selected.part_num}</Text>
            </View>
          </View>
          <Pressable onPress={handleChange} style={styles.changeBtn} hitSlop={8}>
            <Ionicons name="swap-horizontal" size={18} color={colors.ink} />
            <Text style={styles.changeText}>Cambiar</Text>
          </Pressable>
        </View>
      </BrickCard>
    );
  }

  return (
    <BrickCard edge={colors.border} studs={4}>
      <Text style={styles.label}>BUSCAR PIEZA</Text>

      <View style={styles.inputWrap}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Número (3001) o nombre (ladrillo 2x4)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.chips}>
        <CategoryChips selectedKey={group?.key ?? null} onSelect={setGroup} />
      </View>

      {active ? (
        <View style={styles.list}>
          {loading && results.length === 0 && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          {!!error && <Text style={styles.error}>Error al buscar: {error}</Text>}
          {!loading && !error && results.length === 0 && <Text style={styles.empty}>Sin resultados</Text>}
          {results.map((p) => (
            <PartResultRow key={p.part_num} part={p} onPress={handleSelect} />
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>RECIENTES</Text>
          {recents.length === 0 ? (
            <Text style={styles.empty}>Aquí aparecerán las piezas que uses.</Text>
          ) : (
            recents.map((p) => <PartResultRow key={p.part_num} part={p} onPress={handleSelect} />)
          )}
        </View>
      )}
    </BrickCard>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted, marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F5F0',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, paddingVertical: 0 },
  chips: { marginTop: 12 },
  list: { marginTop: 12, gap: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted, marginBottom: 6 },
  loader: { marginVertical: 18 },
  empty: { color: colors.textMuted, paddingVertical: 14, textAlign: 'center' },
  error: { color: colors.danger, fontWeight: '600', paddingVertical: 10 },

  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedInfo: { flex: 1, gap: 6 },
  selectedName: { fontSize: 16, fontWeight: '800', color: colors.text },
  numPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  num: { fontSize: 13, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  changeBtn: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  changeText: { fontSize: 11, fontWeight: '800', color: colors.ink },
});
