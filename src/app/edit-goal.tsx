import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { AmountSheet, ErrorNote } from '@/components/AmountSheet';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { Row } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { calcGoal, formatMl, GOAL_MAX, GOAL_MIN, GOAL_STEP, isValidGoal } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const step = (sign: '+' | '−', disabled: boolean) =>
  `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="${disabled ? '#E7EDF2' : '#E3F3FC'}"/><path d="${sign === '+' ? 'M28 18v20M18 28h20' : 'M18 28h20'}" stroke="${disabled ? '#B5C0CC' : '#4DB3E6'}" stroke-width="3.2" stroke-linecap="round"/></svg>`;

const rangeError = (n: number) =>
  n > GOAL_MAX
    ? `เป้าหมายต้องอยู่ระหว่าง ${formatMl(GOAL_MIN)}–${formatMl(GOAL_MAX)} ml ต่อวัน การดื่มน้ำมากเกินไปในวันเดียวอาจเป็นอันตราย`
    : n < GOAL_MIN
      ? `เป้าหมายต้องอยู่ระหว่าง ${formatMl(GOAL_MIN)}–${formatMl(GOAL_MAX)} ml ต่อวัน`
      : null;

/** Custom daily goal (Figma 10 / 10b). `?next=notifications` continues onboarding after saving. */
export default function EditGoal() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const goal = useJibna((s) => s.goal);
  const profile = useJibna((s) => s.profile);
  const setGoal = useJibna((s) => s.setGoal);
  const [value, setValue] = useState(goal);
  const [typing, setTyping] = useState(false);
  const recommended = calcGoal(profile);
  const error = rangeError(value);

  const save = () => {
    setGoal(value, value !== recommended);
    if (next === 'notifications') router.replace('/onboarding/notifications');
    else router.back();
  };

  return (
    <Screen style={s.content}>
      <TopBar left={<IconButton type="back" onPress={() => router.back()} />} />
      <Text variant="heading">เป้าหมายต่อวัน</Text>
      <Text variant="body" color="muted">ปรับเองได้ หรือใช้ค่าที่น้องจิบคำนวณให้</Text>

      <View style={s.stepper}>
        <Pressable accessibilityLabel="ลด 50 ml" disabled={value <= GOAL_MIN} onPress={() => setValue(Math.max(GOAL_MIN, value - GOAL_STEP))}>
          <SvgXml xml={step('−', value <= GOAL_MIN)} width={56} height={56} />
        </Pressable>
        <Pressable onPress={() => setTyping(true)} accessibilityHint="แตะเพื่อพิมพ์ตัวเลข" style={s.value}>
          <Text variant="display" color={error ? 'berry' : 'water'}>{formatMl(value)}</Text>
          <Text variant="bodyStrong" color="muted">ml ต่อวัน</Text>
        </Pressable>
        <Pressable accessibilityLabel="เพิ่ม 50 ml" disabled={value >= GOAL_MAX} onPress={() => setValue(Math.min(GOAL_MAX, value + GOAL_STEP))}>
          <SvgXml xml={step('+', value >= GOAL_MAX)} width={56} height={56} />
        </Pressable>
      </View>
      {error ? <ErrorNote>{error}</ErrorNote> : (
        <Text variant="caption" color="muted" align="center">{`ปรับทีละ ${GOAL_STEP} ml · ช่วงที่รองรับ ${formatMl(GOAL_MIN)}–${formatMl(GOAL_MAX)} ml`}</Text>
      )}

      <View style={s.recommended}>
        <Mascot pose="ThumbsUp" width={48} />
        <View style={s.flex}>
          <Text variant="caption" color="muted">ค่าที่แนะนำสำหรับคุณ</Text>
          <Text variant="title">{formatMl(recommended)} ml</Text>
        </View>
        <Button label="ใช้ค่านี้" kind="Soft" size="Small" onPress={() => setValue(recommended)} />
      </View>
      <Row label="คำนวณใหม่จากข้อมูลร่างกาย" divider={false} onPress={() => router.push({ pathname: '/onboarding/goal-setup', params: { from: 'settings' } })} />

      <View style={s.flex} />
      <Button label="บันทึกเป้าหมาย" disabled={!isValidGoal(value)} onPress={save} style={s.full} />

      <AmountSheet
        visible={typing}
        title="เป้าหมายต่อวัน"
        initial={value}
        hint={`ช่วงที่รองรับ ${formatMl(GOAL_MIN)}–${formatMl(GOAL_MAX)} ml`}
        validate={rangeError}
        confirmLabel={(n) => `ใช้ ${formatMl(n)} ml`}
        confirmKind="Primary"
        onConfirm={(n) => {
          setValue(n);
          setTyping(false);
        }}
        onCancel={() => setTyping(false)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 40 },
  value: { alignItems: 'center', minWidth: 170 },
  recommended: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, backgroundColor: colors.soft, marginTop: 32 },
  flex: { flex: 1 },
  full: { alignSelf: 'stretch' },
});
