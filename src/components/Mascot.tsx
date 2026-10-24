import { SvgXml } from 'react-native-svg';

import { mascotSvg } from '@/assets/svg';

export type Pose = keyof typeof mascotSvg;

/** Figma: Mascot / น้องจิบ (8 poses, 240×300 artboard). */
export function Mascot({ pose, width }: { pose: Pose; width: number }) {
  return <SvgXml xml={mascotSvg[pose]} width={width} height={width * 1.25} accessibilityLabel="น้องจิบ" />;
}

// Body outline of the Home mascot (Figma 6:92) in absolute 324×405 frame coordinates.
// Kept absolute on purpose: a `transform` on a <ClipPath> child is not honoured on native iOS,
// which clipped away low water levels.
export const BODY =
  'M172.8 18.9C167.4 62.1 267.3 140.4 276.75 229.5C286.2 315.9 229.5 353.7 162 353.7C94.5 353.7 39.15 315.9 48.6 232.2C56.7 151.2 148.5 97.2 172.8 18.9Z';
export const BODY_TOP = 18.9;
export const BODY_H = 334.8;
export const BODY_TIP_X = 172.8;
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
