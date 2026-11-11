import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BoxManagerRow from './BoxManagerRow';
import OptionSheet from './OptionSheet';
import Toast from './Toast';
import useBoxManager from '../hooks/useBoxManager';
import { hapticError, hapticSuccess } from '../lib/haptics';
import { colors, radius, spacing } from '../lib/theme';

const fmt = (n) => Number(n).toLocaleString('es-ES');
const Separator = () => <View style={{ height: spacing.md }} />;

// Gestor de cajas a pantalla completa: renombrar, mover todo el contenido a otra caja y borrar.
// `onChanged` avisa a la pantalla de que las cajas han cambiado (para que recargue su lista).
export default function BoxManagerModal({ visible, onClose, onChanged }) {
  const insets = useSafeAreaInsets();
  const { boxes, loading, error, reload, rename, remove, move } = useBoxManager(onChanged);
  const [moveFrom, setMoveFrom] = useState(null); // caja de la que se van a mover las piezas
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (visible) reload();
  }, [visible, reload]);

  const notify = (type, text) => setToast({ id: Date.now(), type, text });

  // Ejecuta una acción mostrando el resultado en un aviso.
  async function perform(action, okText, errPrefix) {
    try {
      await action();
      hapticSuccess();
      notify('ok', okText);
    } catch (e) {
      hapticError();
      notify('error', `${errPrefix}: ${e.message}`);
    }
  }

  function confirmMove(from, to) {
    Alert.alert(
      'Mover contenido',
      `¿Mover las ${fmt(from.total_pieces)} piezas de "${from.name}" a "${to.name}"? Si ya tenían la misma pieza y color, se suman. "${from.name}" se quedará vacía.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Mover', onPress: () => perform(() => move(from.id, to.id), `Movido a ${to.name}`, 'No se pudo mover') },
      ]
    );
  }

  function confirmDelete(box) {
    const hasPieces = box.total_pieces > 0;
    Alert.alert(
      hasPieces ? 'Borrar caja con piezas' : 'Borrar caja',
      hasPieces
        ? `"${box.name}" tiene ${fmt(box.total_pieces)} piezas (${fmt(box.distinct_types)} tipos). Si la borras, esas piezas se borran también del inventario.\n\nSi quieres conservarlas, cancela y usa antes el botón de mover.`
        : `¿Borrar la caja vacía "${box.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: hasPieces ? 'Borrar todo' : 'Borrar',
          style: 'destructive',
          onPress: () => perform(() => remove(box.id), 'Caja borrada', 'No se pudo borrar'),
        },
      ]
    );
  }

  // Destinos posibles: todas las cajas menos la de origen.
  const moveOptions = useMemo(
    () => boxes.filter((b) => b.id !== moveFrom?.id).map((b) => ({ key: b.id, label: b.name })),
    [boxes, moveFrom]
  );

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.back, pressed && { opacity: 0.8 }]} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.title}>Gestionar cajas</Text>
          <Text style={styles.subtitle}>Renombra, mueve su contenido o bórralas</Text>
        </View>

        <FlatList
          data={boxes}
          keyExtractor={(b) => String(b.id)}
          renderItem={({ item }) => (
            <BoxManagerRow
              box={item}
              canMove={item.total_pieces > 0 && boxes.length > 1}
              onRename={(name) => rename(item.id, name)}
              onMove={() => setMoveFrom(item)}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={!!error && <Text style={styles.error}>No se pudieron cargar las cajas: {error}</Text>}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : (
              !error && <Text style={styles.empty}>Aún no hay cajas. Crea la primera desde la pestaña Añadir.</Text>
            )
          }
        />

        <OptionSheet
          visible={!!moveFrom}
          title={`Mover el contenido de ${moveFrom?.name ?? ''} a...`}
          options={moveOptions}
          selectedKey={null}
          showAll={false}
          onSelect={(toId) => {
            const to = boxes.find((b) => b.id === toId);
            if (to && moveFrom) confirmMove(moveFrom, to);
          }}
          onClose={() => setMoveFrom(null)}
        />

        <Toast message={toast} />
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
    gap: 6,
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
    marginBottom: 12,
  },
  backText: { fontSize: 15, fontWeight: '900', color: colors.ink },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#A6A9B6', fontSize: 14 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: 30 },
});
