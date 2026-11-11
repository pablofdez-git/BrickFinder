import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../lib/theme';

// Botón redondo flotante (abajo a la derecha) que lleva al principio de una lista larga.
// `visible` lo decide quien lo usa (normalmente: cuando ya se ha bajado un buen trozo).
// `bottom` deja sitio a la barra inferior del dispositivo o de pestañas.
export default function ScrollToTopButton({ visible, onPress, bottom = 24 }) {
  if (!visible) return null;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, { bottom }, pressed && styles.pressed]}
    >
      <Ionicons name="arrow-up" size={26} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
});
