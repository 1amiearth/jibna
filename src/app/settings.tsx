import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { Row, RowGroup } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { DRINK_TYPES, formatMl, intervalLabel } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

/** Settings hub (Figma 09) — target of the Home menu. */
export default function Settings() {
  const goal = useJibna((s) => s.goal);
  const custom = useJibna((s) => s.goalIsCustom);
  const r = useJibna((s) => s.reminders);

  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={() => router.back()} />} />
      <View style={s.head}>
        <Text variant="heading">ตั้งค่า</Text>
        <Mascot pose="Calm" width={84} />
      </View>

      <View style={s.goal}>
        <View style={s.flex}>
          <Text variant="caption" color="bg">เป้าหมายต่อวัน</Text>
          <Text variant="heading" color="bg">{`${formatMl(goal)} ml`}</Text>
          <Text variant="label" color="waterPale">{custom ? 'กำหนดเอง' : 'คำนวณจากน้ำหนัก กิจกรรม และอากาศ'}</Text>
        </View>
        <Button label="แก้ไข" kind="Inverse" size="Small" onPress={() => router.push('/edit-goal')} />
      </View>

      <View style={s.group}>
        <Text variant="label" color="muted">การใช้งาน</Text>
        <RowGroup>
          <Row label="ข้อมูลร่างกาย" onPress={() => router.push({ pathname: '/onboarding/goal-setup', params: { from: 'settings' } })} />
          <Row label="การเตือน" value={r.enabled ? `ทุก ${intervalLabel(r.intervalMin)}` : 'ปิด'} onPress={() => router.push('/reminders')} />
          <Row label="เครื่องดื่ม" value={`${DRINK_TYPES.length} รายการ`} chevron={false} />
          <Row label="ภาษา" value="ไทย" chevron={false} divider={false} />
        </RowGroup>
      </View>

      <View style={s.group}>
        <Text variant="label" color="muted">อื่น ๆ</Text>
        <RowGroup>
          <Row label="ช่วยเหลือและติดต่อเรา" chevron={false} />
          <Row label="นโยบายความเป็นส่วนตัว" chevron={false} />
          <Row label="เวอร์ชัน" value={Constants.expoConfig?.version ?? '1.0.0'} chevron={false} divider={false} />
        </RowGroup>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 20 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 24, backgroundColor: colors.water },
  flex: { flex: 1 },
  group: { gap: 8 },
});
