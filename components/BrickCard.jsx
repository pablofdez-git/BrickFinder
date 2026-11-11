import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow } from '../lib/theme';

// Tarjeta con forma de ladrillo: tetones arriba y borde inferior oscuro que da volumen.
// Si recibe onPress se "hunde" al pulsarla, como un ladrillo al encajarlo.
export default function BrickCard({
  children,
  onPress,
  onLongPress,
  color = colors.card,
  edge = colors.border,
  studs = 4,
  style,
}) {
  return (
    <View>
      <View style={styles.studRow} pointerEvents="none">
        {Array.from({ length: studs }).map((_, i) => (
          <View key={i} style={[styles.stud, { backgroundColor: color, borderColor: edge }]} />
        ))}
      </View>
      <Pressable
        disabled={!onPress && !onLongPress}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.body,
          { backgroundColor: color, borderBottomColor: edge },
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  studRow: {
    height: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 22,
  },
  stud: {
    width: 30,
    height: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  body: {
    borderRadius: radius.lg,
    borderBottomWidth: 6,
    padding: 16,
    ...shadow,
  },
  pressed: {
    transform: [{ translateY: 3 }],
    borderBottomWidth: 3,
    marginBottom: 3,
  },
});
