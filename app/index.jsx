import { Redirect } from 'expo-router';

// Al abrir la app vamos directos a la pestaña "Añadir".
export default function Index() {
  return <Redirect href="/anadir" />;
}
