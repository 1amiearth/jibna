import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { DrinkChip } from '@/components/DrinkChip';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { PlayfulMascot } from '@/components/PlayfulMascot';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { DRINK_TYPES, entriesOn, formatMl, hydrationOf, isAlcohol } from '@/lib/hydration';
import { useToday } from '@/lib/useToday';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const CHECK = (done: boolean) =>
  `<svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="13" fill="${done ? '#5CC9A7' : '#FFFFFF'}" stroke="#5CC9A7" stroke-width="${done ? 0 : 2}"/><path d="M8 13.5l3.2 3.2L18 10" fill="none" stroke="${done ? '#FFFFFF' : '#5CC9A7'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function StreakBadge({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`ดื่มครบต่อเนื่อง ${count} วัน`} style={[s.streak, count === 0 && { opacity: 0.45 }]}>
      <SvgXml xml='<svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" fill="none" stroke="#E3F3FC" stroke-width="3"/><path d="M22 3a19 19 0 1 1-13.4 5.6" fill="none" stroke="#5CC9A7" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="22" r="14" fill="#5CC9A7"/></svg>' width={44} height={44} />
      <Text variant="bodyStrong" color="bg" style={s.streakText}>{count}</Text>
    </Pressable>
  );
}

export default function Home() {
  const { width } = useWindowDimensions();
  const today = useToday();
  const entries = useJibna((s) => s.entries);
  const lastCelebrated = useJibna((s) => s.lastCelebrated);
  const toast = useJibna((s) => s.toast);
  const added = toast?.undo?.kind === 'add' ? toast.undo.entry : null;
  // Dizzy only when the drink cost water overall (same rule as the Add Drink warning), so a
  // well-mixed highball or a beer gets the happy reaction.
  const reaction = toast && added ? { id: toast.id, alcohol: hydrationOf(added) < 0 } : null;
  const markCelebrated = useJibna((s) => s.markCelebrated);

  // Goal Reached modal once per day, when Home regains focus after an add.
  useFocusEffect(
    useCallback(() => {
      if (today.hydration >= today.goal && lastCelebrated !== today.key) {
        markCelebrated(today.key);
        router.push('/goal-reached');
      }
    }, [today.hydration, today.goal, today.key, lastCelebrated, markCelebrated]),
  );

  // Daily challenge: 2 hydrating drinks before 10:00.
  const early = entriesOn(entries, today.key).filter((e) => new Date(e.at).getHours() < 10 && !isAlcohol(e.type)).length;
  const challengeDone = Math.min(early, 2);
  const firstRun = entries.length === 0;

  return (
    <Screen style={s.content}>
      <TopBar
        left={<StreakBadge count={today.streak} onPress={() => router.push('/calendar')} />}
        right={<View style={s.menu}><IconButton type="settings" onPress={() => router.push('/settings')} /></View>}
      />
      <Pressable style={s.head} onPress={() => router.push('/day-log')} accessibilityRole="button" accessibilityHint="ดูรายการวันนี้">
        <Text variant="display" color="water" align="center" style={s.amount}>{`${formatMl(today.hydration)} ml`}</Text>
        <Text variant="caption" color="muted" align="center">
          {today.count === 0
            ? `เริ่มจิบแก้วแรกของวันกันเลย · เป้าหมาย ${formatMl(today.goal)} ml`
            : `ดื่มแล้ว ${today.percent}% ของเป้าหมาย ${formatMl(today.goal)} ml`}
        </Text>
      </Pressable>

      <View style={s.mascot}>
        <PlayfulMascot percent={today.percent} width={Math.min(300, width - 90)} reaction={reaction} />
      </View>

      <View>
        {firstRun && (
          <View style={s.coach} pointerEvents="none">
            <View style={s.bubble}>
              <Text variant="bodyStrong" color="bg">แตะแก้วเพื่อบันทึกน้ำแก้วแรก</Text>
            </View>
            <View style={s.tip} />
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.picker} style={s.pickerWrap}>
          <View style={s.character} accessibilityLabel="น้องจิบ">
            <View style={s.avatar}><Mascot pose="Happy" width={52} /></View>
            <Text variant="label" color="muted">น้องจิบ</Text>
          </View>
          {DRINK_TYPES.map((t) => (
            <DrinkChip key={t} type={t} onPress={() => router.push({ pathname: '/add-drink', params: { type: t } })} />
          ))}
        </ScrollView>
      </View>

      <View style={s.challenge}>
        <SvgXml xml={CHECK(challengeDone === 2)} width={26} height={26} />
        <Text variant="bodyStrong" style={s.flex}>ภารกิจวันนี้: ดื่ม 2 แก้วก่อน 10 โมง</Text>
        <Text variant="button" color="mint">{`${challengeDone}/2`}</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 0, justifyContent: 'space-between' },
  head: { alignItems: 'center', marginTop: -4 },
  amount: { fontSize: 56, lineHeight: 76 },
  mascot: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  streak: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 20 },
  streakText: { position: 'absolute' },
  menu: { marginRight: 20 },
  pickerWrap: { flexGrow: 0 },
  picker: { paddingHorizontal: 14, gap: 4 },
  character: { width: 76, alignItems: 'center', gap: 6, paddingVertical: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  coach: { position: 'absolute', left: 44, top: -58, zIndex: 2, alignItems: 'flex-start' },
  bubble: { backgroundColor: colors.ink, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  tip: { marginLeft: 76, width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.ink },
  challenge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, height: 56, borderRadius: 28, paddingLeft: 16, paddingRight: 18, backgroundColor: '#E3F7F0' },
  flex: { flex: 1 },
});
