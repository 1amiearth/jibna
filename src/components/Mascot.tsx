import { SvgXml } from 'react-native-svg';

import { useId } from 'react';

import { mascotSvg } from '@/assets/svg';

export type Pose = keyof typeof mascotSvg;

/**
 * Per-instance SVG id. On web every id lives in one document, and screens below in the stack stay
 * mounted, so a fixed clipPath id resolves to a hidden copy and the clip is lost.
 */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

/** Figma: Mascot / น้องจิบ (8 poses, 240×300 artboard). */
export function Mascot({ pose, width }: { pose: Pose; width: number }) {
  return <SvgXml xml={mascotSvg[pose]} width={width} height={width * 1.25} accessibilityLabel="น้องจิบ" />;
}

// Body outline of the Home mascot (hand-drawn wobbly drop) in absolute 324×405 frame coordinates.
// Kept absolute on purpose: a `transform` on a <ClipPath> child is not honoured on native iOS,
// which clipped away low water levels.
export const BODY =
  'M178 24C172 58 196 86 222 118C238 138 262 164 274 196C286 226 288 250 282 274C276 306 258 330 228 344C204 354 180 356 160 354C128 352 92 344 68 322C48 302 40 278 42 252C44 224 58 198 76 174C92 152 112 132 130 108C150 84 170 60 178 24Z';
export const BODY_TOP = 24;
export const BODY_H = 332;
export const BODY_TIP_X = 178;
export const WATER_BACK = '#8CC8F0';
export const WATER_FRONT = '#4DB3E6';

/**
 * Wavy water surface at height `y`, filled down to the frame bottom.
 * `tilt` raises one side and lowers the other (sloshing). Worklet: runs on the UI thread.
 */
export function wavePath(y: number, amp: number, tilt = 0) {
  'worklet';
  const l = y + tilt;
  const r = y - tilt;
  const m = (l + r) / 2;
  return `M0 ${l} C 81 ${l - amp} 162 ${m + amp} 243 ${m} S 324 ${r - amp} 405 ${r} V 405 H 0 Z`;
}

/** Water surface y for a fill level 0–1. */
export function waterY(level: number) {
  'worklet';
  return BODY_TOP + BODY_H * (1 - level);
}
