import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { BODY, WATER_BACK, WATER_FRONT, waterY, wavePath } from '@/components/Mascot';
import { mascotMood, type MascotMood } from '@/lib/hydration';

const AnimatedPath = Animated.createAnimatedComponent(Path);
type AnimatedViewStyle = React.ComponentProps<typeof Animated.View>['style'];

const INK = '#173A5E';
const LIMB = '#1F4E79';
const BLUSH = '#F29A8E';
const VIEWBOX = '0 0 324 405';

// Pivot points in the 324×405 Figma frame (6:85).
const FEET = [162, 392];
const BELLY = [162, 353];
const EYES = [162, 245.7];
const SHOULDER_L = [56.7, 278.1];
const SHOULDER_R = [267.3, 278.1];
const HEAD = [162, 120];

/** Fired by Home when a drink was just added (id changes per add). */
export type MascotReaction = { id: number; alcohol: boolean };
type Face = MascotMood | 'dizzy';
type Expression = 'wink' | 'joy' | null;
type Trick = 'jump' | 'wink' | 'wave' | 'spin';

const ARM_POSE: Record<Face, number> = { thirsty: -7, happy: 0, celebrate: 120, full: 10, dizzy: 35 };
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const haptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
};

type Props = {
  percent: number;
  width: number;
  reaction?: MascotReaction | null;
  /** Welcome screen: drops in, keeps waving with motion lines, always happy. */
  welcome?: boolean;
};

// Welcome wave: left arm raised up-left (Figma "Pose=Wave"), swinging ±15°.
const WAVE_RAISE = 125;
const DROP_FROM = -520;

/**
 * น้องจิบ, alive: idle breathing, random blinks, arm sway and sloshing water; tap for a random
 * trick (jump, wink, wave, spin) with a haptic. On Home: a happy jump with bubbles after each
 * drink (dizzy face after Beer/Liquor) and a mood that follows progress. On Welcome: drop-in
 * entrance and a waving loop. Reduce Motion → static poses only.
 */
export function PlayfulMascot({ percent, width, reaction, welcome = false }: Props) {
  const reduce = useReducedMotion();
  // Home/Welcome stay mounted under pushed screens and modals: stop the idle loops while covered.
  const focused = useIsFocused();
  const k = width / 324;
  const height = (width * 405) / 324;
  const [dizzy, setDizzy] = useState(false);
  const [expr, setExpr] = useState<Expression>(null);
  const face: Face = welcome ? 'happy' : dizzy ? 'dizzy' : mascotMood(percent);
  const lastTrick = useRef<Trick | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const level = useSharedValue(clamp01(percent / 100));
  const kick = useSharedValue(0);
  const slosh = useSharedValue(0.5);
  const breath = useSharedValue(0);
  const sway = useSharedValue(0.5);
  const blink = useSharedValue(1);
  const jumpY = useSharedValue(welcome && !reduce ? DROP_FROM : 0);
  const raiseL = useSharedValue(welcome ? WAVE_RAISE : 0);
  const waveL = useSharedValue(0);
  const squash = useSharedValue(0);
  const spin = useSharedValue(0);
  const wobble = useSharedValue(0);
  const armBase = useSharedValue(ARM_POSE[face]);
  const waveR = useSharedValue(0);
  const bubbles = useSharedValue(0);
  const twinkle = useSharedValue(0);
  const orbit = useSharedValue(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Water follows the real percent; rises after the Add Drink modal closes.
  useEffect(() => {
    const p = clamp01(percent / 100);
    if (reduce) {
      level.set(p);
      return;
    }
    level.set(withDelay(250, withTiming(p, { duration: 900, easing: Easing.out(Easing.cubic) })));
    kick.set(withDelay(250, withSequence(withTiming(1, { duration: 160 }), withSpring(0, { damping: 3, stiffness: 70 }))));
  }, [percent, reduce, level, kick]);

  // Arms take the pose for the current mood.
  useEffect(() => {
    armBase.set(reduce ? ARM_POSE[face] : withSpring(ARM_POSE[face], { damping: 9 }));
  }, [face, reduce, armBase]);

  // Idle loops.
  useEffect(() => {
    const loops = [breath, sway, slosh, twinkle, orbit];
    if (reduce) {
      loops.forEach((v) => cancelAnimation(v));
      breath.set(0);
      sway.set(0.5);
      slosh.set(0.5);
      return;
    }
    if (!focused) {
      loops.forEach((v) => cancelAnimation(v));
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    breath.set(withRepeat(withTiming(1, { duration: 1600, easing: ease }), -1, true));
    sway.set(withRepeat(withTiming(1, { duration: 2300, easing: ease }), -1, true));
    slosh.set(withRepeat(withTiming(1, { duration: 1900, easing: ease }), -1, true));
    twinkle.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false));
    orbit.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1, false));
  }, [reduce, focused, breath, sway, slosh, twinkle, orbit]);

  // Welcome: fall in from above, land with a squash, then keep waving.
  useEffect(() => {
    if (!welcome) return;
    if (reduce) {
      jumpY.set(0);
      return;
    }
    jumpY.set(withTiming(0, { duration: 620, easing: Easing.in(Easing.quad) }));
    squash.set(withDelay(620, withSequence(withTiming(-1, { duration: 120 }), withTiming(0.5, { duration: 160 }), withSpring(0, { damping: 6 }))));
    waveL.set(withDelay(900, withRepeat(withSequence(withTiming(-16, { duration: 260 }), withTiming(14, { duration: 260 })), -1, true)));
    later(620, () => haptic(Haptics.ImpactFeedbackStyle.Soft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcome, reduce]);

  // Welcome's waving arm loops too: stop while covered, resume when back (the first start is above).
  const blurred = useRef(false);
  useEffect(() => {
    if (!welcome || reduce) return;
    if (!focused) {
      blurred.current = true;
      cancelAnimation(waveL);
    } else if (blurred.current) {
      waveL.set(withRepeat(withSequence(withTiming(-16, { duration: 260 }), withTiming(14, { duration: 260 })), -1, true));
    }
  }, [welcome, reduce, focused, waveL]);

  // Random blink every 3–6 s.
  useEffect(() => {
    if (reduce || !focused) return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        blink.set(withSequence(withTiming(0.1, { duration: 70 }), withTiming(1, { duration: 110 })));
        next();
      }, 3000 + Math.random() * 3000);
    };
    next();
    return () => clearTimeout(t);
  }, [reduce, focused, blink]);

  const jump = (h: number, delay = 0) => {
    squash.set(withDelay(delay, withSequence(
      withTiming(-1, { duration: 110 }),
      withTiming(1, { duration: 160 }),
      withTiming(0, { duration: 220 }),
      withTiming(-0.6, { duration: 90 }),
      withSpring(0, { damping: 6 }),
    )));
    jumpY.set(withDelay(delay + 110, withSequence(
      withTiming(-h, { duration: 260, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
    )));
  };

  // Drink added: happy jump + bubbles, or a short dizzy spell after alcohol.
  const seen = useRef(reaction?.id);
  useEffect(() => {
    if (!reaction || reaction.id === seen.current) return;
    seen.current = reaction.id;
    // Wait for the Add Drink modal to finish closing before reacting.
    later(300, () => {
      haptic(Haptics.ImpactFeedbackStyle.Light);
      if (reaction.alcohol) setDizzy(true);
      else setExpr('joy');
    });
    if (reaction.alcohol) {
      later(3300, () => setDizzy(false));
      if (!reduce) {
        wobble.set(withDelay(300, withSequence(
          withRepeat(withSequence(withTiming(-7, { duration: 180 }), withTiming(7, { duration: 180 })), 7, false),
          withTiming(0, { duration: 200 }),
        )));
      }
      return;
    }
    later(1700, () => setExpr(null));
    if (reduce) return;
    jump(34, 300);
    bubbles.set(0);
    bubbles.set(withDelay(400, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction?.id]);

  const onTap = () => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    const tricks: Trick[] = ['jump', 'wink', 'wave', 'spin'];
    const options = tricks.filter((t) => t !== lastTrick.current);
    const trick = reduce ? 'wink' : options[Math.floor(Math.random() * options.length)];
    lastTrick.current = trick;
    if (trick === 'wink') {
      setExpr('wink');
      later(700, () => setExpr(null));
      if (!reduce) wobble.set(withSequence(withTiming(6, { duration: 150 }), withSpring(0, { damping: 5 })));
    } else if (trick === 'jump') {
      setExpr('joy');
      later(900, () => setExpr(null));
      jump(40);
    } else if (trick === 'wave') {
      waveR.set(withSequence(
        withTiming(-130, { duration: 220 }),
        withRepeat(withSequence(withTiming(-155, { duration: 150 }), withTiming(-110, { duration: 150 })), 3, false),
        withSpring(0, { damping: 8 }),
      ));
    } else {
      jump(46);
      spin.set(withSequence(withDelay(150, withTiming(360, { duration: 520, easing: Easing.inOut(Easing.cubic) })), withTiming(0, { duration: 0 })));
    }
  };

  // ---- animated styles (UI thread) ----
  const origin = (p: number[]) => ({ transformOrigin: [p[0] * k, p[1] * k, 0] }) as ViewStyle;
  const charStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: jumpY.value * k },
      { rotate: `${spin.value + wobble.value}deg` },
      { scaleX: 1 - squash.value * 0.08 },
      { scaleY: 1 + squash.value * 0.08 },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 + jumpY.value / 90),
    transform: [{ scaleX: Math.max(0.2, 1 + jumpY.value / 160) }],
  }));
  const motionStyle = useAnimatedStyle(() => ({
    opacity: jumpY.value < -5 ? 0 : 0.55 + 0.45 * Math.abs(waveL.value / 16),
  }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + breath.value * 0.02 }, { scaleX: 1 - breath.value * 0.008 }] }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));
  const armLStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armBase.value + raiseL.value + waveL.value + (sway.value - 0.5) * 8}deg` }],
  }));
  const armRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-armBase.value + waveR.value - (sway.value - 0.5) * 8}deg` }] }));
  const back = useAnimatedProps(() => ({ d: wavePath(waterY(level.value) - 13, 10, (slosh.value - 0.5) * 8 - kick.value * 12) }));
  const front = useAnimatedProps(() => ({ d: wavePath(waterY(level.value), -10, (0.5 - slosh.value) * 8 + kick.value * 12) }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbit.value * 360}deg` }] }));

  const layer = (children: React.ReactNode, style?: AnimatedViewStyle) => (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height} viewBox={VIEWBOX}>{children}</Svg>
    </Animated.View>
  );

  return (
    <Pressable
      onPress={onTap}
      accessibilityRole="button"
      accessibilityLabel={`น้องจิบ ดื่มแล้ว ${Math.round(percent)}%`}
      accessibilityHint="แตะเพื่อเล่นกับน้องจิบ"
      style={{ width, height }}>
      {layer(<Ellipse cx={162} cy={391.5} rx={116.1} ry={9.45} fill="#EDE6D8" />, [shadowStyle, origin(FEET)])}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, origin(FEET), charStyle]}>
        {layer(<Legs />)}
        <Animated.View style={[StyleSheet.absoluteFill, origin(BELLY), bodyStyle]}>
          {layer(
            <>
              <Defs>
                <ClipPath id="mascot-body">
                  <Path d={BODY} />
                </ClipPath>
              </Defs>
              <Path d={BODY} fill="#EEF3F7" />
              <G clipPath="url(#mascot-body)">
                <AnimatedPath animatedProps={back} fill={WATER_BACK} />
                <AnimatedPath animatedProps={front} fill={WATER_FRONT} />
              </G>
              <Path opacity={0.9} d="M97.2 189C102.6 156.6 121.5 129.6 140.4 108" stroke="white" strokeWidth={12.15} strokeLinecap="round" />
              <Circle opacity={0.55} cx={113.4} cy={310.5} r={6.75} fill="white" />
              <Circle opacity={0.55} cx={216} cy={288.9} r={4.7} fill="white" />
              <Circle opacity={0.45} cx={189} cy={329.4} r={8.1} fill="white" />
              <Cheeks big={face === 'celebrate' || face === 'full' || expr === 'joy'} />
              <Mouth face={face} expr={expr} />
            </>,
          )}
          {layer(<Eyes face={face} expr={expr} />, [origin(EYES), eyesStyle])}
          {!reduce && <Bubbles progress={bubbles} k={k} />}
        </Animated.View>
        {layer(<Arm side="left" />, [origin(SHOULDER_L), armLStyle])}
        {layer(<Arm side="right" />, [origin(SHOULDER_R), armRStyle])}
        {welcome && layer(<MotionLines />, motionStyle)}
      </Animated.View>
      {(face === 'celebrate' || face === 'full') && <Sparkles twinkle={twinkle} k={k} still={reduce} />}
      {face === 'thirsty' && layer(<Path d="M246 150c0 0 10 12 10 18a10 10 0 0 1-20 0c0-6 10-18 10-18z" fill={WATER_BACK} />)}
      {face === 'dizzy' && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, origin(HEAD), reduce ? null : orbitStyle]}>
          <Svg width={width} height={height} viewBox={VIEWBOX}>
            {[0, 120, 240].map((a) => {
              const r = (a * Math.PI) / 180;
              return <Star key={a} x={HEAD[0] + Math.cos(r) * 78} y={HEAD[1] + Math.sin(r) * 26} size={11} color="#FFC857" />;
            })}
          </Svg>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** "Hi!" motion lines beside the raised left hand (as in Figma Pose=Wave). */
function MotionLines() {
  const stroke = { stroke: WATER_FRONT, strokeWidth: 7, strokeLinecap: 'round' as const };
  return (
    <>
      <Path d="M6 214 L22 222" {...stroke} />
      <Path d="M20 186 L30 202" {...stroke} />
    </>
  );
}

function Legs() {
  return (
    <>
      <Path d="M135 337.5L129.6 372.6" stroke={LIMB} strokeWidth={29.7} strokeLinecap="round" />
      <Ellipse cx={121.5} cy={375.3} rx={22.95} ry={14.85} fill={LIMB} />
      <Path d="M189 337.5L194.4 372.6" stroke={LIMB} strokeWidth={29.7} strokeLinecap="round" />
      <Ellipse cx={202.5} cy={375.3} rx={22.95} ry={14.85} fill={LIMB} />
    </>
  );
}

function Arm({ side }: { side: 'left' | 'right' }) {
  return side === 'left' ? (
    <>
      <Path d="M56.7 278.1L35.1 315.9" stroke={LIMB} strokeWidth={29.7} strokeLinecap="round" />
      <Circle cx={35.1} cy={315.9} r={18.9} fill={LIMB} />
    </>
  ) : (
    <>
      <Path d="M267.3 278.1L288.9 315.9" stroke={LIMB} strokeWidth={29.7} strokeLinecap="round" />
      <Circle cx={288.9} cy={315.9} r={18.9} fill={LIMB} />
    </>
  );
}

function Cheeks({ big }: { big: boolean }) {
  const r = big ? 17 : 14.85;
  return (
    <>
      <Circle opacity={0.9} cx={108} cy={270} r={r} fill={BLUSH} />
      <Circle opacity={0.9} cx={216} cy={270} r={r} fill={BLUSH} />
    </>
  );
}

const line = { stroke: INK, strokeWidth: 5.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

function Eye({ cx, kind }: { cx: number; kind: 'open' | 'sparkle' | 'sleepy' | 'happy' | 'dizzy' }) {
  const cy = 245.7;
  if (kind === 'sleepy') return <Path d={`M${cx - 9} ${cy - 1} Q${cx} ${cy + 7} ${cx + 9} ${cy - 1}`} {...line} />;
  if (kind === 'happy') return <Path d={`M${cx - 9} ${cy + 4} Q${cx} ${cy - 8} ${cx + 9} ${cy + 4}`} {...line} />;
  if (kind === 'dizzy') {
    return <Path d={`M${cx} ${cy} m-8 0 a8 8 0 1 0 16 0 a6 6 0 1 0 -12 0 a4 4 0 1 0 8 0`} {...line} strokeWidth={3.5} />;
  }
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={8.8} ry={12.8} fill={INK} />
      {kind === 'sparkle' && <Circle cx={cx - 3} cy={cy - 5} r={3} fill="white" />}
    </>
  );
}

function Eyes({ face, expr }: { face: Face; expr: Expression }) {
  const both =
    expr === 'joy' || face === 'full' ? 'happy' : face === 'thirsty' ? 'sleepy' : face === 'dizzy' ? 'dizzy' : face === 'celebrate' ? 'sparkle' : 'open';
  return (
    <>
      <Eye cx={132.3} kind={both} />
      <Eye cx={191.7} kind={expr === 'wink' ? 'happy' : both} />
    </>
  );
}

function Mouth({ face, expr }: { face: Face; expr: Expression }) {
  if (face === 'dizzy') return <Path d="M144 279 q4.5 -6 9 0 t9 0 t9 0 t9 0" {...line} strokeWidth={5} />;
  if (expr === 'joy' || face === 'celebrate') {
    return (
      <>
        <Path d="M144 270 Q162 298 180 270 Z" fill={INK} />
        <Path d="M154 284 Q162 279 170 284 Q162 291 154 284 Z" fill={BLUSH} />
      </>
    );
  }
  if (face === 'full') return <Path d="M148 275 q7 8 14 0 q7 8 14 0" {...line} />;
  if (face === 'thirsty') return <Path d="M153 280 Q162 274 171 280" {...line} />;
  return <Path d="M143.1 272.7C155.7 284.4 168.3 284.4 180.9 272.7" stroke={INK} strokeWidth={6.75} strokeLinecap="round" fill="none" />;
}

function Star({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const s = size;
  return <Path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={color} />;
}

const SPARKLES = [
  [58, 96, 16],
  [276, 120, 13],
  [250, 44, 10],
  [86, 30, 9],
];

function Sparkles({ twinkle, k, still }: { twinkle: SharedValue<number>; k: number; still: boolean }) {
  return (
    <>
      {SPARKLES.map(([x, y, s], i) => (
        <Sparkle key={i} x={x} y={y} size={s} phase={i / SPARKLES.length} twinkle={twinkle} k={k} still={still} />
      ))}
    </>
  );
}

function Sparkle({ x, y, size, phase, twinkle, k, still }: { x: number; y: number; size: number; phase: number; twinkle: SharedValue<number>; k: number; still: boolean }) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = Math.sin(((twinkle.value + phase) % 1) * Math.PI * 2);
    return { opacity: 0.55 + 0.45 * t, transform: [{ scale: 0.75 + 0.25 * t }] };
  });
  const box = size * 2 * k;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (x - size) * k, top: (y - size) * k, width: box, height: box }, style]}>
      <Svg width={box} height={box} viewBox={`${x - size} ${y - size} ${size * 2} ${size * 2}`}>
        <Star x={x} y={y} size={size} color="#FFC857" />
      </Svg>
    </Animated.View>
  );
}

const BUBBLES = [
  [128, 330, 7],
  [160, 340, 5],
  [192, 326, 8],
  [176, 345, 4],
];

function Bubbles({ progress, k }: { progress: SharedValue<number>; k: number }) {
  return (
    <>
      {BUBBLES.map(([x, y, r], i) => (
        <Bubble key={i} x={x} y={y} r={r} i={i} progress={progress} k={k} />
      ))}
    </>
  );
}

function Bubble({ x, y, r, i, progress, k }: { x: number; y: number; r: number; i: number; progress: SharedValue<number>; k: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, progress.value * 1.3 - i * 0.1));
    return {
      opacity: p === 0 || p === 1 ? 0 : p < 0.15 ? p / 0.15 : 1 - p,
      transform: [{ translateY: -p * (110 + i * 25) * k }, { translateX: Math.sin(p * 6 + i) * 6 * k }],
    };
  });
  return <Animated.View pointerEvents="none" style={[s.bubble, { left: (x - r) * k, top: (y - r) * k, width: r * 2 * k, height: r * 2 * k, borderRadius: r * k }, style]} />;
}

const s = StyleSheet.create({
  bubble: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: 'rgba(77,179,230,0.5)' },
});
