import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { wavePath } from '@/components/Mascot';
import type { DrinkType } from '@/lib/hydration';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Shapes in a 405×405 box so the Mascot's wavePath fits unchanged. `top`/`bottom` = liquid range,
// `shine` = x of the glass highlight. Paths are absolute: iOS ignores transforms inside <ClipPath>.
const SHAPES = {
  glass: { body: 'M110 30 H295 L277 372 Q276 390 258 390 H147 Q129 390 128 372 Z', top: 30, bottom: 390, shine: 140 },
  mug: {
    body: 'M70 110 H270 V340 Q270 390 220 390 H120 Q70 390 70 340 Z',
    handle: 'M270 165 H295 Q335 165 335 205 V255 Q335 295 295 295 H270',
    top: 110,
    bottom: 390,
    shine: 96,
  },
  bottle: { body: 'M168 40 H237 V95 Q285 125 285 175 V365 Q285 390 260 390 H145 Q120 390 120 365 V175 Q120 125 168 95 Z', top: 40, bottom: 390, shine: 146, cap: true },
  beerMug: {
    body: 'M75 60 H255 V360 Q255 390 225 390 H105 Q75 390 75 360 Z',
    handle: 'M255 120 H290 Q325 120 325 155 V275 Q325 310 290 310 H255',
    top: 60,
    bottom: 390,
    shine: 101,
  },
  shot: { body: 'M140 210 H265 L250 375 Q249 390 234 390 H171 Q156 390 155 375 Z', top: 210, bottom: 390, shine: 166 },
} as const;

type Shape = { body: string; top: number; bottom: number; shine: number; handle?: string; cap?: boolean };

/** Per drink: vessel, liquid colour, back-wave colour (foam for beer), and a pill colour that holds white text. */
export const VESSELS: Record<DrinkType, { shape: keyof typeof SHAPES; liquid: string; back: string; accent: string }> = {
  Water: { shape: 'glass', liquid: '#4DB3E6', back: '#8CC8F0', accent: '#4DB3E6' },
  ThaiTea: { shape: 'glass', liquid: '#EE9A4D', back: '#F6C08C', accent: '#E07F2C' },
  GreenTea: { shape: 'mug', liquid: '#9CCB6E', back: '#C5E2A6', accent: '#6EAA43' },
  Coffee: { shape: 'mug', liquid: '#8A5A3B', back: '#B5835F', accent: '#8A5A3B' },
  Milk: { shape: 'bottle', liquid: '#F4EAD5', back: '#E6D9BC', accent: '#6E9CC4' },
  Coconut: { shape: 'glass', liquid: '#DCEBC4', back: '#F0F6E6', accent: '#5CC9A7' },
  Beer: { shape: 'beerMug', liquid: '#F2B33D', back: '#FCE8B2', accent: '#E0A02A' },
  Liquor: { shape: 'shot', liquid: '#C47F35', back: '#DDA866', accent: '#B8722A' },
};

/** Drink vessel filled to `level` (0–1) with a gently sloshing surface. Level changes spring. */
export function Vessel({ type, level, size }: { type: DrinkType; level: number; size: number }) {
  const reduce = useReducedMotion();
  const { shape, liquid, back, accent } = VESSELS[type];
  const v: Shape = SHAPES[shape];
  const foam = shape === 'beerMug';
  const id = `vessel-${shape}`;

  const fill = useSharedValue(level);
  const slosh = useSharedValue(0.5);
  useEffect(() => {
    fill.set(reduce ? level : withSpring(level, { damping: 14, stiffness: 120 }));
  }, [level, reduce, fill]);
  useEffect(() => {
    if (reduce) {
      cancelAnimation(slosh);
      slosh.set(0.5);
      return;
    }
    slosh.set(withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduce, slosh]);

  const { top, bottom } = v;
  const backProps = useAnimatedProps(() => {
    const y = top + (bottom - top) * (1 - fill.value);
    return { d: wavePath(y - (foam ? 26 : 10), 8, (slosh.value - 0.5) * 10) };
  });
  const frontProps = useAnimatedProps(() => {
    const y = top + (bottom - top) * (1 - fill.value);
    return { d: wavePath(y, -8, (0.5 - slosh.value) * 10) };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 405 405">
      <Defs>
        <ClipPath id={id}>
          <Path d={v.body} />
        </ClipPath>
      </Defs>
      {v.handle && <Path d={v.handle} fill="none" stroke="#D5E1EA" strokeWidth={16} strokeLinejoin="round" />}
      {v.cap && <Rect x={160} y={16} width={85} height={30} rx={9} fill={accent} />}
      <Path d={v.body} fill="#EDF2F6" />
      <G clipPath={`url(#${id})`}>
        <AnimatedPath animatedProps={backProps} fill={back} />
        <AnimatedPath animatedProps={frontProps} fill={liquid} />
        <Path d={`M${v.shine} ${top + 30} V${top + (bottom - top) * 0.5}`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={12} strokeLinecap="round" />
      </G>
      <Path d={v.body} fill="none" stroke="#D5E1EA" strokeWidth={8} strokeLinejoin="round" />
    </Svg>
  );
}
