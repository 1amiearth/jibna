import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/Text';
import { Vessel } from '@/components/Vessel';
import { DRINKS, formatMl, stepSize, vesselFill, type DrinkType, type MixKind } from '@/lib/hydration';

const SWIPE_DISTANCE = 40;
const SWIPE_VELOCITY = 600;

export const selectionHaptic = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

type Props = {
  type: DrinkType;
  index: number;
  /** Typed amount from the keypad, shown instead of a preset until the next step. */
  custom: number | null;
  onChange: (index: number) => void;
  /** Presets to step through instead of the drink's own (mixed liquor: whole-glass totals). */
  sizes?: number[];
  mix?: MixKind;
  /** Tap on the amount: one-tap custom amount (opens the keypad). */
  onAmountPress?: () => void;
};

/**
 * Vessel + amount for Add Drink. Swipe left/right anywhere on it (or tap the side sizes) to
 * step between the drink's presets: snaps one step per swipe, the number slides and pops,
 * the liquid level springs, light haptic per step. VoiceOver: adjustable (swipe up/down).
 */
export function SizePicker({ type, index, custom, onChange, sizes = DRINKS[type].sizes, mix, onAmountPress }: Props) {
  const reduce = useReducedMotion();
  const { height, fontScale } = useWindowDimensions();
  const { label } = DRINKS[type];
  const ml = custom ?? sizes[index];
  const prevI = stepSize(sizes, index, custom, -1);
  const nextI = stepSize(sizes, index, custom, 1);

  const drag = useSharedValue(0);
  const slide = useSharedValue(0);
  const pop = useSharedValue(1);
  // Larger Dynamic Type grows the text around it; give that room back so the add button stays on screen.
  const vessel = Math.min(320, height * 0.42) / Math.min(Math.max(fontScale, 1), 1.35) ** 1.5;

  // Any amount change (swipe, side tap, cycle button, new drink) slides the number in from its side.
  const prevMl = useRef(ml);
  useEffect(() => {
    if (ml === prevMl.current) return;
    const dir = ml > prevMl.current ? 1 : -1;
    prevMl.current = ml;
    if (reduce) return;
    slide.set(withSequence(withTiming(dir, { duration: 0 }), withSpring(0, { damping: 14, stiffness: 180 })));
    pop.set(withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 8 })));
  }, [ml, reduce, slide, pop]);

  const step = (dir: 1 | -1) => {
    const next = stepSize(sizes, index, custom, dir);
    if (next == null) {
      // At the end: small rubber-band nudge, no haptic.
      if (!reduce) drag.set(withSequence(withTiming(-dir * 14, { duration: 90 }), withSpring(0, { damping: 8 })));
      return;
    }
    selectionHaptic();
    onChange(next);
  };

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-18, 18],
    onUpdate: (e) => {
      'worklet';
      drag.set(e.translationX * 0.35);
    },
    onDeactivate: (e) => {
      'worklet';
      drag.set(withSpring(0, { damping: 14 }));
      if (e.translationX < -SWIPE_DISTANCE || e.velocityX < -SWIPE_VELOCITY) scheduleOnRN(step, 1);
      else if (e.translationX > SWIPE_DISTANCE || e.velocityX > SWIPE_VELOCITY) scheduleOnRN(step, -1);
    },
  });

  const artStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value * 0.6 }] }));
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value }] }));
  const numberStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.abs(slide.value) * 0.6,
    transform: [{ translateX: slide.value * 44 }, { scale: pop.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={s.area}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`ขนาด${label}`}
        accessibilityValue={{ text: `${formatMl(ml)} มิลลิลิตร` }}
        accessibilityHint="ปัดขึ้นหรือลงเพื่อเปลี่ยนขนาด"
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
        <Animated.View style={artStyle}>
          <Vessel type={type} mix={mix} ml={ml} level={vesselFill(type, ml, sizes)} size={vessel} />
        </Animated.View>
        <Animated.View style={[s.row, rowStyle]}>
          <Pressable onPress={() => step(-1)} disabled={prevI == null} hitSlop={12} style={s.side}>
            <Text variant="title" color="chevron">{prevI == null ? '' : sizes[prevI]}</Text>
          </Pressable>
          <Pressable onPress={onAmountPress} disabled={!onAmountPress}>
            <Animated.View style={[s.amount, numberStyle]}>
              <Text variant="display" align="center">{`${formatMl(ml)} ml`}</Text>
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => step(1)} disabled={nextI == null} hitSlop={12} style={s.side}>
            <Text variant="title" color="chevron">{nextI == null ? '' : sizes[nextI]}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  area: { alignSelf: 'stretch', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 4 },
  side: { width: 56, alignItems: 'center' },
  amount: { minWidth: 170 },
});
