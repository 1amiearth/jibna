import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { dayKey, dayTotals, formatMl, goalOn, monthGrid, TH_MONTHS, waterDrops } from '@/lib/hydration';
import { useToday } from '@/lib/useToday';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const STREAK_MILESTONE = 10;

function Ring({ percent, size = 236 }: { percent: number; size?: number }) {
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, percent / 100);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.waterPale} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r} stroke={colors.water} strokeWidth={stroke} fill="none"
        strokeDasharray={`${c * p} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

/** Calendar & Streak (Figma 06). Tap a past day to open its log. */
export default function Calendar() {
  const today = useToday();
  const entries = useJibna((s) => s.entries);
  const goals = useJibna((s) => s.goals);
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const isCurrent = month.y === now.getFullYear() && month.m === now.getMonth();
  const shift = (d: number) => setMonth(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const todayKey = dayKey(now);
  const goalFor = (k: string) => goalOn(goals, k, today.goal);
  const drops = waterDrops(entries, goalFor);

  const cell = (key: string | null, i: number) => {
    if (!key) return <View key={i} style={s.cell} />;
    const day = Number(key.slice(8));
    const future = key > todayKey;
    const h = dayTotals(entries, key).hydration;
    const met = h >= goalFor(key);
    const isToday = key === todayKey;
    const bg = isToday ? colors.ink : met ? colors.water : h > 0 ? colors.waterPale : 'transparent';
    const fg = isToday || met ? 'bg' : h > 0 ? 'water' : future ? 'divider' : 'muted';
    return (
      <Pressable
        key={i}
        style={s.cell}
        disabled={future}
        onPress={() => router.push({ pathname: '/day-log', params: { date: key } })}
        accessibilityLabel={`${day} ${TH_MONTHS[month.m]}${met ? ' ดื่มครบ' : ''}`}>
        <View style={[s.dot, { backgroundColor: bg }]}>
          <Text variant="bodyStrong" color={fg}>{day}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll style={s.content}>
      <TopBar right={<IconButton type="close" onPress={() => router.back()} />} />
      <View style={s.ring}>
        <Ring percent={today.percent} />
        <View style={s.ringText}>
          <Text variant="display" color="water" style={s.ringValue}>{`${today.percent}%`}</Text>
          <Text variant="caption" color="muted">ดื่มน้ำวันนี้</Text>
        </View>
      </View>

      <View style={s.monthHeader}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityLabel="เดือนก่อน"><Text variant="heading" color="muted">‹</Text></Pressable>
        <Text variant="title">{`${TH_MONTHS[month.m]} ${month.y}`}</Text>
        <Pressable onPress={() => shift(1)} disabled={isCurrent} hitSlop={12} accessibilityLabel="เดือนถัดไป">
          <Text variant="heading" color={isCurrent ? 'divider' : 'muted'}>›</Text>
        </Pressable>
      </View>
      <View style={s.week}>
        {WEEKDAYS.map((w) => <View key={w} style={s.cell}><Text variant="label" color="muted">{w}</Text></View>)}
      </View>
      {monthGrid(month.y, month.m).map((week, wi) => (
        <View key={wi} style={s.week}>{week.map((k, i) => cell(k, wi * 7 + i))}</View>
      ))}
      <View style={s.legend}>
        {([['water', 'ดื่มครบ'], ['waterPale', 'ดื่มบางส่วน'], ['ink', 'วันนี้']] as const).map(([c, l]) => (
          <View key={l} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: colors[c] }]} />
            <Text variant="label" color="muted">{l}</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Mascot pose={today.streak ? 'Cheer' : 'Calm'} width={58} />
        <View style={s.flex}>
          <Text variant="title">{today.streak ? `ดื่มครบต่อเนื่อง ${today.streak} วัน!` : 'เริ่มสถิติใหม่วันนี้'}</Text>
          <Text variant="label" color="muted">
            {today.streak
              ? `อีก ${STREAK_MILESTONE - (today.streak % STREAK_MILESTONE)} วัน ครบ ${(Math.floor(today.streak / STREAK_MILESTONE) + 1) * STREAK_MILESTONE} วันติด · หยดน้ำสะสม ${formatMl(drops)}`
              : `ดื่มให้ครบเป้าวันนี้ เพื่อเริ่มนับวันต่อเนื่อง · หยดน้ำสะสม ${formatMl(drops)}`}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 8 },
  ring: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  ringText: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: 64, lineHeight: 84 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingRight: 16, borderRadius: 22, backgroundColor: colors.soft, marginTop: 20 },
  flex: { flex: 1 },
});
