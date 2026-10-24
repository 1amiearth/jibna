import { useRef } from 'react';
import { FlatList, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/theme/tokens';

const ROW = 40;

type Props = { values: string[]; index: number; onChange: (i: number) => void; width?: number; rows?: 5 | 7; label?: string };

/** Snap-scrolling wheel picker matching the Figma wheels (water-pale selection band). */
export function Wheel({ values, index, onChange, width = 120, rows = 5, label }: Props) {
  const pad = ((rows - 1) / 2) * ROW;
  const last = useRef(index);
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (i !== last.current) {
      last.current = i;
      onChange(i);
    }
  };
  return (
    <View style={{ width, height: rows * ROW }} accessibilityLabel={label} accessibilityValue={{ text: values[index] }}>
      <View pointerEvents="none" style={[s.band, { top: pad - 2 }]} />
      <FlatList
        data={values}
        keyExtractor={(v, i) => `${i}-${v}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: pad }}
        getItemLayout={(_, i) => ({ length: ROW, offset: ROW * i, index: i })}
        initialScrollIndex={index}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        renderItem={({ item, index: i }) => {
          const d = Math.abs(i - index);
          return (
            <View style={s.row}>
              <Text variant={d === 0 ? 'title' : 'body'} color={d === 0 ? 'ink' : 'muted'} style={{ opacity: [1, 0.8, 0.5, 0.25][Math.min(d, 3)] }}>
                {item}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, height: 44, borderRadius: 12, backgroundColor: colors.waterPale },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center' },
});
