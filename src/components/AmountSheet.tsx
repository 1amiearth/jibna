import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Button, type ButtonStyle } from '@/components/Button';
import { Keypad } from '@/components/Keypad';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { formatMl } from '@/lib/hydration';
import { colors } from '@/theme/tokens';

export const ERROR_ICON = '<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#E8607A"/><path d="M10 5.5v5.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.3" fill="#fff"/></svg>';

export function ErrorNote({ children }: { children: string }) {
  return (
    <View style={s.error} accessibilityRole="alert">
      <SvgXml xml={ERROR_ICON} width={20} height={20} />
      <Text variant="caption" color="berry" style={s.flex}>{children}</Text>
    </View>
  );
}

type Props = {
  visible: boolean;
  title: string;
  initial: number;
  hint: string;
  /** Returns an error message when the value is out of range, or null. */
  validate: (n: number) => string | null;
  confirmLabel: (n: number) => string;
  confirmKind?: ButtonStyle;
  onConfirm: (n: number) => void;
  onCancel: () => void;
};

/** Keypad sheet for typed amounts (custom drink ml, custom goal). Figma 25 / 25b. */
export function AmountSheet({ visible, title, initial, hint, validate, confirmLabel, confirmKind = 'Water', onConfirm, onCancel }: Props) {
  const [digits, setDigits] = useState(String(initial));
  useEffect(() => {
    if (visible) setDigits(String(initial));
  }, [visible, initial]);
  const n = Number(digits || 0);
  const error = digits ? validate(n) : null;
  return (
    <Sheet visible={visible} title={title} onCancel={onCancel}>
      <View style={s.display}>
        <Text variant="display" color={error ? 'berry' : 'water'}>{formatMl(n)}</Text>
        <Text variant="title" color="muted">ml</Text>
      </View>
      {error ? <ErrorNote>{error}</ErrorNote> : <Text variant="caption" color="muted" align="center">{hint}</Text>}
      <Keypad value={digits} onChange={setDigits} />
      <Button
        label={confirmLabel(n)}
        kind={confirmKind}
        disabled={!digits || !!error}
        onPress={() => onConfirm(n)}
        style={s.full}
      />
    </Sheet>
  );
}

const s = StyleSheet.create({
  display: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', padding: 12, borderRadius: 16, backgroundColor: colors.berryTint },
  flex: { flex: 1 },
  full: { alignSelf: 'stretch' },
});
