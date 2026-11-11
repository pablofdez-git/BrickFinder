import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BoxQuantityRow from './BoxQuantityRow';
import BrickCard from './BrickCard';
import KeyboardAwareScrollView from './KeyboardAwareScrollView';
import PartImage from './PartImage';
import { deleteInventoryRow, setInventoryQuantity } from '../lib/inventoryApi';
import { colors, radius, spacing } from '../lib/theme';

// Detalle de una pieza + color, a pantalla completa: cantidad en cada caja, con opción de editarla o borrarla.
// `item` es una fila de inventory_summary (o null si está cerrado). `onChanged` avisa de que hubo cambios.
export default function PartDetailModal({ item, onClose, onChanged }) {
  const insets = useSafeAreaInsets();
  const [boxes, setBoxes] = useState([]);

  // Copia local de las cajas para reflejar los cambios al instante, sin esperar a recargar la lista.
  useEffect(() => {
    setBoxes(item?.boxes ?? []);
  }, [item]);

  if (!item) return null;

  const total = boxes.reduce((sum, b) => sum + b.qty, 0);
  const usedIn = item.used_in ?? []; // sets montados que usan esta pieza + color
  const used = Number(item.used_quantity ?? 0);
  const key = { partNum: item.part_num, colorId: item.color_id };

  const handleSave = async (box, qty) => {
    await setInventoryQuantity({ boxId: box.box_id, qty, ...key });
    setBoxes((prev) => prev.map((b) => (b.box_id === box.box_id ? { ...b, qty } : b)));
    onChanged?.();
  };

  const doDelete = async (box) => {
    await deleteInventoryRow({ boxId: box.box_id, ...key });
    const rest = boxes.filter((b) => b.box_id !== box.box_id);
    setBoxes(rest);
    onChanged?.();
    if (rest.length === 0) onClose(); // ya no queda nada de esta pieza
  };

  // Borrar pide confirmación; devuelve una promesa para que la fila muestre el spinner.
  const handleDelete = (box) =>
    new Promise((resolve, reject) => {
      Alert.alert(
        'Borrar de la caja',
        `¿Quitar las ${box.qty} unidades de ${item.part_num} (${item.color_name}) de ${box.box}?`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve() },
          { text: 'Borrar', style: 'destructive', onPress: () => doDelete(box).then(resolve, reject) },
        ],
        { cancelable: true, onDismiss: () => resolve() }
      );
    });

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.screen}>
        {/* Cabecera oscura con el botón Volver */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.back, pressed && { opacity: 0.8 }]} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <View style={styles.headRow}>
            <PartImage uri={item.img_url ?? item.part_img_url} size={96} />
            <View style={styles.headInfo}>
              <Text style={styles.name} numberOfLines={3}>
                {item.part_name}
              </Text>
              <View style={styles.numPill}>
                <Text style={styles.num}>{item.part_num}</Text>
              </View>
              <View style={styles.colorRow}>
                <View style={[styles.dot, { backgroundColor: `#${item.rgb}` }]} />
                <Text style={styles.color} numberOfLines={1}>
                  {item.color_name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
          <BrickCard color={colors.accent} edge={colors.accentDark} studs={5} style={styles.totalCard}>
            <Text style={styles.totalLabel}>TOTAL EN TODAS LAS CAJAS</Text>
            <Text style={styles.totalNum}>x{total.toLocaleString('es-ES')}</Text>
          </BrickCard>

          <Text style={styles.section}>
            {boxes.length === 1 ? 'ESTÁ EN 1 CAJA' : `ESTÁ EN ${boxes.length} CAJAS`}
          </Text>

          {boxes.map((b) => (
            <BrickCard key={b.box_id} edge={colors.border} studs={3} style={styles.boxCard}>
              <BoxQuantityRow box={b} onSave={(qty) => handleSave(b, qty)} onDelete={() => handleDelete(b)} />
            </BrickCard>
          ))}

          {usedIn.length > 0 && (
            <>
              <Text style={styles.section}>USADAS EN SETS MONTADOS</Text>
              {usedIn.map((s) => (
                <BrickCard key={s.set_num} color="#E8F0FB" edge={colors.blue} studs={3} style={styles.usedCard}>
                  <View style={styles.usedInfo}>
                    <Text style={styles.usedName} numberOfLines={2}>
                      {s.name}
                    </Text>
                    <Text style={styles.usedNum}>{s.set_num}</Text>
                  </View>
                  <Text style={styles.usedQty}>x{s.qty}</Text>
                </BrickCard>
              ))}
              <Text style={styles.usedFree}>
                {used.toLocaleString('es-ES')} en sets · {Math.max(total - used, 0).toLocaleString('es-ES')} libres
              </Text>
            </>
          )}
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    gap: 18,
  },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backText: { fontSize: 15, fontWeight: '900', color: colors.ink },

  headRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  headInfo: { flex: 1, gap: 8 },
  name: { fontSize: 20, fontWeight: '900', color: '#fff' },
  numPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  num: { fontSize: 13, fontWeight: '900', color: colors.ink, letterSpacing: 0.5 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  color: { flex: 1, fontSize: 15, fontWeight: '700', color: '#C9CBD6' },

  content: { padding: spacing.lg, paddingTop: spacing.xl, gap: 22 },
  totalCard: { alignItems: 'center', paddingVertical: 18 },
  totalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: 'rgba(21,23,30,0.65)' },
  totalNum: { fontSize: 44, fontWeight: '900', color: colors.ink },

  section: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.textMuted, marginBottom: -6 },
  boxCard: { paddingVertical: 4 },

  usedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  usedInfo: { flex: 1, gap: 2 },
  usedName: { fontSize: 15, fontWeight: '800', color: colors.text },
  usedNum: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  usedQty: { fontSize: 22, fontWeight: '900', color: colors.blue },
  usedFree: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
});
