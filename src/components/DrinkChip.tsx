import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { drinkSvg } from '@/assets/svg';
import { Text } from '@/components/Text';
import { DRINKS, type DrinkType } from '@/lib/hydration';
import { colors } from '@/theme/tokens';

const ADD = '<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#4DB3E6" stroke="#FFFFFF" stroke-width="2"/><path d="M11 6.5v9M6.5 11h9" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/></svg>';

/** Drink illustration from Figma (48×56 artboard), scaled to `width`. */
export function DrinkArt({ type, width = 48 }: { type: DrinkType; width?: number }) {
  return <SvgXml xml={drinkSvg[type]} width={width} height={(width * 56) / 48} />;
}

type Props = { type: DrinkType; onPress?: () => void; selected?: boolean; showAdd?: boolean };

/** Figma: Drink Chip (8 types incl. Beer, Liquor). */
export function DrinkChip({ type, onPress, selected, showAdd = true }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`เพิ่ม${DRINKS[type].label}`}
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
