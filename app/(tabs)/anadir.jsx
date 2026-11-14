import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BoxManagerModal from '../../components/BoxManagerModal';
import BoxSelector from '../../components/BoxSelector';
import ColorPicker from '../../components/ColorPicker';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import PartSearch from '../../components/PartSearch';
import PhotoCandidatesSheet from '../../components/PhotoCandidatesSheet';
import QuantityStepper from '../../components/QuantityStepper';
import SaveButton from '../../components/SaveButton';
import ScreenHeader from '../../components/ScreenHeader';
import SessionList from '../../components/SessionList';
import Toast from '../../components/Toast';
import useActiveBox from '../../hooks/useActiveBox';
import useColors from '../../hooks/useColors';
import usePhotoIdentify from '../../hooks/usePhotoIdentify';
import useRecents from '../../hooks/useRecents';
import useSession from '../../hooks/useSession';
import { hapticError, hapticSuccess } from '../../lib/haptics';
import { addToInventory } from '../../lib/inventoryApi';
import { colors, spacing, TAB_BAR_SPACE } from '../../lib/theme';

export default function Anadir() {
  const { boxes, activeBox, selectBox, addBox, reload: reloadBoxes, loading, error } = useActiveBox();
  const [managingBoxes, setManagingBoxes] = useState(false); // gestor de cajas abierto
  const {
    recentParts,
    recentColors,
    addRecentPart,
    addRecentColor,
    removeRecentPart,
    clearRecentParts,
    clearRecentColors,
  } = useRecents();
  const colorsState = useColors();
  const session = useSession();
  const photo = usePhotoIdentify();
  const [part, setPart] = useState(null);
  const [colorId, setColorId] = useState(null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { id, type, text } para el aviso flotante
  const [resetKey, setResetKey] = useState(0);
  const searchRef = useRef(null); // para devolver el foco al buscador tras guardar
  const scrollRef = useRef(null); // para subir al buscador tras guardar

  // Al abrir la app dejamos preseleccionado el último color usado.
  useEffect(() => {
    if (colorId === null && recentColors.length > 0) setColorId(recentColors[0]);
  }, [recentColors, colorId]);

  // Pieza elegida entre las que ha reconocido la foto (y su color, si se eligió uno).
  const handlePhotoPick = (picked, pickedColorId) => {
    setPart(picked);
    if (pickedColorId != null) setColorId(pickedColorId);
    photo.close();
  };

  const missing = [];
  if (!activeBox) missing.push('caja');
  if (!part) missing.push('pieza');
  if (colorId === null) missing.push('color');
  if (!(qty >= 1)) missing.push('cantidad');

  const handleSave = async () => {
    if (saving || missing.length > 0) return;
    setSaving(true);
    try {
      await addToInventory({
        boxId: activeBox.id,
        partNum: part.part_num,
        colorId,
        qty,
        imgUrl: part.img_url ?? null,
      });

      // Recientes: solo cuenta lo que realmente se ha guardado.
      addRecentPart(part);
      addRecentColor(colorId);

      const color = colorsState.colors.find((c) => c.id === colorId);
      const colorName = color?.name ?? '';
      hapticSuccess();
      setToast({ id: Date.now(), type: 'ok', text: `${part.part_num} · ${colorName} · x${qty} en ${activeBox.name}` });

      session.addEntry({
        boxId: activeBox.id,
        boxName: activeBox.name,
        partNum: part.part_num,
        partName: part.name,
        colorId,
        colorName,
        rgb: color?.rgb ?? 'CCCCCC',
        qty,
      });

      // Se mantienen caja y color. Se limpia la pieza, la cantidad vuelve a 1, la pantalla sube
      // hasta el buscador y este recupera el foco.
      setPart(null);
      setQty(1);
      setResetKey((k) => k + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => searchRef.current?.focus(), 250);
    } catch (e) {
      hapticError();
      setToast({ id: Date.now(), type: 'error', text: `No se pudo guardar: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Añadir" subtitle="Mete piezas sin parar" />
      <KeyboardAwareScrollView scrollRef={scrollRef} contentContainerStyle={styles.content}>
        <BoxSelector
          boxes={boxes}
          activeBox={activeBox}
          onSelect={selectBox}
          onCreate={addBox}
          onManage={() => setManagingBoxes(true)}
          loading={loading}
        />
        {!!error && <Text style={styles.error}>No se pudieron cargar las cajas: {error}</Text>}

        <PartSearch
          selected={part}
          onSelect={setPart}
          recents={recentParts}
          inputRef={searchRef}
          resetKey={resetKey}
          onRemoveRecent={removeRecentPart}
          onClearRecents={clearRecentParts}
          onPhoto={photo.start}
        />

        <ColorPicker
          colors={colorsState.colors}
          recentIds={recentColors}
          selectedId={colorId}
          onSelect={setColorId}
          onClearRecents={clearRecentColors}
          loading={colorsState.loading}
          error={colorsState.error}
        />

        <QuantityStepper value={qty} onChange={setQty} />

        <SaveButton onPress={handleSave} saving={saving} missing={missing} />

        <SessionList
          entries={session.entries}
          onUndo={session.undo}
          undoingId={session.undoingId}
          error={session.error}
        />
      </KeyboardAwareScrollView>

      <PhotoCandidatesSheet photo={photo} onPick={handlePhotoPick} onRetry={photo.start} onClose={photo.close} />

      <BoxManagerModal visible={managingBoxes} onClose={() => setManagingBoxes(false)} onChanged={reloadBoxes} />

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: TAB_BAR_SPACE, gap: spacing.xl },
  error: { color: colors.danger, fontWeight: '600' },
});
