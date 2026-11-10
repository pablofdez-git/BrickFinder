import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

const SHOW_MS = { ok: 2200, error: 4500 };

// Aviso flotante arriba de la pantalla que se desliza, se queda un momento y desaparece solo.
// `message`: { id, type: 'ok' | 'error', text } o null. Un `id` nuevo vuelve a mostrarlo.
export default function Toast({ message }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const shown = useRef(null); // último mensaje mostrado (para que el texto no desaparezca durante la salida)

  if (message) shown.current = message;

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }, SHOW_MS[message.type] ?? SHOW_MS.ok);
    return () => clearTimeout(timer);
    // Solo se reinicia cuando llega un aviso NUEVO (cambia el id), no en cada pintado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id]);

  const current = shown.current;
  if (!current) return null;
  const isError = current.type === 'error';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top: insets.top + 10,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }) }],
        },
      ]}
    >
      <View style={[styles.toast, isError && styles.toastError]}>
        <View style={[styles.icon, isError && styles.iconError]}>
          <Ionicons name={isError ? 'alert' : 'checkmark'} size={20} color={isError ? '#fff' : colors.ink} />
        </View>
        <Text style={styles.text} numberOfLines={3}>
          {current.text}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 50 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    borderBottomWidth: 5,
    borderBottomColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  toastError: { backgroundColor: colors.primaryDark },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconError: { backgroundColor: colors.primary },
  text: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '800' },
});
