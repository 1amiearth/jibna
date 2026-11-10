import { useEffect } from 'react';
import Animated, {
  type SharedValue,
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { useSvgId, wavePath } from '@/components/Mascot';
import { isBottle, type DrinkType, type MixKind } from '@/lib/hydration';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Shapes in a 405×405 box so the Mascot's wavePath fits unchanged. `top`/`bottom` = liquid range.
// Flat style: no outline or highlight, just the empty vessel and the liquid.
// Paths are absolute: iOS ignores transforms inside <ClipPath>.
const SHAPES = {
  // Wide tapered cup: softly rounded rim, generous bottom corners.
  glass: { body: 'M88 30 H317 Q333 30 331 46 L291 358 Q287 390 255 390 H150 Q118 390 114 358 L74 46 Q72 30 88 30 Z', top: 30, bottom: 390 },
  mug: {
    body: 'M70 110 H270 V340 Q270 390 220 390 H120 Q70 390 70 340 Z',
    handle: 'M270 165 H295 Q335 165 335 205 V255 Q335 295 295 295 H270',
    top: 110,
    bottom: 390,
  },
  // Wide teacup; the handle is a filled band inside the clip, so the tea level shows in it too.
  teacup: {
    body: 'M45 150 H275 Q300 150 300 175 V300 Q300 390 210 390 H110 Q20 390 20 300 V175 Q20 150 45 150 Z',
    ring: 'M296 196 H340 Q385 196 380 240 L372 290 Q365 333 320 333 H296 V313 H320 Q348 313 352 286 L360 240 Q363 216 340 216 H296 Z',
    top: 150,
    bottom: 390,
  },
  bottle: { body: 'M168 40 H237 V95 Q285 125 285 175 V365 Q285 390 260 390 H145 Q120 390 120 365 V175 Q120 125 168 95 Z', top: 40, bottom: 390, cap: true },
  beerMug: {
    body: 'M75 60 H255 V360 Q255 390 225 390 H105 Q75 390 75 360 Z',
    handle: 'M255 120 H290 Q325 120 325 155 V275 Q325 310 290 310 H255',
    top: 60,
    bottom: 390,
  },
  shot: { body: 'M140 210 H265 L250 375 Q249 390 234 390 H171 Q156 390 155 375 Z', top: 210, bottom: 390 },
  highball: { body: 'M128 30 H277 V370 Q277 390 257 390 H148 Q128 390 128 370 Z', top: 30, bottom: 390 },
} as const;

type Shape = { body: string; top: number; bottom: number; handle?: string; ring?: string; cap?: boolean };

/** Per drink: vessel, liquid colour, foam colour (beer only shows it), and a pill colour that holds white text. */
export const VESSELS: Record<DrinkType, { shape: keyof typeof SHAPES; liquid: string; back: string; accent: string }> = {
  Water: { shape: 'glass', liquid: '#4DB3E6', back: '#8CC8F0', accent: '#4DB3E6' },
  ThaiTea: { shape: 'glass', liquid: '#EE9A4D', back: '#F6C08C', accent: '#E07F2C' },
  GreenTea: { shape: 'teacup', liquid: '#9CCB6E', back: '#C5E2A6', accent: '#6EAA43' },
  Coffee: { shape: 'mug', liquid: '#8A5A3B', back: '#B5835F', accent: '#8A5A3B' },
  Milk: { shape: 'bottle', liquid: '#F4EAD5', back: '#E6D9BC', accent: '#6E9CC4' },
  Coconut: { shape: 'glass', liquid: '#DCEBC4', back: '#F0F6E6', accent: '#5CC9A7' },
  Beer: { shape: 'beerMug', liquid: '#F2B33D', back: '#FCE8B2', accent: '#E0A02A' },
  Liquor: { shape: 'shot', liquid: '#C47F35', back: '#DDA866', accent: '#B8722A' },
  Cocoa: { shape: 'mug', liquid: '#7B4A2E', back: '#A9765A', accent: '#7B4A2E' },
  LemonSoda: { shape: 'glass', liquid: '#E4F2A0', back: '#F5FAD6', accent: '#6FA82A' },
  BlackTea: { shape: 'mug', liquid: '#8E4A1C', back: '#B87444', accent: '#8E4A1C' },
};

/** Mixed liquor: tall highball, amber diluted by the mixer. */
const MIXED = { shape: 'highball', liquid: '#E3B373', back: '#F0D3A6', accent: '#B8722A' } as const;

// Soda bubbles: x in the highball, size, phase offset of the rise loop.
const BUBBLES = [
  [160, 7, 0],
  [205, 5, 0.35],
  [245, 8, 0.6],
  [182, 4, 0.8],
  [228, 6, 0.15],
] as const;

/**
 * Drink vessel filled to `level` (0–1) with a gently sloshing surface. Level changes spring.
 * Liquor with a mixer draws a highball (soda adds rising bubbles); water from 600 ml is a bottle.
 */
export function Vessel({ type, level, size, mix, ml }: { type: DrinkType; level: number; size: number; mix?: MixKind; ml?: number }) {
  const reduce = useReducedMotion();
  const mixed = type === 'Liquor' && mix != null && mix !== 'neat';
  const look = mixed ? MIXED : VESSELS[type];
  const { liquid, back, accent } = look;
  // Big water servings (600 ml, 1.5 L) are a bottle, not a glass.
  const shape = ml != null && isBottle(type, ml) ? 'bottle' : look.shape;
  const fizzy = mixed && (mix === 'soda' || mix === 'waterSoda');
  const v: Shape = SHAPES[shape];
  const foam = shape === 'beerMug';
  const id = useSvgId(`vessel-${shape}`);

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

  const rise = useSharedValue(0);
  useEffect(() => {
    if (!fizzy || reduce) {
      cancelAnimation(rise);
      rise.set(0.5);
      return;
    }
    rise.set(0);
    rise.set(withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false));
  }, [fizzy, reduce, rise]);

  const { top, bottom } = v;
  const backProps = useAnimatedProps(() => {
    const y = top + (bottom - top) * (1 - fill.value);
    return { d: wavePath(y - 26, 8, (slosh.value - 0.5) * 10) };
  });
  // A soft, slow surface: low amplitude so it reads as a calm drink, not a wave.
  const frontProps = useAnimatedProps(() => {
    const y = top + (bottom - top) * (1 - fill.value);
    return { d: wavePath(y, -5, (0.5 - slosh.value) * 8) };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 405 405">
      <Defs>
        <ClipPath id={id}>
          <Path d={v.body} />
          {v.ring && <Path d={v.ring} />}
        </ClipPath>
      </Defs>
      {v.handle && <Path d={v.handle} fill="none" stroke="#EDF2F6" strokeWidth={22} strokeLinejoin="round" />}
      {v.cap && <Rect x={160} y={16} width={85} height={30} rx={9} fill={accent} />}
      <Path d={v.body} fill="#EDF2F6" />
      {v.ring && <Path d={v.ring} fill="#EDF2F6" />}
      <G clipPath={`url(#${id})`}>
        {foam && <AnimatedPath animatedProps={backProps} fill={back} />}
        <AnimatedPath animatedProps={frontProps} fill={liquid} />
        {fizzy && BUBBLES.map(([x, r, phase]) => <Bubble key={x} x={x} r={r} phase={phase} top={top} bottom={bottom} fill={fill} rise={rise} />)}
      </G>
    </Svg>
  );
}

/** One soda bubble rising from the bottom to the liquid surface, fading out near the top. */
function Bubble({ x, r, phase, top, bottom, fill, rise }: { x: number; r: number; phase: number; top: number; bottom: number; fill: SharedValue<number>; rise: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const surface = top + (bottom - top) * (1 - fill.value) + 14;
    const t = (rise.value + phase) % 1;
    return { cy: bottom - 12 - t * (bottom - 12 - surface), opacity: 0.85 * (1 - t * t) };
  });
  return <AnimatedCircle cx={x} r={r} fill="#FFFFFF" animatedProps={props} />;
}
