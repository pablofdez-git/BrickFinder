import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

// Botón grande de guardar. Debajo indica qué falta para poder guardar.
// (El resultado del guardado se muestra en el aviso flotante, <Toast />.)
export default function SaveButton({ onPress, saving, missing }) {
  const disabled = saving || missing.length > 0;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save" size={24} color="#fff" />
            <Text style={styles.text}>Guardar</Text>
          </>
        )}
      </Pressable>

      {missing.length > 0 && <Text style={styles.hint}>Falta elegir: {missing.join(', ')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  button: {
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    borderBottomWidth: 6,
    borderBottomColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabled: { backgroundColor: '#C9C5BA', borderBottomColor: '#ADA999' },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 3 },
  text: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  hint: { textAlign: 'center', color: colors.textMuted, fontWeight: '600' },
});
