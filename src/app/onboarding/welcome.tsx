import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

import { artSvg } from '@/assets/svg';
import { Button } from '@/components/Button';
import { PlayfulMascot } from '@/components/PlayfulMascot';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors } from '@/theme/tokens';

const DRIFT = 18; // px the water background drifts sideways

export default function Welcome() {
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const tide = useSharedValue(0);

  useEffect(() => {
    tide.set(reduce ? 0 : withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduce, tide]);

  // Gentle tide: the waves drift sideways and bob, wider than the screen so edges never show.
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (tide.value - 0.5) * 2 * DRIFT }, { translateY: (0.5 - tide.value) * 8 }],
  }));

  return (
    <View style={s.fill}>
      <Animated.View style={[s.waves, { left: -DRIFT * 1.5 }, waveStyle]}>
        <SvgXml xml={artSvg.waves} width={width + DRIFT * 3} height={300} />
      </Animated.View>
      <Screen bg="transparent" style={s.content}>
        <View style={s.hero}>
          <Text variant="display" color="water" align="center" style={s.logo}>จิบนะ</Text>
          <Text variant="body" color="muted" align="center" style={s.tagline}>
            เพื่อนตัวน้อยที่ชวนคุณ ดื่มน้ำให้พอ ทุกวัน
          </Text>
        </View>
        <PlayfulMascot welcome percent={100} width={Math.min(260, width * 0.66)} />
        <View style={s.cta}>
          <View style={s.lang} accessibilityLabel="ภาษา ไทย">
            <Text variant="bodyStrong">ไทย</Text>
          </View>
          <Button label="เริ่มต้นใช้งาน" onPress={() => router.push('/onboarding/goal-setup')} style={s.start} />
        </View>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  waves: { position: 'absolute', bottom: -8 },
  content: { justifyContent: 'space-between', alignItems: 'center' },
  hero: { alignItems: 'center', marginTop: 56, gap: 4 },
  logo: { fontSize: 64, lineHeight: 88 },
  tagline: { width: 240 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 8 },
  lang: { backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 8 },
  start: { alignSelf: 'auto', width: 200 },
});
