import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, SvgXml } from 'react-native-svg';

import { artSvg, mascotSvg } from '@/assets/svg';

export type Pose = keyof typeof mascotSvg;

/** Figma: Mascot / น้องจิบ (8 poses, 240×300 artboard). */
export function Mascot({ pose, width }: { pose: Pose; width: number }) {
  return <SvgXml xml={mascotSvg[pose]} width={width} height={width * 1.25} accessibilityLabel="น้องจิบ" />;
}

// Body outline of "Hydration Mascot" (Figma 6:92) in its 324×405 frame.
export const BODY = 'M 125.25 0 C 119.85 43.2 219.75 121.5 229.2 210.6 C 238.65 297 181.95 334.8 114.45 334.8 C 46.95 334.8 -8.4 297 1.05 213.3 C 9.15 132.3 100.95 78.3 125.25 0 Z';
export const BODY_X = 47.545;
export const BODY_TOP = 18.9;
export const BODY_H = 334.8;
export const WATER_BACK = '#8CC8F0';
export const WATER_FRONT = '#4DB3E6';

/** Wavy water surface at height `y`, filled down to the frame bottom. Worklet: also used by the launch splash. */
export function wavePath(y: number, amp: number) {
  'worklet';
  return `M0 ${y} C 81 ${y - amp} 162 ${y + amp} 243 ${y} S 324 ${y - amp} 405 ${y} V 405 H 0 Z`;
}

/** Water surface y for a fill level 0–1. */
export function waterY(level: number) {
  'worklet';
  return BODY_TOP + BODY_H * (1 - level);
}

/** Home mascot whose water level follows `percent` (0–100+). Layers: base → water (clipped to body) → face. */
export function HydrationMascot({ percent, width }: { percent: number; width: number }) {
  const height = (width * 405) / 324;
  const p = Math.min(1, Math.max(0, percent / 100));
  const y = waterY(p);
  return (
    <View style={{ width, height }} accessibilityLabel={`น้องจิบ ดื่มแล้ว ${Math.round(percent)}%`}>
      <SvgXml xml={artSvg.hydrationBase} width={width} height={height} style={StyleSheet.absoluteFill} />
      {p > 0 && (
        <Svg width={width} height={height} viewBox="0 0 324 405" style={StyleSheet.absoluteFill}>
          <Defs>
            <ClipPath id="body">
              <Path d={BODY} transform={`translate(${BODY_X} ${BODY_TOP})`} />
            </ClipPath>
          </Defs>
          <G clipPath="url(#body)">
            <Path d={wavePath(y - 13, 10)} fill={WATER_BACK} />
            <Path d={wavePath(y, -10)} fill={WATER_FRONT} />
          </G>
        </Svg>
      )}
      <SvgXml xml={artSvg.hydrationFace} width={width} height={height} style={StyleSheet.absoluteFill} />
    </View>
  );
}
