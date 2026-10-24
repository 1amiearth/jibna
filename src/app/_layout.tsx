import { Anuphan_400Regular, Anuphan_500Medium, Anuphan_600SemiBold, useFonts as useAnuphan } from '@expo-google-fonts/anuphan';
import { Mitr_500Medium, Mitr_600SemiBold, useFonts as useMitr } from '@expo-google-fonts/mitr';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ToastHost } from '@/components/Toast';
import { useJibna } from '@/store/useJibna';

SplashScreen.preventAutoHideAsync();

function useStoreHydrated() {
  const [done, setDone] = useState(useJibna.persist.hasHydrated());
  useEffect(() => useJibna.persist.onFinishHydration(() => setDone(true)), []);
  return done;
}

export default function RootLayout() {
  const [mitr] = useMitr({ Mitr_500Medium, Mitr_600SemiBold });
  const [anuphan] = useAnuphan({ Anuphan_400Regular, Anuphan_500Medium, Anuphan_600SemiBold });
  const hydrated = useStoreHydrated();
  const ready = mitr && anuphan && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="add-drink" options={{ presentation: 'modal' }} />
        <Stack.Screen name="day-log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="calendar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goal-reached" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
      <ToastHost />
    </View>
  );
}
