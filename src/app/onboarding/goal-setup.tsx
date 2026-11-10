import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorNote } from '@/components/AmountSheet';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Option } from '@/components/Option';
import { PlayfulMascot } from '@/components/PlayfulMascot';
import { Row } from '@/components/Row';
import { TopBar } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { WaterPanel } from '@/components/WaterPanel';
import { Wheel } from '@/components/Wheel';
import { goBack } from '@/lib/goBack';
import {
  ACTIVITY_ML,
  awakeMinutes,
  calcGoal,
  formatMl,
  fromMin,
  MIN_AWAKE_MIN,
  ML_PER_KG,
  WEATHER_ML,
  WEIGHT_MAX,
  WEIGHT_MIN,
  type Activity,
  type Profile,
  type Sex,
  type Weather,
} from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const SEX: Record<Sex, string> = { female: 'หญิง', male: 'ชาย', other: 'ไม่ระบุ' };
const ACTIVITY: Record<Activity, [string, string]> = {
  low: ['น้อย', 'นั่งทำงานเป็นส่วนใหญ่'],
  mid: ['ปานกลาง', 'ออกกำลังกาย 1–3 วัน/สัปดาห์'],
  high: ['มาก', 'ออกกำลังกาย 4 วันขึ้นไป/สัปดาห์'],
};
const WEATHER: Record<Weather, [string, string]> = {
  normal: ['ปกติ', 'อยู่ในห้องแอร์เป็นส่วนใหญ่'],
  hot: ['ร้อน', 'ออกไปข้างนอกบ้าง'],
  veryHot: ['ร้อนมาก', 'อยู่กลางแจ้งบ่อย หรือหน้าร้อน'],
};
const WEIGHTS = Array.from({ length: WEIGHT_MAX - WEIGHT_MIN + 1 }, (_, i) => String(WEIGHT_MIN + i));
const TIMES = Array.from({ length: 48 }, (_, i) => fromMin(i * 30));

type SheetName = 'sex' | 'weight' | 'activity' | 'weather' | 'sleep' | 'keepCustom' | null;

export default function GoalSetup() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromSettings = from === 'settings';
  const { width } = useWindowDimensions();
  const stored = useJibna((s) => s.profile);
  const setProfile = useJibna((s) => s.setProfile);
  const setGoal = useJibna((s) => s.setGoal);
  const currentGoal = useJibna((s) => s.goal);
  const goalIsCustom = useJibna((s) => s.goalIsCustom);

  const [draft, setDraft] = useState<Profile>(stored);
  const [open, setOpen] = useState<SheetName>(null);
  const [temp, setTemp] = useState<Profile>(stored); // edits inside the open sheet
  const goal = calcGoal(draft);

  const openSheet = (name: SheetName) => {
    setTemp(draft);
    setOpen(name);
  };
  const close = () => setOpen(null);
  const commit = () => {
    setDraft(temp);
    setOpen(null);
  };
  const awake = awakeMinutes(temp.wake, temp.sleep);
  const awakeError = awake < MIN_AWAKE_MIN ? `ช่วงตื่นต้องยาวอย่างน้อย 8 ชม. — ตอนนี้ ${Math.floor(awake / 60)} ชม.` : null;

  const save = (useCalculated: boolean) => {
    setProfile(draft); // keeps a custom goal as is
    if (useCalculated) setGoal(goal, false);
    if (fromSettings) goBack();
    else router.push('/onboarding/notifications');
  };
  // From Settings, don't silently replace a goal the user set by hand.
  const confirm = () => (fromSettings && goalIsCustom && goal !== currentGoal ? setOpen('keepCustom') : save(true));

  return (
    <View style={s.fill}>
      <SafeAreaView edges={['top']} style={s.fill}>
        <ScrollView contentContainerStyle={s.content}>
          <TopBar
            left={<IconButton type="back" onPress={goBack} />}
            right={
              <Pressable onPress={() => router.push({ pathname: '/edit-goal', params: fromSettings ? {} : { next: 'notifications' } })} hitSlop={10}>
                <Text variant="bodyStrong" color="water">กำหนดเอง</Text>
              </Pressable>
            }
          />
          <Text variant="heading" style={s.title}>{'ร่างกายคุณต้องการ\nน้ำวันละเท่าไหร่?'}</Text>
          <Text variant="caption" color="muted">บอกน้องจิบหน่อย จะได้คำนวณเป้าหมายที่พอดีกับคุณ</Text>
          <View style={s.list}>
            <Row label="เพศ" value={SEX[draft.sex]} onPress={() => openSheet('sex')} />
            <Row label="น้ำหนัก" value={`${draft.weightKg} กก.`} onPress={() => openSheet('weight')} />
            <Row label="กิจกรรมต่อวัน" value={ACTIVITY[draft.activity][0]} onPress={() => openSheet('activity')} />
            <Row label="สภาพอากาศ" value={WEATHER[draft.weather][0]} onPress={() => openSheet('weather')} />
            <Row label="ตื่น – นอน" value={`${draft.wake} – ${draft.sleep}`} onPress={() => openSheet('sleep')} divider={false} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={s.panel}>
        <WaterPanel width={width} height={330} style={s.panelBg} />
        <View style={s.mascot}>
          {/* Cheers on a full drop; hops each time the calculated goal changes. */}
          <PlayfulMascot percent={100} width={86} reaction={{ id: goal, alcohol: false }} label="น้องจิบ" />
        </View>
        <SafeAreaView edges={['bottom']} style={s.panelContent}>
          <Text variant="display" color="bg" style={s.goal}>{formatMl(goal)} ml</Text>
          <Text variant="bodyStrong" color="bg">เป้าหมายดื่มน้ำต่อวันของคุณ</Text>
          <Button label="ตั้งเป็นเป้าหมาย" kind="Inverse" onPress={confirm} style={s.cta} />
        </SafeAreaView>
      </View>

      <Sheet visible={open === 'keepCustom'} title="ใช้ค่าที่คำนวณใหม่ไหม?" onCancel={close}>
        <Text variant="body" color="muted" align="center">
          {`ตอนนี้ใช้เป้าหมายที่กำหนดเอง ${formatMl(currentGoal)} ml · จากข้อมูลใหม่คำนวณได้ ${formatMl(goal)} ml`}
        </Text>
        <Button label={`ใช้ ${formatMl(goal)} ml`} onPress={() => save(true)} style={s.full} />
        <Button label={`เก็บ ${formatMl(currentGoal)} ml ไว้`} kind="Soft" onPress={() => save(false)} style={s.full} />
      </Sheet>

      <Sheet visible={open === 'sex'} title="เพศ" onCancel={close} onDone={commit}>
        {(Object.keys(SEX) as Sex[]).map((k) => (
          <Option key={k} label={SEX[k]} sub={k === 'other' ? 'ใช้ค่าเฉลี่ยในการคำนวณ' : undefined} selected={temp.sex === k} onPress={() => setTemp({ ...temp, sex: k })} />
        ))}
      </Sheet>

      <Sheet visible={open === 'weight'} title="น้ำหนัก" onCancel={close} onDone={commit}>
        <View style={s.wheelRow}>
          <Wheel label="น้ำหนัก" values={WEIGHTS} index={temp.weightKg - WEIGHT_MIN} onChange={(i) => setTemp({ ...temp, weightKg: WEIGHT_MIN + i })} rows={7} />
          <Text variant="title">กก.</Text>
        </View>
        <Text variant="caption" color="muted" align="center">
          {`ช่วงที่รองรับ ${WEIGHT_MIN}–${WEIGHT_MAX} กก. · น้ำหนัก × ${ML_PER_KG} ml = ${formatMl(temp.weightKg * ML_PER_KG)} ml (ค่าฐานก่อนบวกกิจกรรมและอากาศ)`}
        </Text>
      </Sheet>

      <Sheet visible={open === 'activity'} title="กิจกรรมต่อวัน" onCancel={close} onDone={commit}>
        {(Object.keys(ACTIVITY) as Activity[]).map((k) => (
          <Option key={k} label={ACTIVITY[k][0]} sub={ACTIVITY[k][1]} extra={`+${ACTIVITY_ML[k]} ml`} selected={temp.activity === k} onPress={() => setTemp({ ...temp, activity: k })} />
        ))}
      </Sheet>

      <Sheet visible={open === 'weather'} title="สภาพอากาศ" onCancel={close} onDone={commit}>
        {(Object.keys(WEATHER) as Weather[]).map((k) => (
          <Option key={k} label={WEATHER[k][0]} sub={WEATHER[k][1]} extra={`+${WEATHER_ML[k]} ml`} selected={temp.weather === k} onPress={() => setTemp({ ...temp, weather: k })} />
        ))}
        <Text variant="caption" color="muted" align="center">
          {`${formatMl(temp.weightKg * ML_PER_KG)} + ${ACTIVITY_ML[temp.activity]} + ${WEATHER_ML[temp.weather]} = ${formatMl(calcGoal(temp))} ml ต่อวัน`}
        </Text>
      </Sheet>

      <Sheet visible={open === 'sleep'} title="ตื่น – นอน" onCancel={close} onDone={commit} doneDisabled={!!awakeError}>
        <View style={s.wheelRow}>
          {(['wake', 'sleep'] as const).map((k) => (
            <View key={k} style={s.wheelCol}>
              <Text variant="bodyStrong" color="muted">{k === 'wake' ? 'ตื่น' : 'นอน'}</Text>
              <Wheel label={k === 'wake' ? 'เวลาตื่น' : 'เวลานอน'} values={TIMES} index={TIMES.indexOf(temp[k])} onChange={(i) => setTemp({ ...temp, [k]: TIMES[i] })} width={140} rows={7} />
            </View>
          ))}
        </View>
        {awakeError ? <ErrorNote>{awakeError}</ErrorNote> : (
          <Text variant="caption" color="muted" align="center">น้องจิบจะเตือนเฉพาะช่วงที่คุณตื่นอยู่ (นอนหลังเที่ยงคืนได้)</Text>
        )}
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, paddingBottom: 300, gap: 8 },
  title: { marginTop: 8 },
  list: { marginTop: 12 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
  panelBg: { position: 'absolute', top: 0 },
  mascot: { position: 'absolute', right: 18, top: -54 },
  panelContent: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingBottom: 16 },
  goal: { fontSize: 56, lineHeight: 76 },
  cta: { width: 260, marginTop: 16 },
  wheelRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  wheelCol: { alignItems: 'center', gap: 8 },
});
