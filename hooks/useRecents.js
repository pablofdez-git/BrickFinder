import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PARTS_KEY = 'recentParts';
const COLORS_KEY = 'recentColors';
const MAX_PARTS = 20;
const MAX_COLORS = 12;

// Piezas y colores usados recientemente (el más reciente primero), guardados en el móvil.
export default function useRecents() {
  const [recentParts, setRecentParts] = useState([]);
  const [recentColors, setRecentColors] = useState([]);
  const partsRef = useRef([]);
  const colorsRef = useRef([]);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([AsyncStorage.getItem(PARTS_KEY), AsyncStorage.getItem(COLORS_KEY)]);
      partsRef.current = p ? JSON.parse(p) : [];
      colorsRef.current = c ? JSON.parse(c) : [];
      setRecentParts(partsRef.current);
      setRecentColors(colorsRef.current);
    })();
  }, []);

  const addRecentPart = useCallback((part) => {
    const slim = {
      part_num: part.part_num,
      name: part.name,
      part_cat_id: part.part_cat_id,
      img_url: part.img_url ?? null,
    };
    partsRef.current = [slim, ...partsRef.current.filter((x) => x.part_num !== slim.part_num)].slice(0, MAX_PARTS);
    setRecentParts(partsRef.current);
    AsyncStorage.setItem(PARTS_KEY, JSON.stringify(partsRef.current));
  }, []);

  const addRecentColor = useCallback((colorId) => {
    colorsRef.current = [colorId, ...colorsRef.current.filter((x) => x !== colorId)].slice(0, MAX_COLORS);
    setRecentColors(colorsRef.current);
    AsyncStorage.setItem(COLORS_KEY, JSON.stringify(colorsRef.current));
  }, []);

  return { recentParts, recentColors, addRecentPart, addRecentColor };
}
