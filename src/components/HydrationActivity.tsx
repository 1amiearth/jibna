import { Gauge, HStack, Image, Link, ProgressView, Rectangle, Spacer, Text, UnevenRoundedRectangle, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  progressViewStyle,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type HydrationActivityProps = {
  ml: number;
  goal: number;
  /** Next reminder (epoch ms), or null when reminders are off / done for today. */
  nextAt: number | null;
  /** Start of the wait for the next glass (epoch ms); the ring fills from here to nextAt. */
  fromAt: number | null;
  /** Mon..Sun of this week: 2 = goal met, 1 = drank some, 0 = nothing / future. */
  week: number[];
  /** Today's drinks bottom-up in drinking order: liquid colour and share of the goal (sum <= 1). */
  layers: { c: string; f: number }[];
};

/** Today's progress in the Dynamic Island and on the Lock Screen (iOS only). */
const HydrationActivity = (props: HydrationActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  // Constants must live in here: the bundler serializes only this function body.
  const water = environment.isLuminanceReduced ? '#FFFFFF' : '#4DB2E5';
  const grey = '#C9D3DA';
  const ratio = Math.min(props.ml / Math.max(props.goal, 1), 1);
  const litres = (n: number) => (n / 1000).toFixed(1).replace(/\.0$/, '');
  const days = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
  const now = Date.now();
  const next = props.nextAt != null && props.nextAt > now ? { lower: new Date(now), upper: new Date(props.nextAt) } : null;
  const wait = next ? { lower: new Date(Math.min(props.fromAt ?? now, now)), upper: next.upper } : null;

  // Cup: grey rim, white inside, one band per drink stacked in drinking order (Waterllama-style).
  const glass = (h: number) => {
    const rim = 2.5;
    const gap = 2.5;
    const inner = h - 2 * (rim + gap);
    const filled = props.layers.reduce((sum, l) => sum + l.f, 0);
    return (
      <ZStack alignment="bottom" modifiers={[frame({ width: Math.round(h * 0.82), height: h })]}>
        <UnevenRoundedRectangle topLeadingRadius={3} topTrailingRadius={3} bottomLeadingRadius={10} bottomTrailingRadius={10} modifiers={[foregroundStyle('#B7C3CA')]} />
        <UnevenRoundedRectangle topLeadingRadius={1.5} topTrailingRadius={1.5} bottomLeadingRadius={8} bottomTrailingRadius={8} modifiers={[foregroundStyle('#FFFFFF'), padding({ all: rim })]} />
        <VStack spacing={0} modifiers={[frame({ height: inner * filled }), clipShape('roundedRectangle', 5), padding({ horizontal: rim + gap, bottom: rim + gap })]}>
          {[...props.layers].reverse().map((l, i) => (
            <Rectangle key={i} modifiers={[foregroundStyle(environment.isLuminanceReduced ? '#FFFFFF' : l.c), frame({ height: inner * l.f })]} />
          ))}
        </VStack>
      </ZStack>
    );
  };

  return {
    banner: (
      <VStack spacing={12} modifiers={[padding({ all: 16 }), activityBackgroundTint('#FFFFFF')]}>
        <HStack spacing={12} alignment="top">
          {glass(44)}
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle('#8A97A0')]}>วันนี้</Text>
            <HStack alignment="firstTextBaseline" spacing={4}>
              <Text modifiers={[font({ size: 30, weight: 'bold', design: 'rounded' }), foregroundStyle('#1B2A33')]}>{litres(props.ml)}</Text>
              <Text modifiers={[font({ size: 13 }), foregroundStyle('#8A97A0')]}>{`จาก ${litres(props.goal)} L`}</Text>
            </HStack>
          </VStack>
          <Spacer />
          <VStack alignment="trailing" spacing={2}>
            <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle('#8A97A0')]}>แก้วถัดไป</Text>
            {next ? (
              <HStack spacing={6}>
                <Text timerInterval={next} countsDown modifiers={[font({ size: 24, weight: 'semibold', design: 'rounded' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.6), foregroundStyle(water), frame({ width: 110, alignment: 'trailing' })]} />
                {wait && <ProgressView timerInterval={wait} countsDown={false} modifiers={[progressViewStyle('circular'), tint(water), foregroundStyle(water), font({ size: 9, weight: 'semibold', design: 'rounded' }), monospacedDigit(), frame({ width: 24, height: 24 })]} />}
              </HStack>
            ) : (
              <Text modifiers={[font({ size: 26, weight: 'semibold', design: 'rounded' }), foregroundStyle(grey)]}>—</Text>
            )}
          </VStack>
        </HStack>
        <HStack spacing={10}>
          {props.week.map((d, i) => (
            <VStack key={i} spacing={3}>
              <Image systemName={d === 0 ? 'circle.fill' : 'drop.fill'} size={d === 0 ? 12 : 15} color={d === 2 ? water : d === 1 ? '#9ED3EE' : grey} />
              <Text modifiers={[font({ size: 9 }), foregroundStyle('#8A97A0')]}>{days[i]}</Text>
            </VStack>
          ))}
          <Spacer />
          <Link destination="jibna://add-drink" modifiers={[padding({ horizontal: 14, vertical: 8 }), background('#E3F3FB', shapes.capsule())]}>
            <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(water)]}>+ ดื่ม</Text>
          </Link>
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName="drop.fill" color={water} />,
    compactTrailing: <Text modifiers={[monospacedDigit()]}>{`${litres(props.ml)}L`}</Text>,
    minimal: <Gauge value={ratio} modifiers={[gaugeStyle('circular'), tint(water)]} currentValueLabel={<Image systemName="drop.fill" color={water} size={10} />} />,
    expandedLeading: glass(36),
    expandedTrailing: next ? (
      <Text timerInterval={next} countsDown modifiers={[font({ size: 20, weight: 'semibold', design: 'rounded' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.6), foregroundStyle(water), frame({ width: 92, alignment: 'trailing' })]} />
    ) : (
      <Text>{`${Math.round(ratio * 100)}%`}</Text>
    ),
    expandedCenter: <Text modifiers={[font({ size: 20, weight: 'bold', design: 'rounded' })]}>{`${litres(props.ml)} / ${litres(props.goal)} L`}</Text>,
    expandedBottom: <ProgressView value={ratio} modifiers={[tint(water)]} />,
  };
};

export default createLiveActivity('HydrationActivity', HydrationActivity);
