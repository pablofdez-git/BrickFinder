import * as Haptics from 'expo-haptics';

// Vibración corta de feedback. Si el dispositivo no la soporta, simplemente no hace nada.
const safe = (fn) => () => {
  try {
    fn();
  } catch {
    /* sin vibración disponible */
  }
};

export const hapticSuccess = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticError = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
export const hapticTap = safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
