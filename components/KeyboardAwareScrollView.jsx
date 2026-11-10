import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput } from 'react-native';

const MARGIN = 24; // aire entre el campo y el teclado

// ScrollView que, al abrirse el teclado, desplaza el contenido para que el campo donde
// escribes quede visible. Funciona igual en Android (con o sin redimensionado) e iOS.
// `scrollRef` (opcional): ref externa para que la pantalla pueda llamar a scrollTo.
export default function KeyboardAwareScrollView({ contentContainerStyle, onScroll, scrollRef, ...props }) {
  const ownRef = useRef(null);
  const ref = scrollRef ?? ownRef;
  const scrollY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const revealFocusedInput = (keyboardTop) => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input || !ref.current) return;

      ref.current.measureInWindow((_sx, sy, _sw, sh) => {
        input.measureInWindow((_ix, iy, _iw, ih) => {
          // Zona realmente visible: hasta el borde del scroll o hasta el teclado, lo que llegue antes.
          const visibleBottom = Math.min(sy + sh, keyboardTop) - MARGIN;
          const overflow = iy + ih - visibleBottom;
          if (overflow > 0) ref.current?.scrollTo({ y: scrollY.current + overflow, animated: true });
        });
      });
    };

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Esperamos a que el layout se actualice (padding extra / redimensionado) antes de medir.
      setTimeout(() => revealFocusedInput(e.endCoordinates.screenY), 120);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={(e) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      }}
      // Padding extra mientras hay teclado, para poder desplazar hasta el final.
      contentContainerStyle={[contentContainerStyle, keyboardHeight > 0 && { paddingBottom: keyboardHeight + 40 }]}
      {...props}
    />
  );
}
