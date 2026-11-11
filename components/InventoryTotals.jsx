import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../lib/theme';

const fmt = (n) => Number(n).toLocaleString('es-ES');

// Si recibe `onPress` el recuadro es pulsable y muestra un pequeño icono de ajustes.
function Tile({ label, value, bg, fg, edge, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: bg, borderBottomColor: edge }, pressed && { opacity: 0.85 }]}
    >
      <Text style={[styles.value, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {!!onPress && <Ionicons name="settings-sharp" size={13} color={fg} style={styles.gear} />}
    </Pressable>
  );
}

// Cabecera con los tres totales del inventario. `onPressBoxes`: abre el gestor de cajas.
export default function InventoryTotals({ totals, onPressBoxes }) {
  return (
    <View style={styles.row}>
      <Tile label="PIEZAS" value={totals ? fmt(totals.totalPieces) : '–'} bg={colors.primary} fg="#fff" edge={colors.primaryDark} />
      <Tile label="TIPOS" value={totals ? fmt(totals.distinctTypes) : '–'} bg={colors.accent} fg={colors.ink} edge={colors.accentDark} />
      <Tile label="CAJAS" value={totals ? fmt(totals.boxes) : '–'} bg={colors.blue} fg="#fff" edge="#003C85" onPress={onPressBoxes} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    borderBottomWidth: 6,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    ...shadow,
  },
  gear: { position: 'absolute', top: 8, right: 8, opacity: 0.7 },
  value: { fontSize: 26, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, opacity: 0.85, marginTop: 2 },
});
