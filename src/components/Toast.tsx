import { Fragment, useEffect } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/Text';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const OK = '<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#5CC9A7"/><path d="M6.5 11.5l3 3L15.5 8" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DURATION_MS = 4000;
/** With VoiceOver/TalkBack on, leave time to swipe to เลิกทำ. */
const SCREEN_READER_DURATION_MS = 12000;
// iOS modal screens (Day Log, Calendar) are separate native windows above the root view, so the
// toast draws in a full-window overlay to stay visible (and undoable) over them.
const Overlay = Platform.OS === 'ios' ? FullWindowOverlay : Fragment;

/** Figma: Toast. Global, driven by store.toast; auto-dismisses; เลิกทำ reverts the last add/delete. */
export function ToastHost() {
  const toast = useJibna((s) => s.toast);
  const hide = useJibna((s) => s.hideToast);
  const undo = useJibna((s) => s.undoToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    // accessibilityLiveRegion below is Android-only; announce explicitly for VoiceOver.
    AccessibilityInfo.announceForAccessibility(toast.undo ? `${toast.message} · เลิกทำได้` : toast.message);
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | undefined;
    AccessibilityInfo.isScreenReaderEnabled()
      .catch(() => false)
      .then((on) => {
        if (!cancelled) t = setTimeout(hide, on ? SCREEN_READER_DURATION_MS : DURATION_MS);
      });
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [toast, hide]);

  if (!toast) return null;
  return (
    <Overlay>
      <View pointerEvents="box-none" style={[s.wrap, { bottom: insets.bottom + 16 }]}>
        <View style={s.toast} accessibilityLiveRegion="polite">
          <SvgXml xml={OK} width={22} height={22} />
          <Text variant="bodyStrong" color="bg" style={s.msg} numberOfLines={2}>{toast.message}</Text>
          {toast.undo ? (
            <Pressable onPress={undo} hitSlop={10} accessibilityRole="button">
              <Text variant="bodyStrong" color="sun">เลิกทำ</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Overlay>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingLeft: 16, paddingRight: 18,
    borderRadius: 18, backgroundColor: colors.ink,
    shadowColor: colors.ink, shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  msg: { flex: 1 },
});
