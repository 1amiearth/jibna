import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { VESSELS } from '@/components/Vessel';
import { MIX_KINDS, MIXES, type MixKind } from '@/lib/hydration';
import { colors } from '@/theme/tokens';

/** Liquor mix segments: เพียว / ผสมน้ำ / ผสมโซดา / ผสมน้ำ+โซดา (Add Drink, back-dated add). */
export function MixSelector({ value, onChange }: { value: MixKind; onChange: (k: MixKind) => void }) {
  return (
    <View style={s.segments} accessibilityRole="radiogroup" accessibilityLabel="วิธีดื่ม">
      {MIX_KINDS.map((k) => (
        <Pressable
          key={k}
          onPress={() => onChange(k)}
          accessibilityRole="radio"
          accessibilityState={{ checked: k === value }}
          style={[s.segment, k === value && { backgroundColor: VESSELS.Liquor.accent }]}>
          <Text variant="label" color={k === value ? 'bg' : 'muted'} numberOfLines={1} adjustsFontSizeToFit>
            {MIXES[k].label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 22, backgroundColor: colors.soft, alignSelf: 'stretch' },
  segment: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
