import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrickCard from './BrickCard';
import { colors, radius } from '../lib/theme';

const fmt = (n) => Number(n).toLocaleString('es-ES');

// Una caja en el gestor: nombre, contenido y botones para renombrarla, mover todo su contenido o borrarla.
// El renombrado se hace en la propia fila. `onRename(nombre)` es asíncrono y puede lanzar error.
export default function BoxManagerRow({ box, canMove, onRename, onMove, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setText(box.name);
    setError('');
    setEditing(true);
  };

  const save = async () => {
    if (text.trim() === box.name) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onRename(text);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const empty = box.total_pieces === 0;

  return (
    <BrickCard edge={colors.border} studs={3} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="cube" size={20} color={colors.accent} />
        </View>

        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(t) => {
                setText(t);
                setError('');
              }}
              autoFocus
              selectTextOnFocus
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={save}
            />
            {busy ? (
              <ActivityIndicator color={colors.primary} style={styles.spinner} />
            ) : (
              <>
                <Pressable style={[styles.btn, styles.okBtn]} onPress={save} hitSlop={6}>
                  <Ionicons name="checkmark" size={22} color="#fff" />
                </Pressable>
                <Pressable style={styles.btn} onPress={() => setEditing(false)} hitSlop={6}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {box.name}
              </Text>
              <Text style={styles.meta}>
                {empty ? 'Vacía' : `${fmt(box.total_pieces)} piezas · ${fmt(box.distinct_types)} tipos`}
              </Text>
            </View>
            <Pressable style={styles.btn} onPress={startEdit} hitSlop={6}>
              <Ionicons name="pencil" size={19} color={colors.ink} />
            </Pressable>
            <Pressable style={[styles.btn, !canMove && styles.btnOff]} onPress={onMove} disabled={!canMove} hitSlop={6}>
              <Ionicons name="swap-horizontal" size={20} color={colors.ink} />
            </Pressable>
            <Pressable style={styles.btn} onPress={onDelete} hitSlop={6}>
              <Ionicons name="trash" size={19} color={colors.danger} />
            </Pressable>
          </>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </BrickCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 12, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '900', color: colors.text },
  meta: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    paddingVertical: 0,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: { opacity: 0.35 },
  okBtn: { backgroundColor: colors.success },
  spinner: { width: 80 },
  error: { color: colors.danger, fontWeight: '600', marginTop: 8, fontSize: 13 },
});
