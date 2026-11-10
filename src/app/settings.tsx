import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { IconButton } from '@/components/IconButton';
import { PlayfulMascot } from '@/components/PlayfulMascot';
import { Row, RowGroup } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { goBack } from '@/lib/goBack';
import { DRINK_TYPES, formatMl, intervalLabel } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

/** Settings hub (Figma 09) — target of the Home menu. */
export default function Settings() {
  const goal = useJibna((s) => s.goal);
  const custom = useJibna((s) => s.goalIsCustom);
  const r = useJibna((s) => s.reminders);
  const hiddenCount = useJibna((s) => s.hiddenDrinks.length);

  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={goBack} />} />
      <View style={s.head}>
        <Text variant="heading">ตั้งค่า</Text>
        <PlayfulMascot percent={60} width={84} label="น้องจิบ" />
      </View>

      <Pressable
        onPress={() => router.push('/edit-goal')}
        accessibilityRole="button"
        accessibilityLabel={`เป้าหมายต่อวัน ${formatMl(goal)} มิลลิลิตร`}
        accessibilityHint="แตะเพื่อแก้ไขเป้าหมาย"
        style={({ pressed }) => [s.goal, pressed && s.pressed]}>
        <View style={s.flex}>
          <Text variant="display" color="bg" style={s.goalNumber}>{`${formatMl(goal)} ml`}</Text>
          <Text variant="bodyStrong" color="bg">เป้าหมายต่อวัน</Text>
          <Text variant="caption" color="waterPale">{custom ? 'กำหนดเอง · แตะเพื่อแก้ไข' : 'คำนวณจากน้ำหนัก กิจกรรม และอากาศ'}</Text>
        </View>
        <SvgXml xml={CHEVRON_WHITE} width={10} height={18} />
      </Pressable>

      <View style={s.list}>
        <Card label="การเตือน" value={r.enabled ? `ทุก ${intervalLabel(r.intervalMin)}` : 'ปิด'} onPress={() => router.push('/reminders')} />
        <Card label="ข้อมูลร่างกาย" onPress={() => router.push({ pathname: '/onboarding/goal-setup', params: { from: 'settings' } })} />
        <Card label="เครื่องดื่ม" value={`แสดง ${DRINK_TYPES.length - hiddenCount}/${DRINK_TYPES.length}`} onPress={() => router.push('/drinks')} />
        <Card label="สำรองข้อมูล" onPress={() => router.push('/backup')} />
        <Card label="ภาษา" value="ไทย" chevron={false} />
      </View>

      <View style={s.rule} />

      <View style={s.list}>
        <Card label="ช่วยเหลือ" onPress={() => router.push('/help')} />
        <Card label="นโยบายความเป็นส่วนตัว" onPress={() => router.push('/privacy')} />
      </View>

      <View style={s.footer}>
        <Text variant="caption" color="water">ทำด้วยใจ ให้คุณดื่มน้ำพอทุกวัน</Text>
        <Text variant="caption" color="muted">{`เวอร์ชัน ${Constants.expoConfig?.version ?? '1.0.0'}`}</Text>
      </View>
    </Screen>
  );
}

/** Each setting is its own soft card (Waterllama-style list), not one grouped table. */
function Card(props: React.ComponentProps<typeof Row>) {
  return (
    <RowGroup>
      <Row divider={false} {...props} />
    </RowGroup>
  );
}

const CHEVRON_WHITE = '<svg width="10" height="18" viewBox="0 0 10 18"><path d="M2 2l6 7-6 7" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const s = StyleSheet.create({
  content: { gap: 16, paddingBottom: 32 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 24, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.water },
  goalNumber: { fontSize: 44, lineHeight: 60 },
  pressed: { opacity: 0.85 },
  flex: { flex: 1 },
  list: { gap: 8 },
  rule: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  footer: { alignItems: 'center', gap: 4, marginTop: 8 },
});
