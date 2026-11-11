import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

// Campo para añadir un set por su número (ej. 75192). `onAdd(texto)` debe devolver una promesa:
// mientras se resuelve se muestra la carga (bajar las piezas de Rebrickable tarda unos segundos).
// Si va bien se vacía el campo; si falla, el error lo gestiona quien llama y el texto se conserva.
export default function AddSetBar({ onAdd }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      await onAdd(text);
      setText('');
    } catch {
      /* el aviso de error ya lo muestra la pantalla */
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Número de set (ej. 75192)"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
          onSubmitEditing={submit}
          editable={!busy}
          autoCorrect={false}
        />
        {text.length > 0 && !busy && (
          <Pressable onPress={() => setText('')} hitSlop={10} style={styles.clear}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={submit}
        disabled={busy || !text.trim()}
        style={({ pressed }) => [styles.button, (busy || !text.trim()) && styles.buttonOff, pressed && styles.pressed]}
      >
        {busy ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>Añadir</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1, justifyContent: 'center' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: 14,
    paddingRight: 40, // hueco para la X
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clear: { position: 'absolute', right: 10 },
  button: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
    paddingHorizontal: 16,
  },
  buttonOff: { opacity: 0.5 },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  buttonText: { fontSize: 16, fontWeight: '900', color: colors.ink },
});
