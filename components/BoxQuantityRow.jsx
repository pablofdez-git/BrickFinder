import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

// Una caja dentro del detalle de una pieza: cantidad, con botones para editarla o borrarla.
// onSave(nuevaCantidad) y onDelete() son asíncronos y pueden lanzar error.
// onMove() y onChangeColor() (opcionales) abren la hoja para mover a otra caja o corregir el color.
export default function BoxQuantityRow({ box, onSave, onDelete, onMove, onChangeColor, disabled }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setText(String(box.qty));
    setError('');
    setEditing(true);
  };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const n = Number(text);
    if (!Number.isInteger(n) || n < 1) {
      setError('Pon un número de 1 o más. Para quitarla de la caja usa Borrar.');
      return;
    }
    if (n === box.qty) {
      setEditing(false);
      return;
    }
    run(async () => {
      await onSave(n);
      setEditing(false);
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.boxIcon}>
          <Ionicons name="cube" size={18} color={colors.accent} />
        </View>
        <Text style={styles.boxName} numberOfLines={1}>
          {box.box}
        </Text>

        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(t) => {
                setText(t.replace(/\D/g, '').slice(0, 5));
                setError('');
              }}
              keyboardType="number-pad"
              selectTextOnFocus
              autoFocus
              maxLength={5}
              onSubmitEditing={save}
            />
            {busy ? (
              <ActivityIndicator color={colors.primary} style={styles.spinner} />
            ) : (
              <>
                <Pressable style={[styles.iconBtn, styles.okBtn]} onPress={save} hitSlop={6}>
                  <Ionicons name="checkmark" size={22} color="#fff" />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => setEditing(false)} hitSlop={6}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.qty}>x{box.qty.toLocaleString('es-ES')}</Text>
            {busy ? (
              <ActivityIndicator color={colors.primary} style={styles.spinner} />
            ) : (
              <>
                <Pressable style={styles.iconBtn} onPress={startEdit} disabled={disabled} hitSlop={6}>
                  <Ionicons name="pencil" size={20} color={colors.ink} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => run(onDelete)} disabled={disabled} hitSlop={6}>
                  <Ionicons name="trash" size={20} color={colors.danger} />
                </Pressable>
              </>
            )}
          </>
        )}
      </View>
      {!editing && !busy && (onMove || onChangeColor) && (
        <View style={styles.actions}>
          {!!onMove && (
            <Pressable style={styles.action} onPress={onMove} disabled={disabled} hitSlop={4}>
              <Ionicons name="swap-horizontal" size={16} color={colors.ink} />
              <Text style={styles.actionText}>Mover a otra caja</Text>
            </Pressable>
          )}
          {!!onChangeColor && (
            <Pressable style={styles.action} onPress={onChangeColor} disabled={disabled} hitSlop={4}>
              <Ionicons name="color-palette" size={16} color={colors.ink} />
              <Text style={styles.actionText}>Cambiar color</Text>
            </Pressable>
          )}
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boxIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxName: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  qty: { fontSize: 20, fontWeight: '900', color: colors.ink, marginRight: 4 },
  input: {
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtn: { backgroundColor: colors.success },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  actionText: { fontSize: 13, fontWeight: '800', color: colors.ink },
  spinner: { width: 80 },
  error: { color: colors.danger, fontWeight: '600', marginTop: 6, fontSize: 13 },
});
