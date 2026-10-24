import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors, radius } from '@/theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/** Figma: Keypad Key. */
export function KeypadKey({ digit, onPress }: { digit: string; onPress: () => void }) {
  if (!digit) return <View style={s.key} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={digit === '⌫' ? 'ลบ' : digit}
      onPress={onPress}
      style={({ pressed }) => [s.key, s.filled, pressed && { backgroundColor: colors.divider }]}>
      <Text variant="title">{digit}</Text>
    </Pressable>
  );
}

/** 3×4 numeric keypad editing a digit string (max 5 digits). */
export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string) => {
    if (k === '⌫') onChange(value.slice(0, -1));
    else if (value.length < 5) onChange(value === '0' ? k : value + k);
  };
  return (
    <View style={s.grid}>
      {KEYS.map((k, i) => (
        <KeypadKey key={i} digit={k} onPress={() => press(k)} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 332 },
  key: { width: 104, height: 52, borderRadius: radius.key, alignItems: 'center', justifyContent: 'center' },
  filled: { backgroundColor: colors.soft },
});
