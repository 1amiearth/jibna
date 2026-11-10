import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { NotificationPreview } from '@/components/NotificationPreview';
import { PlayfulMascot } from '@/components/PlayfulMascot';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { formatMl } from '@/lib/hydration';
import { requestPermission } from '@/lib/notifications';
import { useJibna } from '@/store/useJibna';

// The sample reminder drops in a beat after the screen opens, like a real banner.
const BANNER_DELAY = 700;

/** Pre-permission screen shown before the iOS dialog (Figma 16). */
export default function NotificationsPermission() {
  const complete = useJibna((s) => s.completeOnboarding);
  const goal = useJibna((s) => s.goal);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const t = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), BANNER_DELAY);
    return () => clearTimeout(t);
  }, []);

  const finish = (enabled: boolean) => {
    complete(enabled);
    router.replace('/home');
  };
  const allow = async () => {
    setBusy(true);
    const granted = await requestPermission().catch(() => false);
    finish(granted);
  };

  return (
    <Screen bg="waterPale" style={s.content}>
      <View style={s.head}>
        <Text variant="label" color="water">ขั้นตอน 3 จาก 3</Text>
        <Text variant="heading" align="center">ให้น้องจิบเตือนได้ไหม?</Text>
        <Text variant="body" color="muted" align="center" style={s.sub}>
          น้องจิบจะสะกิดเบา ๆ เฉพาะช่วงที่คุณตื่น และเงียบทันทีเมื่อดื่มครบเป้า
        </Text>
      </View>
      {/* Nearly empty → thirsty face and sweat drop; still breathes, blinks and plays when tapped. */}
      <PlayfulMascot percent={15} width={170} label="น้องจิบ คอแห้ง" />
      <View style={s.preview}>
        <Animated.View entering={FadeInUp.delay(BANNER_DELAY).springify().damping(14)}>
          <NotificationPreview remaining={formatMl(goal)} />
        </Animated.View>
        <Text variant="caption" color="muted" align="center">หลังแตะปุ่ม iOS จะถามสิทธิ์อีกครั้ง — กด “อนุญาต”</Text>
      </View>
      <View style={s.actions}>
        <Button label="เปิดการแจ้งเตือน" onPress={allow} disabled={busy} style={s.full} />
        <Pressable onPress={() => finish(false)} hitSlop={12} accessibilityRole="button">
          <Text variant="button" color="muted">ไว้ทีหลัง</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { justifyContent: 'space-between', alignItems: 'center' },
  head: { alignItems: 'center', gap: 6, marginTop: 24 },
  sub: { width: 300 },
  preview: { alignSelf: 'stretch', gap: 12 },
  actions: { alignSelf: 'stretch', alignItems: 'center', gap: 16 },
  full: { alignSelf: 'stretch' },
});
