import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../lib/theme';

const fmt = (n) => Number(n).toLocaleString('es-ES');

function Tile({ label, value, bg, fg, edge }) {
  return (
    <View style={[styles.tile, { backgroundColor: bg, borderBottomColor: edge }]}>
      <Text style={[styles.value, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

// Cabecera con los tres totales del inventario.
export default function InventoryTotals({ totals }) {
  return (
    <View style={styles.row}>
      <Tile label="PIEZAS" value={totals ? fmt(totals.totalPieces) : '–'} bg={colors.primary} fg="#fff" edge={colors.primaryDark} />
      <Tile label="TIPOS" value={totals ? fmt(totals.distinctTypes) : '–'} bg={colors.accent} fg={colors.ink} edge={colors.accentDark} />
      <Tile label="CAJAS" value={totals ? fmt(totals.boxes) : '–'} bg={colors.blue} fg="#fff" edge="#003C85" />
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
  value: { fontSize: 26, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, opacity: 0.85, marginTop: 2 },
});
