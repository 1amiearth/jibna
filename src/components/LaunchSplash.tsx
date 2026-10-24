import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, SvgXml } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { artSvg } from '@/assets/svg';
import { BODY, BODY_TOP, BODY_X, WATER_BACK, WATER_FRONT, waterY, wavePath } from '@/components/Mascot';
import { Text } from '@/components/Text';
import { colors } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Must match the native splash in app.json (imageWidth 200, white background, centred)
// so the hand-off from native to JS is pixel-identical.
const W = 200;
const H = (W * 405) / 324;
const DROP = '<svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C14 0 28 17 28 24a14 12 0 0 1-28 0C0 17 14 0 14 0Z" fill="#4DB3E6"/></svg>';
const TIP_X = ((BODY_X + 125.25) / 324) * W; // top of the drop-shaped body
const TIP_Y = (BODY_TOP / 405) * H;

type Timing = { drop: number; fillDelay: number; fill: number; textDelay: number; hold: number; exit: number };
// First open gets the full ~2.3 s intro; returning users a shorter ~1.5 s one.
const FIRST: Timing = { drop: 380, fillDelay: 300, fill: 1200, textDelay: 700, hold: 1900, exit: 400 };
const RETURNING: Timing = { drop: 0, fillDelay: 0, fill: 800, textDelay: 0, hold: 1150, exit: 350 };

type Props = {
  firstOpen: boolean;
  /** First frame painted — hide the native splash now. */
  onShown: () => void;
  /** Exit animation finished — unmount. */
  onDone: () => void;
};

/**
 * Animated launch screen shown over the app: a drop falls into น้องจิบ, water fills the
 * mascot, the app name fades in, then the overlay fades out to reveal onboarding/Home.
 * With Reduce Motion on, only opacity changes (water and name fade in, overlay fades out).
 */
export function LaunchSplash({ firstOpen, onShown, onDone }: Props) {
  const reduceMotion = useReducedMotion();
  const [t] = useState(() => (firstOpen ? FIRST : RETURNING));
  const level = useSharedValue(reduceMotion ? 1 : 0);
  const water = useSharedValue(reduceMotion ? 0 : 1);
  const drop = useSharedValue(0);
  const text = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    const done = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(onDone);
    };
    if (reduceMotion) {
      water.value = withTiming(1, { duration: 300 });
      text.value = withTiming(1, { duration: 300 });
      exit.value = withDelay(900, withTiming(1, { duration: 250 }, done));
      return;
    }
    if (t.drop) drop.value = withTiming(1, { duration: t.drop, easing: Easing.in(Easing.quad) });
    level.value = withDelay(t.fillDelay, withTiming(1, { duration: t.fill, easing: Easing.out(Easing.cubic) }));
    text.value = withDelay(t.textDelay, withTiming(1, { duration: 400 }));
    exit.value = withDelay(t.hold, withTiming(1, { duration: t.exit, easing: Easing.inOut(Easing.quad) }, done));
    // Runs once on mount: shared values are stable refs and timings are fixed at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const back = useAnimatedProps(() => ({ d: wavePath(waterY(level.value) - 13, 10) }));
  const front = useAnimatedProps(() => ({ d: wavePath(waterY(level.value), -10) }));
  const waterStyle = useAnimatedStyle(() => ({ opacity: water.value }));
  const dropStyle = useAnimatedStyle(() => ({
    opacity: drop.value < 0.85 ? 1 : (1 - drop.value) / 0.15, // fades as it lands
    transform: [{ translateY: (drop.value - 1) * 160 }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: reduceMotion ? 0 : (1 - text.value) * 12 }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const mascotStyle = useAnimatedStyle(() => ({ transform: [{ scale: reduceMotion ? 1 : 1 + exit.value * 0.08 }] }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, s.root, rootStyle]}
      onLayout={onShown}
      accessible
      accessibilityLabel="จิบนะ กำลังเปิดแอป">
      <Animated.View style={[{ width: W, height: H }, mascotStyle]}>
        <SvgXml xml={artSvg.hydrationBase} width={W} height={H} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, waterStyle]}>
          <Svg width={W} height={H} viewBox="0 0 324 405">
            <Defs>
              <ClipPath id="splash-body">
                <Path d={BODY} transform={`translate(${BODY_X} ${BODY_TOP})`} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#splash-body)">
              <AnimatedPath animatedProps={back} fill={WATER_BACK} />
              <AnimatedPath animatedProps={front} fill={WATER_FRONT} />
            </G>
          </Svg>
        </Animated.View>
        <SvgXml xml={artSvg.hydrationFace} width={W} height={H} style={StyleSheet.absoluteFill} />
        {t.drop > 0 && !reduceMotion && (
          <Animated.View style={[s.drop, dropStyle]} pointerEvents="none">
            <SvgXml xml={DROP} width={28} height={36} />
          </Animated.View>
        )}
      </Animated.View>
      <Animated.View style={[s.name, textStyle]}>
        <Text variant="display" color="water" align="center" style={s.logo}>จิบนะ</Text>
        <Text variant="caption" color="muted" align="center">เพื่อนตัวน้อยที่ชวนคุณ ดื่มน้ำให้พอ ทุกวัน</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  drop: { position: 'absolute', left: TIP_X - 14, top: TIP_Y - 36 },
  name: { position: 'absolute', top: '50%', marginTop: H / 2 + 12, left: 24, right: 24 },
  logo: { fontSize: 56, lineHeight: 76 },
});
