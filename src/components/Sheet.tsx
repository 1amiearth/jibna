import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { useJibna } from '@/store/useJibna';
import { colors, radius } from '@/theme/tokens';

type HeaderProps = {
  title: string;
  onCancel: () => void;
  cancelLabel?: string;
  onDone?: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
};

/** Figma: Sheet Header — grabber + Cancel / Title / Done (fixed side slots keep the title centred). */
export function SheetHeader({ title, onCancel, cancelLabel = 'ยกเลิก', onDone, doneLabel = 'เสร็จ', doneDisabled }: HeaderProps) {
  return (
    <View style={s.header}>
      <View style={s.grabber} />
      <View style={s.bar}>
        <Pressable onPress={onCancel} style={s.side} accessibilityRole="button">
          <Text variant="bodyStrong" color="muted">{cancelLabel}</Text>
        </Pressable>
        <Text variant="title" align="center" style={s.title} numberOfLines={1}>{title}</Text>
        <Pressable onPress={onDone} disabled={!onDone || doneDisabled} style={[s.side, s.right]} accessibilityRole="button">
          {onDone ? <Text variant="bodyStrong" color={doneDisabled ? 'divider' : 'water'}>{doneLabel}</Text> : null}
        </Pressable>
      </View>
    </View>
  );
}

type SheetProps = HeaderProps & { visible: boolean; children: React.ReactNode };

/** Bottom sheet: scrim + white panel with SheetHeader. Tapping the scrim cancels. */
export function Sheet({ visible, children, ...header }: SheetProps) {
  const insets = useSafeAreaInsets();
  // The toast draws above everything (incl. this Modal); opening a sheet means the user moved on.
  const hideToast = useJibna((s) => s.hideToast);
  useEffect(() => {
    if (visible) hideToast();
  }, [visible, hideToast]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={header.onCancel}>
      <View style={s.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={header.onCancel} accessibilityLabel="ปิด" />
        <View style={[s.panel, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
          <SheetHeader {...header} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  panel: { backgroundColor: colors.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 24, gap: 16, alignItems: 'center' },
  header: { alignSelf: 'stretch', alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 4 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.divider },
  bar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  side: { width: 80, paddingVertical: 4 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1 },
});
