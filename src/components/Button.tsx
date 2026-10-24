import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { colors, type ColorName } from '@/theme/tokens';

export type ButtonStyle = 'Primary' | 'Water' | 'Inverse' | 'Soft' | 'Danger';

const STYLES: Record<ButtonStyle, [bg: ColorName, fg: ColorName]> = {
  Primary: ['ink', 'bg'],
  Water: ['water', 'bg'],
  Inverse: ['bg', 'water'],
  Soft: ['waterPale', 'water'],
  Danger: ['berry', 'bg'],
};

type Props = {
  label: string;
  onPress?: () => void;
  kind?: ButtonStyle;
  size?: 'Medium' | 'Small';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Figma: Button (Style × State × Size). Pressed = 80% fill, Disabled = divider fill + muted label. */
export function Button({ label, onPress, kind = 'Primary', size = 'Medium', disabled, style }: Props) {
  const [bg, fg] = STYLES[kind];
  const h = size === 'Medium' ? 56 : 44;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        { height: h, borderRadius: h / 2, paddingHorizontal: size === 'Medium' ? 32 : 20 },
        { backgroundColor: colors[disabled ? 'divider' : bg], opacity: pressed ? 0.8 : 1 },
        style,
      ]}>
      <Text variant={size === 'Medium' ? 'button' : 'buttonSmall'} color={disabled ? 'muted' : fg}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' } });
