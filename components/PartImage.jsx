import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

// Foto de la pieza; si no hay URL (o falla la carga) muestra un placeholder.
export default function PartImage({ uri, size = 56 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.img} resizeMode="contain" onError={() => setFailed(true)} />
      ) : (
        <Ionicons name="cube-outline" size={size * 0.45} color="#B9B5A8" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    backgroundColor: '#fff', // las fotos de Rebrickable tienen fondo blanco: así no se ve el "cuadrado" de la imagen
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '86%', height: '86%' },
});
