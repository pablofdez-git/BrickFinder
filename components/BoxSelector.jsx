import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import { colors, radius, spacing } from '../lib/theme';

export default function BoxSelector({ boxes, activeBox, onSelect, onCreate, loading }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    setCreating(false);
    setNewName('');
    setError('');
  };

  const handleSelect = (id) => {
    onSelect(id);
    close();
  };

  const handleCreate = async () => {
    try {
      await onCreate(newName);
      close();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <BrickCard color={colors.accent} edge={colors.accentDark} studs={5} onPress={() => setOpen(true)} style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube" size={26} color={colors.accent} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.label}>CAJA ACTIVA</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.ink} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <Text style={[styles.value, !activeBox && styles.placeholder]} numberOfLines={1}>
              {activeBox ? activeBox.name : 'Elige una caja'}
            </Text>
          )}
        </View>
        <View style={styles.chevron}>
          <Ionicons name="swap-vertical" size={20} color={colors.ink} />
        </View>
      </BrickCard>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        {/* Mientras se escribe el nombre, la hoja sube arriba para que el teclado no la tape. */}
        <View style={creating ? styles.wrapTop : styles.wrapBottom}>
          <View style={[styles.sheet, creating && styles.sheetTop]}>
            {!creating && <View style={styles.handle} />}
            <Text style={styles.sheetTitle}>{creating ? 'Nueva caja' : 'Elige la caja'}</Text>

            <FlatList
              data={boxes}
              keyExtractor={(b) => String(b.id)}
              style={creating ? styles.listShort : styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>Aún no hay cajas. Crea la primera abajo.</Text>}
              renderItem={({ item }) => {
                const selected = item.id === activeBox?.id;
                return (
                  <Pressable
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => handleSelect(item.id)}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.name}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={22} color={colors.ink} />}
                  </Pressable>
                );
              }}
            />

            {creating ? (
              <View style={styles.createRow}>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={(t) => {
                    setNewName(t);
                    setError('');
                  }}
                  placeholder="Nombre (ej. cajaBlancas)"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  autoCapitalize="none"
                  onSubmitEditing={handleCreate}
                  returnKeyType="done"
                />
                <Pressable style={styles.createBtn} onPress={handleCreate}>
                  <Text style={styles.createBtnText}>Crear</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.newBox} onPress={() => setCreating(true)}>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
                <Text style={styles.newBoxText}>Nueva caja</Text>
              </Pressable>
            )}
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 18 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: 'rgba(21,23,30,0.6)' },
  value: { fontSize: 26, fontWeight: '900', color: colors.ink },
  placeholder: { color: 'rgba(21,23,30,0.55)', fontWeight: '700' },
  chevron: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  wrapBottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wrapTop: { position: 'absolute', left: 12, right: 12, top: 80 },
  sheetTop: {
    borderBottomLeftRadius: radius.lg + 6,
    borderBottomRightRadius: radius.lg + 6,
    paddingBottom: spacing.lg,
  },
  listShort: { maxHeight: 110 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 8,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  list: { maxHeight: 300 },
  empty: { color: colors.textMuted, paddingVertical: spacing.lg, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionSelected: { backgroundColor: colors.accent },
  optionText: { fontSize: 17, color: colors.text },
  optionTextSelected: { fontWeight: '900', color: colors.ink },
  newBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  newBoxText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  createRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.sm, fontWeight: '600' },
});
