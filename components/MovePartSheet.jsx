import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

// Hoja para mover unidades de una pieza desde una caja a otra: se elige cuántas y se toca la caja de destino.
// `box` = { box_id, box, qty } (la caja de origen; null = cerrada). `destinations` = [{ id, name }].
// `onMove(toBoxId, qty)` es asíncrono y puede lanzar error (se muestra dentro de la hoja).
export default function MovePartSheet({ box, destinations, onMove, onClose }) {
  const { height } = useWindowDimensions();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Cada vez que se abre, la cantidad vuelve a ser "todas".
  useEffect(() => {
    if (box) {
      setText(String(box.qty));
      setError('');
    }
  }, [box]);

  if (!box) return null;

  const choose = async (toId) => {
    const n = Number(text);
    if (!Number.isInteger(n) || n < 1 || n > box.qty) {
      setError(`Pon una cantidad entre 1 y ${box.qty}`);
      return;
    }
    setBusy(true);
    try {
      await onMove(toId, n);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight: height * 0.7 }]}>
        <View style={styles.head}>
          <Text style={styles.title}>Mover desde {box.box}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Cantidad a mover</Text>
          <TextInput
            style={styles.qtyInput}
            value={text}
            onChangeText={(t) => {
              setText(t.replace(/\D/g, '').slice(0, 5));
              setError('');
            }}
            keyboardType="number-pad"
            selectTextOnFocus
            maxLength={5}
          />
          <Pressable style={styles.allBtn} onPress={() => setText(String(box.qty))}>
            <Text style={styles.allText}>Todas ({box.qty})</Text>
          </Pressable>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.hint}>Toca la caja de destino:</Text>

        {busy ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <FlatList
            data={destinations}
            keyExtractor={(b) => String(b.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>No hay otras cajas. Crea una desde la pestaña Añadir.</Text>}
            renderItem={({ item }) => (
              <Pressable style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]} onPress={() => choose(item.id)}>
                <Ionicons name="cube" size={18} color={colors.ink} />
                <Text style={styles.optionText} numberOfLines={1}>
                  {item.name}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          />
        )}
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  qtyInput: {
    width: 84,
    height: 44,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 0,
  },
  allBtn: { backgroundColor: colors.bg, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 12 },
  allText: { fontSize: 13, fontWeight: '800', color: colors.ink },
  error: { color: colors.danger, fontWeight: '600', marginTop: spacing.sm },
  hint: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.md },
  optionText: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
