import { StyleSheet, View } from 'react-native';

import { DrinkChip } from '@/components/DrinkChip';
import { Text } from '@/components/Text';
import { DRINK_TYPES, DRINKS, formatFactor, type DrinkType } from '@/lib/hydration';

/** All drinks with default volume and hydration factor (Figma 23). Negative factors in berry. */
export function DrinkGrid({ selected, onSelect }: { selected: DrinkType; onSelect: (t: DrinkType) => void }) {
  return (
    <View style={s.grid}>
      {DRINK_TYPES.map((t) => (
        <View key={t} style={s.cell}>
          <DrinkChip type={t} selected={t === selected} onPress={() => onSelect(t)} />
          <Text variant="label" color={DRINKS[t].factor < 0 ? 'berry' : 'muted'}>
            {`${DRINKS[t].ml} ml · ${formatFactor(DRINKS[t].factor)}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 8, columnGap: 4, width: 342 },
  cell: { width: 82, alignItems: 'center', gap: 2 },
});
