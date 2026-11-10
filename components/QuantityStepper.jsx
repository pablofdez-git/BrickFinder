import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BrickCard from './BrickCard';
import { hapticTap } from '../lib/haptics';
import { colors, radius } from '../lib/theme';

const MAX = 99999;
const ADD_BUTTONS = [1, 5, 10];

// Cantidad: número editable a mano + botones grandes. `value` es un entero (0 mientras el campo está vacío).
export default function QuantityStepper({ value, onChange }) {
  const [text, setText] = useState(String(value));

  // Si la cantidad cambia desde fuera (ej. vuelve a 1 tras guardar), refrescamos el campo.
  useEffect(() => {
    setText((prev) => (Number(prev || 0) === value ? prev : String(value)));
  }, [value]);

  // Botones: cambian la cantidad con una vibración suave (entre 1 y MAX).
  const set = (n) => {
    hapticTap();
    onChange(Math.min(MAX, Math.max(1, n)));
  };

  const handleText = (t) => {
    const digits = t.replace(/\D/g, '').slice(0, 5);
    setText(digits);
    onChange(digits ? Number(digits) : 0);
  };

  // Al salir del campo no puede quedar vacío ni en 0.
  const handleBlur = () => {
    if (!value) onChange(1);
  };

  return (
    <BrickCard edge={colors.border} studs={4}>
      <Text style={styles.label}>CANTIDAD</Text>

      <View style={styles.topRow}>
        <Pressable
          onPress={() => set(value - 1)}
          style={({ pressed }) => [styles.minus, pressed && styles.pressed]}
          accessibilityLabel="Restar 1"
        >
          <Text style={styles.minusText}>−1</Text>
        </Pressable>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleText}
          onBlur={handleBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={5}
        />
      </View>

      <View style={styles.addRow}>
        {ADD_BUTTONS.map((n) => (
          <Pressable
            key={n}
            onPress={() => set(value + n)}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          >
            <Text style={styles.addText}>+{n}</Text>
          </Pressable>
        ))}
      </View>
    </BrickCard>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted, marginBottom: 12 },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  minus: {
    width: 72,
    borderRadius: radius.lg,
    borderWidth: 2.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusText: { fontSize: 26, fontWeight: '900', color: colors.primary },
  input: {
    flex: 1,
    height: 72,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    color: colors.accent,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 0,
  },
  addRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  add: {
    flex: 1,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    borderBottomWidth: 5,
    borderBottomColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 24, fontWeight: '900', color: colors.ink },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.85 },
});
