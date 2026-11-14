import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { identifyPart } from '../lib/brickognize';
import { shrinkPhoto } from '../lib/photoPrep';

const IDLE = { status: 'idle', photoUri: null, result: null, error: null };

// Hacer una foto a una pieza y reconocerla.
// status: 'idle' (nada abierto) | 'loading' (analizando) | 'done' (hay result) | 'error' (hay error).
// result: { candidates: [{ part, thumb, score }], colors: [{ color, score }] }.
export default function usePhotoIdentify() {
  const [state, setState] = useState(IDLE);
  const requestId = useRef(0); // si se cierra la hoja mientras analiza, la respuesta se descarta

  const analyze = useCallback(async (uri) => {
    const id = ++requestId.current;
    setState({ status: 'loading', photoUri: uri, result: null, error: null });
    try {
      const result = await identifyPart(await shrinkPhoto(uri));
      if (id === requestId.current) setState({ status: 'done', photoUri: uri, result, error: null });
    } catch (e) {
      if (id === requestId.current) setState({ status: 'error', photoUri: uri, result: null, error: e.message });
    }
  }, []);

  // Pide permiso, abre la cámara y analiza la foto. Si cancelas la cámara, no pasa nada.
  const start = useCallback(async () => {
    const fail = (error) => setState({ ...IDLE, status: 'error', error });
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        fail('Necesito permiso para usar la cámara. Actívalo en los ajustes del móvil.');
        return;
      }
      const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (shot.canceled) return;
      analyze(shot.assets[0].uri);
    } catch (e) {
      fail(`No se pudo abrir la cámara: ${e.message}`);
    }
  }, [analyze]);

  const close = useCallback(() => {
    requestId.current++;
    setState(IDLE);
  }, []);

  return { ...state, start, close };
}
