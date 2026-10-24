import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/Text';
import { colors, layout } from '@/theme/tokens';

const CHEVRON = '<svg width="8" height="14" viewBox="0 0 8 14"><path d="M2 2l5 5.5L2 13" fill="none" stroke="#B5C0CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Figma: Toggle. On = mint track, Off = divider track. */
export function Toggle({ value, onChange, disabled, label }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[s.track, { backgroundColor: value ? colors.mint : colors.divider }]}>
      <View style={[s.knob, { left: value ? 22 : 2 }]} />
    </Pressable>
  );
}

type RowProps = {
  label: string;
  value?: string;
  chevron?: boolean;
  divider?: boolean;
  large?: boolean;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  dim?: boolean;
};

/** Figma: Row (Value | Toggle | Link). Pass `toggle` for the Toggle type, `value` for Value. */
export function Row({ label, value, chevron, divider = true, large, onPress, toggle, dim }: RowProps) {
  const showChevron = chevron ?? !!onPress;
  const body = (
    <View style={[s.row, { height: large ? layout.rowHeightLarge : layout.rowHeight, opacity: dim ? 0.4 : 1 }, divider && s.divider]}>
      <Text variant="bodyStrong" style={s.label} numberOfLines={1}>
        {label}
      </Text>
      {toggle ? (
        <Toggle value={toggle.value} onChange={toggle.onChange} disabled={dim} />
      ) : (
        <View style={s.right}>
          {value != null && <Text variant="bodyStrong" color="water">{value}</Text>}
          {showChevron && <SvgXml xml={CHEVRON} width={8} height={14} />}
        </View>
      )}
    </View>
  );
  return onPress && !toggle ? (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={dim} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/** Rounded soft card that groups Rows (Settings, Reminders). */
export function RowGroup({ children }: { children: React.ReactNode }) {
  return <View style={s.group}>{children}</View>;
}

const s = StyleSheet.create({
  track: { width: 51, height: 31, borderRadius: 15.5 },
  knob: {
    position: 'absolute',
    top: 2,
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: colors.bg,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  group: { backgroundColor: colors.soft, borderRadius: 22, paddingHorizontal: 16 },
});
