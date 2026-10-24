import { Text as RNText, type TextProps } from 'react-native';

import { colors, type ColorName, type TypeName, type as typeStyles } from '@/theme/tokens';

type Props = TextProps & { variant?: TypeName; color?: ColorName; align?: 'left' | 'center' | 'right' };

export function Text({ variant = 'body', color = 'ink', align, style, ...rest }: Props) {
  return <RNText {...rest} style={[typeStyles[variant], { color: colors[color], textAlign: align }, style]} />;
}
