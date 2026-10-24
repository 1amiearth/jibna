import { Text as RNText, StyleSheet, useWindowDimensions, type TextProps } from 'react-native';

import { colors, textColors, type ColorName, type TypeName, type as typeStyles } from '@/theme/tokens';

type Props = TextProps & { variant?: TypeName; color?: ColorName; align?: 'left' | 'center' | 'right' };

/** Dynamic Type cap: beyond this, fixed-height layouts (pills, keypad, rows) start to break. */
const MAX_FONT_SCALE = 1.35;

export function Text({ variant = 'body', color = 'ink', align, style, ...rest }: Props) {
  const { fontScale } = useWindowDimensions();
  // Font size follows Dynamic Type; line height must follow too or Thai glyphs clip.
  const lineHeight = StyleSheet.flatten([typeStyles[variant], style])?.lineHeight;
  const scaled = lineHeight ? { lineHeight: lineHeight * Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE) } : null;
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[typeStyles[variant], { color: textColors[color] ?? colors[color], textAlign: align }, style, scaled]}
    />
  );
}
