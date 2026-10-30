import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { drinkSvg } from '@/assets/svg';
import { Text } from '@/components/Text';
import { DRINKS, type DrinkType } from '@/lib/hydration';
import { colors } from '@/theme/tokens';

// Not in the Figma export yet, hand-drawn on the same 48×56 artboard: cocoa mug with marshmallows,
// lemon soda glass with a lemon wheel and bubbles.
const COCOA =
  '<svg width="48" height="56" viewBox="0 0 48 56" fill="none"><path d="M36 26C42.7 26 46 28.7 46 34C46 39.3 42.7 42 36 42" stroke="#9C6644" stroke-width="4"/><path d="M8 20H36V42C36 48.6 32 52 25 52H19C12 52 8 48.6 8 42V20Z" fill="#9C6644"/><path d="M10 20H34V24C34 25.1 33.1 26 32 26H12C10.9 26 10 25.1 10 24V20Z" fill="#5E3A24"/><rect x="13" y="15" width="8" height="7" rx="2" fill="#FFF6EA" stroke="#F2C9D4" stroke-width="1.5"/><rect x="22" y="13" width="8" height="7" rx="2" fill="#FFF6EA" stroke="#F2C9D4" stroke-width="1.5"/><path d="M18 9C16 6.5 16 4.5 18 2M27 8C25 5.5 25 3.5 27 1" stroke="#E2CBB8" stroke-width="2.5" stroke-linecap="round"/></svg>';
const LEMON_SODA =
  '<svg width="48" height="56" viewBox="0 0 48 56" fill="none"><path d="M8 12H38L34.5 52H11.5L8 12Z" fill="#F5FAD6" stroke="#8CC63F" stroke-width="3" stroke-linejoin="round"/><path d="M10 22H36L33.4 49.5H12.6L10 22Z" fill="#E4F2A0"/><circle cx="18" cy="40" r="1.8" fill="white"/><circle cx="25" cy="33" r="1.4" fill="white"/><circle cx="28" cy="43" r="2" fill="white"/><path d="M30 2L25 30" stroke="#E8607A" stroke-width="3" stroke-linecap="round"/><circle cx="37" cy="13" r="8" fill="#FFE066" stroke="#F2C230" stroke-width="2"/><path d="M37 6V20M30 13H44M32 8L42 18M42 8L32 18" stroke="#FFF6C2" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICONS: Record<DrinkType, string> = { ...drinkSvg, Cocoa: COCOA, LemonSoda: LEMON_SODA };

const ADD = '<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#4DB3E6" stroke="#FFFFFF" stroke-width="2"/><path d="M11 6.5v9M6.5 11h9" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/></svg>';

/** Drink illustration from Figma (48×56 artboard), scaled to `width`. */
export function DrinkArt({ type, width = 48 }: { type: DrinkType; width?: number }) {
  return <SvgXml xml={ICONS[type]} width={width} height={(width * 56) / 48} />;
}

type Props = { type: DrinkType; onPress?: () => void; selected?: boolean; showAdd?: boolean };

/**
 * Figma: Drink Chip (Beer, Liquor and the rest; โกโก้ and น้ำมะนาวโซดา added after the Figma export). With `selected` set it's a choice in a picker
 * (VoiceOver: radio "ชาไทย, selected"); without, it's Home's quick-add button ("เพิ่มชาไทย").
 */
export function DrinkChip({ type, onPress, selected, showAdd = true }: Props) {
  const picker = selected !== undefined;
  return (
    <Pressable
      accessibilityRole={picker ? 'radio' : 'button'}
      accessibilityState={picker ? { checked: selected } : undefined}
      accessibilityLabel={picker ? DRINKS[type].label : `เพิ่ม${DRINKS[type].label}`}
      onPress={onPress}
      style={({ pressed }) => [s.chip, selected && s.selected, pressed && { opacity: 0.7 }]}>
      <View style={s.icon}>
        <DrinkArt type={type} />
        {showAdd && <SvgXml xml={ADD} width={22} height={22} style={s.add} />}
      </View>
      <Text variant="label" color="muted" numberOfLines={1}>{DRINKS[type].label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: { width: 76, alignItems: 'center', gap: 6, paddingVertical: 4, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  selected: { backgroundColor: colors.waterPale, borderColor: colors.water },
  icon: { width: 56, height: 64, alignItems: 'center' },
  add: { position: 'absolute', left: 17, top: 46 },
});
