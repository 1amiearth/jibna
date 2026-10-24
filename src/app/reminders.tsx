import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ERROR_ICON, ErrorNote } from '@/components/AmountSheet';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { NotificationPreview } from '@/components/NotificationPreview';
import { Option } from '@/components/Option';
import { Row, RowGroup, Toggle } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Wheel } from '@/components/Wheel';
import { formatMl, fromMin, intervalLabel, reminderTimes, windowInsideWake } from '@/lib/hydration';
import { getPermission, requestPermission, type PermissionState } from '@/lib/notifications';
import { useSheets } from '@/lib/useSheets';
import { useToday } from '@/lib/useToday';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const INTERVALS = [30, 60, 90, 120, 180];
const TIMES = Array.from({ length: 48 }, (_, i) => fromMin(i * 30));

/** Reminders (Figma 07, 17–19): toggles, interval/window pickers, permission-denied banner. */
export default function Reminders() {
  const r = useJibna((s) => s.reminders);
  const set = useJibna((s) => s.setReminders);
  const profile = useJibna((s) => s.profile);
  const today = useToday();
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const sheets = useSheets<'interval' | 'window'>();
  const [draft, setDraft] = useState({ intervalMin: r.intervalMin, start: r.start, end: r.end });

  useFocusEffect(
    useCallback(() => {
      getPermission().then(setPerm).catch(() => setPerm('denied'));
    }, []),
  );

  const denied = perm === 'denied';
  const off = !r.enabled || denied;
  const setEnabled = async (enabled: boolean) => {
    if (enabled && perm === 'undetermined') {
      const ok = await requestPermission().catch(() => false);
      setPerm(ok ? 'granted' : 'denied');
      if (!ok) return;
    }
    set({ enabled });
  };
  const windowOk = windowInsideWake(draft.start, draft.end, profile.wake, profile.sleep);

  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={() => router.back()} />} />
      <View style={s.head}>
        <View style={s.flex}>
          <Text variant="heading">เตือนให้จิบ</Text>
          <Text variant="caption" color="muted">น้องจิบจะแวะมาสะกิดเบา ๆ ไม่ให้คุณลืมดื่มน้ำ</Text>
        </View>
        <Mascot pose={off ? 'Sleep' : 'Calm'} width={110} />
      </View>

      <RowGroup>
        <Row label="เปิดการเตือน" large toggle={{ value: r.enabled && !denied, onChange: setEnabled }} />
        <Row
          label="เตือนทุก" large dim={off} value={intervalLabel(r.intervalMin)} chevron
          onPress={() => { setDraft({ ...draft, intervalMin: r.intervalMin }); sheets.show('interval'); }}
        />
        <Row
          label="ช่วงเวลา" large dim={off} value={`${r.start} – ${r.end}`} chevron
          onPress={() => { setDraft({ ...draft, start: r.start, end: r.end }); sheets.show('window'); }}
        />
        <Row label="เตือนเพิ่มเมื่ออากาศร้อน" large dim={off} toggle={{ value: r.hotBoost, onChange: (hotBoost) => set({ hotBoost }) }} />
        <Row label="หยุดเตือนเมื่อถึงเป้า" large dim={off} divider={false} toggle={{ value: r.stopAtGoal, onChange: (stopAtGoal) => set({ stopAtGoal }) }} />
      </RowGroup>

      {denied ? (
        <View style={s.banner} accessibilityRole="alert">
          <View style={s.bannerHead}>
            <SvgXml xml={ERROR_ICON} width={20} height={20} />
            <Text variant="bodyStrong" color="berry">การแจ้งเตือนถูกปิดอยู่</Text>
          </View>
          <Text variant="caption">น้องจิบเตือนไม่ได้จนกว่าจะเปิดสิทธิ์ใน การตั้งค่า iOS › จิบนะ › การแจ้งเตือน</Text>
          <Button label="เปิดในการตั้งค่า" size="Small" onPress={() => Linking.openSettings()} style={s.left} />
        </View>
      ) : (
        <View style={s.preview}>
          <Text variant="label" color="muted">ตัวอย่างการแจ้งเตือน</Text>
          <NotificationPreview remaining={formatMl(Math.max(0, today.goal - today.hydration))} />
        </View>
      )}

      <View style={[s.sleep, off && { opacity: 0.4 }]}>
        <Mascot pose="Sleep" width={48} />
        <View style={s.flex}>
          <Text variant="title" color="bg">โหมดฝันดี</Text>
          <Text variant="label" color="waterPale">{`ไม่รบกวนช่วง ${profile.sleep} – ${profile.wake}`}</Text>
        </View>
        <Toggle value={r.sleepMode} onChange={(sleepMode) => set({ sleepMode })} disabled={off} />
      </View>

      <Sheet
        visible={sheets.is('interval')} title="เตือนทุก" onCancel={sheets.close}
        onDone={() => { set({ intervalMin: draft.intervalMin }); sheets.close(); }}>
        {INTERVALS.map((m) => (
          <Option
            key={m} label={intervalLabel(m)} extra={`≈ ${reminderTimes(m, r.start, r.end).length} ครั้ง/วัน`}
            selected={draft.intervalMin === m} onPress={() => setDraft({ ...draft, intervalMin: m })}
          />
        ))}
        <Text variant="caption" color="muted" align="center">{`คำนวณจากช่วงเวลา ${r.start}–${r.end}`}</Text>
      </Sheet>

      <Sheet
        visible={sheets.is('window')} title="ช่วงเวลาเตือน" onCancel={sheets.close} doneDisabled={!windowOk}
        onDone={() => { set({ start: draft.start, end: draft.end }); sheets.close(); }}>
        <View style={s.wheels}>
          {(['start', 'end'] as const).map((k) => (
            <View key={k} style={s.wheelCol}>
              <Text variant="bodyStrong" color="muted">{k === 'start' ? 'เริ่ม' : 'สิ้นสุด'}</Text>
              <Wheel label={k === 'start' ? 'เวลาเริ่ม' : 'เวลาสิ้นสุด'} values={TIMES} index={TIMES.indexOf(draft[k])} onChange={(i) => setDraft({ ...draft, [k]: TIMES[i] })} width={140} rows={7} />
            </View>
          ))}
        </View>
        {windowOk ? (
          <Text variant="caption" color="muted" align="center">{`ต้องอยู่ในช่วงตื่น ${profile.wake}–${profile.sleep} (จาก ข้อมูลร่างกาย) · โหมดฝันดีใช้เวลานอนชุดเดียวกัน`}</Text>
        ) : (
          <ErrorNote>{`ช่วงเวลาต้องอยู่ในช่วงตื่น ${profile.wake}–${profile.sleep} และเวลาเริ่มต้องก่อนเวลาสิ้นสุด`}</ErrorNote>
        )}
      </Sheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  banner: { gap: 10, padding: 16, borderRadius: 22, backgroundColor: colors.berryTint },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  left: { alignSelf: 'flex-start' },
  preview: { gap: 10 },
  sleep: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, backgroundColor: colors.navy },
  wheels: { flexDirection: 'row', gap: 24 },
  wheelCol: { alignItems: 'center', gap: 8 },
});
