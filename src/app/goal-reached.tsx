import { Pressable, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { artSvg } from '@/assets/svg';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { goBack } from '@/lib/goBack';
import { DROPS_PER_GOAL_DAY, formatMl, goalOn, waterDrops } from '@/lib/hydration';
import { useToday } from '@/lib/useToday';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

/** Celebration modal, shown once per day when hydration reaches the goal (Figma 08). */
export default function GoalReached() {
  const { width } = useWindowDimensions();
  const today = useToday();
  const entries = useJibna((s) => s.entries);
  const goals = useJibna((s) => s.goals);
  const drops = waterDrops(entries, (k) => goalOn(goals, k, today.goal));
  const share = () =>
    Share.share({ message: `วันนี้ดื่มน้ำครบ ${formatMl(today.goal)} ml แล้ว! ต่อเนื่อง ${today.streak} วันกับน้องจิบ 💧` }).catch(() => {});

  return (
    <View style={s.fill}>
      <SvgXml xml={artSvg.confetti} width={width} height={(width * 520) / 390} style={s.confetti} />
      <Screen bg="water" style={s.content}>
        <View style={s.head}>
          <Text variant="display" color="bg" align="center">ถึงเป้าแล้ว!</Text>
          <Text variant="bodyStrong" color="bg" align="center">{`วันนี้คุณดื่มน้ำครบ ${formatMl(today.goal)} ml เก่งมาก ๆ`}</Text>
        </View>
        <View style={s.hero}>
          <View style={s.glow} />
          <Mascot pose="Cheer" width={250} />
        </View>
        <View style={s.stats}>
          {[
            [`${today.streak} วัน`, 'ต่อเนื่อง'],
            [`+${DROPS_PER_GOAL_DAY}`, `หยดน้ำ · รวม ${formatMl(drops)}`],
            [`${today.percent}%`, 'ของเป้าหมาย'],
          ].map(([v, l]) => (
            <View key={l} style={s.stat}>
              <Text variant="title" color="bg">{v}</Text>
              <Text variant="label" color="bg">{l}</Text>
            </View>
          ))}
        </View>
        <Button label="แชร์ความสำเร็จ" kind="Inverse" onPress={share} style={s.share} />
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button">
          <Text variant="button" color="bg" align="center">ปิด</Text>
        </Pressable>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.water },
  confetti: { position: 'absolute', top: 0, zIndex: 1 },
  content: { alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  head: { marginTop: 40, gap: 4 },
  hero: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.18)' },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { width: 106, alignItems: 'center', paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
  share: { width: 260 },
});
