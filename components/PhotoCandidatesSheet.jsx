import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PartImage from './PartImage';
import { colors, radius, spacing } from '../lib/theme';

const COLOR_PRESELECT_SCORE = 0.5; // el color sugerido solo se preselecciona si el servicio está bastante seguro

// Hoja que aparece al hacer una foto: muestra "analizando", el error, o las piezas y colores que ha reconocido
// para que toques los correctos. `photo` es lo que devuelve usePhotoIdentify.
// onPick(part, colorId | null): pieza elegida y color (null = no cambiar el color que ya hay en la pantalla).
export default function PhotoCandidatesSheet({ photo, onPick, onRetry, onClose }) {
  const { height } = useWindowDimensions();
  const [colorId, setColorId] = useState(null);
  const visible = photo.status !== 'idle';
  const suggested = photo.result?.colors ?? [];
  const candidates = photo.result?.candidates ?? [];

  // Cada resultado nuevo empieza con el color más probable preseleccionado (si es fiable).
  useEffect(() => {
    const top = photo.result?.colors?.[0];
    setColorId(top && top.score >= COLOR_PRESELECT_SCORE ? top.color.id : null);
  }, [photo.result]);

  const chosenColor = suggested.find((c) => c.color.id === colorId)?.color;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight: height * 0.8 }]}>
        <View style={styles.head}>
          <Text style={styles.title}>Reconocer pieza</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {!!photo.photoUri && <Image source={{ uri: photo.photoUri }} style={styles.photo} resizeMode="cover" />}

          {photo.status === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.centerText}>Analizando la foto…</Text>
            </View>
          )}

          {photo.status === 'error' && (
            <View style={styles.center}>
              <Text style={styles.error}>{photo.error}</Text>
              <RetryButton onPress={onRetry} />
            </View>
          )}

          {photo.status === 'done' && candidates.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.centerText}>No he reconocido la pieza. Prueba con más luz, fondo liso y una sola pieza.</Text>
              <RetryButton onPress={onRetry} />
            </View>
          )}

          {photo.status === 'done' && candidates.length > 0 && (
            <>
              {suggested.length > 0 && (
                <View style={styles.block}>
                  <Text style={styles.section}>
                    COLOR SUGERIDO{chosenColor ? ` · ${chosenColor.name}` : ''}
                  </Text>
                  <View style={styles.swatches}>
                    {suggested.map(({ color, score }) => {
                      const on = color.id === colorId;
                      return (
                        <Pressable
                          key={color.id}
                          onPress={() => setColorId(on ? null : color.id)}
                          style={[styles.swatchOuter, on && styles.swatchOuterOn]}
                          accessibilityLabel={`${color.name} ${Math.round(score * 100)}%`}
                        >
                          <View style={[styles.swatch, { backgroundColor: `#${color.rgb}` }]}>
                            {on && <Ionicons name="checkmark" size={20} color="#fff" style={styles.check} />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.hint}>Toca un color para elegirlo, o tócalo otra vez para dejar el que ya tenías.</Text>
                </View>
              )}

              <View style={styles.block}>
                <Text style={styles.section}>¿CUÁL ES TU PIEZA?</Text>
                {candidates.map(({ part, thumb, score }) => (
                  <Pressable
                    key={part.part_num}
                    style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                    onPress={() => onPick(part, colorId)}
                  >
                    <PartImage uri={thumb ?? part.img_url} size={56} />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={2}>
                        {part.name}
                      </Text>
                      <View style={styles.numPill}>
                        <Text style={styles.num}>{part.part_num}</Text>
                      </View>
                    </View>
                    <Text style={styles.score}>{Math.round(score * 100)}%</Text>
                  </Pressable>
                ))}
              </View>

              <RetryButton onPress={onRetry} label="Ninguna es: hacer otra foto" />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function RetryButton({ onPress, label = 'Hacer otra foto' }) {
  return (
    <Pressable style={({ pressed }) => [styles.retry, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <Ionicons name="camera" size={18} color={colors.ink} />
      <Text style={styles.retryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg + 6,
    padding: spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  photo: { width: '100%', height: 150, borderRadius: radius.md, backgroundColor: colors.bg, marginBottom: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  centerText: { color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
  error: { color: colors.danger, textAlign: 'center', fontWeight: '700' },
  block: { marginBottom: spacing.lg },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  swatches: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatchOuter: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  swatchOuterOn: { borderColor: colors.ink },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  check: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowInfo: { flex: 1, gap: 4 },
  rowName: { fontSize: 15, fontWeight: '800', color: colors.text },
  numPill: { alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  num: { fontSize: 12, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  score: { fontSize: 14, fontWeight: '900', color: colors.textMuted },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  retryText: { fontSize: 15, fontWeight: '900', color: colors.ink },
});
