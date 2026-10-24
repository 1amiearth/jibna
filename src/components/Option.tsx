import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/Text';
import { colors, radius } from '@/theme/tokens';

const CHECK = '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#4DB3E6"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

type Props = { label: string; sub?: string; extra?: string; selected: boolean; onPress: () => void };

/** Figma: Option — single-choice card used in bottom-sheet pickers. */
export function Option({ label, sub, extra, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[s.card, selected ? s.selected : s.idle]}>
      <View style={s.text}>
        <Text variant="bodyStrong">{label}</Text>
        {sub ? <Text variant="caption" color="muted">{sub}</Text> : null}
      </View>
      {extra ? <Text variant="caption" color="water">{extra}</Text> : null}
      {selected ? <SvgXml xml={CHECK} width={24} height={24} /> : <View style={s.radio} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.option, alignSelf: 'stretch' },
  idle: { backgroundColor: colors.soft, borderWidth: 2, borderColor: colors.soft },
  selected: { backgroundColor: colors.waterPale, borderWidth: 2, borderColor: colors.water },
  text: { flex: 1, gap: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.divider },
});
