import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const W = 390;
const H = 330;

/** Sine wave surface in the 390×330 box, filled to the bottom. Worklet: runs on the UI thread. */
function wave(y0: number, amp: number, length: number, phase: number) {
  'worklet';
  let d = `M0 ${y0 + amp * Math.sin(phase)}`;
  for (let x = 10; x <= W; x += 10) d += ` L${x} ${y0 + amp * Math.sin((x / length) * Math.PI * 2 + phase)}`;
  return `${d} V${H} H0 Z`;
}

/** Water panel behind a bottom CTA (Figma waterPanel): two waves drifting in opposite directions. */
export function WaterPanel({ width, height, style }: { width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const focused = useIsFocused();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduce || !focused) {
      cancelAnimation(t);
      return;
    }
    t.set(0);
    t.set(withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false));
  }, [reduce, focused, t]);

  const back = useAnimatedProps(() => ({ d: wave(36, 16, W, t.value * Math.PI * 2) }));
  const front = useAnimatedProps(() => ({ d: wave(74, 11, W * 0.75, -t.value * Math.PI * 4) }));

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={style}>
      <AnimatedPath animatedProps={back} fill="#4DB3E6" />
      <AnimatedPath animatedProps={front} fill="#45A6D8" opacity={0.6} />
    </Svg>
  );
}
