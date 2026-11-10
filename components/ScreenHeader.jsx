import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';

// Montoncito de mini-ladrillos: la "firma" visual de la app.
function MiniBricks() {
  return (
    <View style={styles.cluster}>
      <View style={[styles.mini, { backgroundColor: colors.primary, top: 22, left: 0, transform: [{ rotate: '-8deg' }] }]} />
      <View style={[styles.mini, { backgroundColor: colors.blue, top: 6, left: 26, transform: [{ rotate: '6deg' }] }]} />
      <View style={[styles.mini, { backgroundColor: colors.accent, top: 34, left: 38, transform: [{ rotate: '-3deg' }] }]} />
      <View style={[styles.mini, styles.miniSmall, { backgroundColor: colors.green, top: 0, left: 62 }]} />
    </View>
  );
}

export default function ScreenHeader({ title, subtitle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.texts}>
        <Text style={styles.kicker}>BRICKFINDER</Text>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <MiniBricks />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  texts: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 2 },
  subtitle: { color: '#A6A9B6', fontSize: 14, marginTop: 2 },
  cluster: { width: 96, height: 64 },
  mini: { position: 'absolute', width: 34, height: 22, borderRadius: 5 },
  miniSmall: { width: 26, height: 18 },
});
