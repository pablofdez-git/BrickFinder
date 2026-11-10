import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // cada pantalla pinta su propia cabecera (ScreenHeader)
        tabBarHideOnKeyboard: true, // la barra flotante no se queda encima del teclado
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#8A8D99',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
        tabBarStyle: {
          position: 'absolute', // barra flotante en forma de píldora
          left: 20,
          right: 20,
          bottom: 18,
          height: 66,
          borderRadius: 33,
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="anadir"
        options={{
          title: 'Añadir',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color }) => <Ionicons name="cube" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
