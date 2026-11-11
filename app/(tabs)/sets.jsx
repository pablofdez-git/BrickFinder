import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AddSetBar from '../../components/AddSetBar';
import ScreenHeader from '../../components/ScreenHeader';
import SetDetailModal from '../../components/SetDetailModal';
import SetRow from '../../components/SetRow';
import Toast from '../../components/Toast';
import useSets from '../../hooks/useSets';
import { hapticError, hapticSuccess } from '../../lib/haptics';
import { colors, spacing, TAB_BAR_SPACE } from '../../lib/theme';

const RowSeparator = () => <View style={{ height: spacing.md }} />;

export default function Sets() {
  const { sets, loading, refreshing, error, reload, refresh, add, changeStatus, rename, resync, remove } = useSets();
  const [toast, setToast] = useState(null); // { id, type, text }
  // Se guarda solo el número y se busca en la lista, así el detalle se actualiza cuando la lista se recarga.
  const [selectedNum, setSelectedNum] = useState(null);
  const selected = sets.find((s) => s.set_num === selectedNum) ?? null;

  const notify = (type, text) => setToast({ id: Date.now(), type, text });

  // Al volver a la pestaña se actualiza (el progreso cambia si metiste piezas en Añadir).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleAdd(input) {
    try {
      const set = await add(input);
      hapticSuccess();
      notify('ok', `${set.name} añadido`);
    } catch (e) {
      hapticError();
      notify('error', e.message);
      throw e; // para que AddSetBar conserve el texto escrito
    }
  }

  // Cambiar estado y borrar se ejecutan desde el detalle; aquí se avisa del resultado.
  async function handleChangeStatus(setNum, status) {
    try {
      await changeStatus(setNum, status);
      hapticSuccess();
      notify('ok', status === 'montado' ? 'Marcado como montado' : 'Vuelve a estar pendiente');
    } catch (e) {
      hapticError();
      notify('error', `No se pudo cambiar el estado: ${e.message}`);
    }
  }

  // Devuelve true/false para que el detalle sepa si el cambio se guardó.
  async function handleRename(setNum, name) {
    try {
      await rename(setNum, name);
      hapticSuccess();
      notify('ok', 'Nombre cambiado');
      return true;
    } catch (e) {
      hapticError();
      notify('error', `No se pudo cambiar el nombre: ${e.message}`);
      return false;
    }
  }

  // Devuelve true/false para que el detalle sepa si debe recargar sus piezas.
  async function handleResync(setNum) {
    try {
      await resync(setNum);
      hapticSuccess();
      notify('ok', 'Piezas actualizadas');
      return true;
    } catch (e) {
      hapticError();
      notify('error', `No se pudo actualizar: ${e.message}`);
      return false;
    }
  }

  async function handleDelete(setNum) {
    try {
      await remove(setNum);
      notify('ok', 'Set borrado');
      return true;
    } catch (e) {
      hapticError();
      notify('error', `No se pudo borrar: ${e.message}`);
      return false; // el detalle no se cierra si falla
    }
  }

  // Mantener pulsado una tarjeta sigue sirviendo como atajo para borrar.
  function confirmDelete(set) {
    Alert.alert('Borrar set', `¿Borrar "${set.name}" (${set.set_num}) y sus piezas?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => handleDelete(set.set_num) },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Sets" subtitle="¿Qué puedes montar con tus piezas?" />

      <FlatList
        data={sets}
        keyExtractor={(s) => s.set_num}
        renderItem={({ item }) => (
          <SetRow item={item} onPress={(s) => setSelectedNum(s.set_num)} onLongPress={confirmDelete} />
        )}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={RowSeparator}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.listHead}>
            <AddSetBar onAdd={handleAdd} />
            {!!error && <Text style={styles.error}>No se pudieron cargar los sets: {error}</Text>}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            !error && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Aún no hay sets</Text>
                <Text style={styles.emptyText}>Escribe el número de un set arriba (lo tienes en la caja o en Rebrickable).</Text>
              </View>
            )
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />

      {/* `key`: al abrir otro set el modal se crea de nuevo (filtros, botón de subir y piezas vuelven a cero). */}
      <SetDetailModal
        key={selected?.set_num ?? 'cerrado'}
        set={selected}
        toast={toast}
        onClose={() => setSelectedNum(null)}
        onChangeStatus={handleChangeStatus}
        onRename={handleRename}
        onResync={handleResync}
        onDelete={handleDelete}
      />

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_SPACE },
  listHead: { gap: spacing.lg, marginBottom: spacing.xl },
  loader: { marginVertical: spacing.xl },
  error: { color: colors.danger, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
});
