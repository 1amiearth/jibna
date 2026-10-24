import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Button } from '@/components/Button';
import { DrinkArt, DrinkChip } from '@/components/DrinkChip';
import { MixSelector } from '@/components/MixSelector';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { Screen, TopBar } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { isFuture, WhenPicker } from '@/components/WhenPicker';
import {
  addedText,
  BACKDATE_DAYS,
  AMOUNT_MIN,
  caffeineOf,
  dayKey,
  dayTotals,
  DRINK_TYPES,
  DRINKS,
  entriesOn,
  entryAmount,
  entryLabel,
  formatDayTitle,
  formatFactor,
  formatMl,
  formatTime,
  fromKey,
  goalOn,
  hydrationOf,
  MIXER_MAX_ML,
  MIXES,
  percentOf,
  type DrinkType,
  type Entry,
  type MixKind,
} from '@/lib/hydration';
import { useNow } from '@/lib/useNow';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const MINUS = '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FCE4E9"/><path d="M7.5 12h9" stroke="#E8607A" stroke-width="2.4" stroke-linecap="round"/></svg>';
const STEP = 50;
/** Back-dated liquor steps by half a shot (30 → 45 → 60) instead of 50 ml. */
const stepFor = (t: DrinkType) => (t === 'Liquor' ? 15 : STEP);

type Missed = { type: DrinkType; ml: number; at: number; mix: MixKind; mixerMl: number };
const newMissed = (at: number): Missed => ({ type: 'Water', ml: DRINKS.Water.ml, at, mix: 'neat', mixerMl: 200 });

function defaultMissedTime(key: string) {
  if (key === dayKey(Date.now())) return Date.now() - 60 * 60 * 1000;
  const d = fromKey(key);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

/** Day Log (Figma 05, 27–30): list, delete confirm + undo, add missed drink, empty state. */
export default function DayLog() {
  const params = useLocalSearchParams<{ date?: string }>();
  const now = useNow();
  const key = params.date ?? dayKey(now);
  const isToday = key === dayKey(now);
  const canBackdate = (now - fromKey(key).getTime()) / 86400000 < BACKDATE_DAYS + 1;
  const entries = useJibna((s) => s.entries);
  const goals = useJibna((s) => s.goals);
  const goal = goalOn(goals, key, useJibna((s) => s.goal)); // that day's goal
  const removeEntry = useJibna((s) => s.removeEntry);
  const addEntry = useJibna((s) => s.addEntry);
  const showToast = useJibna((s) => s.showToast);

  const list = entriesOn(entries, key);
  const totals = dayTotals(entries, key);
  const remaining = Math.max(0, goal - totals.hydration);

  const [pending, setPending] = useState<Entry | null>(null);
  const [adding, setAdding] = useState(false);
  const [missed, setMissed] = useState<Missed>(() => newMissed(Date.now()));
  const missedMixed = missed.type === 'Liquor' && missed.mix !== 'neat';

  const afterDelete = pending ? dayTotals(entries.filter((e) => e.id !== pending.id), key).hydration : 0;
  const confirmDelete = () => {
    if (!pending) return;
    const entry = removeEntry(pending.id);
    setPending(null);
    if (entry) showToast({ message: `ลบ ${entryLabel(entry)} ${entryAmount(entry)} แล้ว`, undo: { kind: 'delete', entry } });
  };
  const openAdd = () => {
    setMissed(newMissed(defaultMissedTime(key)));
    setAdding(true);
  };
  const confirmAdd = () => {
    // Mixed liquor: `ml` is the liquor, the entry stores the whole glass.
    const entry = missedMixed
      ? addEntry(missed.type, missed.ml + missed.mixerMl, missed.at, { kind: missed.mix, liquorMl: missed.ml })
      : addEntry(missed.type, missed.ml, missed.at);
    setAdding(false);
    showToast({ message: `${addedText(entry)} · ${formatTime(entry.at)}`, undo: { kind: 'add', entry } });
  };

  return (
    <Screen style={s.content}>
      <TopBar right={<IconButton type="close" onPress={() => router.back()} />} />
      <View style={s.head}>
        <Text variant="heading" align="center">{formatDayTitle(key)}</Text>
        <Text variant="caption" color="water" align="center">
          {`${formatMl(totals.hydration)} ml นับเป็นน้ำ • ${percentOf(totals.hydration, goal)}% ของเป้าหมาย`}
        </Text>
        <Text variant="label" color="muted" align="center">
          {totals.count ? `ดื่มทั้งหมด ${formatMl(totals.total)} ml · คาเฟอีน ${totals.caffeine} mg` : isToday ? 'ยังไม่มีการบันทึกวันนี้' : 'ดื่มทั้งหมด 0 ml'}
        </Text>
      </View>

      {list.length === 0 ? (
        <View style={s.empty}>
          <Mascot pose="Thirsty" width={150} />
          <Text variant="title" align="center">{isToday ? 'ยังไม่ได้ดื่มอะไรเลยวันนี้' : 'ไม่มีการบันทึกในวันนั้น'}</Text>
          <Text variant="caption" color="muted" align="center" style={s.emptyBody}>
            แตะแก้วที่หน้าแรกเพื่อบันทึก หรือเพิ่มย้อนหลังถ้าลืมจด
          </Text>
          {canBackdate && <Button label="+ เพิ่มเครื่องดื่มย้อนหลัง" kind="Soft" size="Small" onPress={openAdd} />}
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {list.map((e) => {
            const f = DRINKS[e.type].factor;
            const net = hydrationOf(e);
            const mixed = e.mix && e.mix.kind !== 'neat';
            const sub = caffeineOf(e)
              ? `คาเฟอีน ${caffeineOf(e)} mg`
              : mixed
                ? `สุทธิ ${net > 0 ? '+' : ''}${formatMl(net)} ml`
                : f !== 1
                  ? `นับเป็นน้ำ ${formatFactor(f)}`
                  : null;
            return (
              <View key={e.id} style={s.row}>
                <DrinkArt type={e.type} width={24} />
                <Text variant="bodyStrong" style={s.flex}>{entryLabel(e)}</Text>
                <View style={s.meta}>
                  <Text variant="caption" color="muted">{`${formatTime(e.at)} • ${entryAmount(e)}`}</Text>
                  {sub ? <Text variant="label" color={net < 0 ? 'berry' : 'muted'}>{sub}</Text> : null}
                </View>
                <Pressable onPress={() => setPending(e)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`ลบ ${entryLabel(e)}`}>
                  <SvgXml xml={MINUS} width={24} height={24} />
                </Pressable>
              </View>
            );
          })}
          {canBackdate && <Button label="+ เพิ่มเครื่องดื่มย้อนหลัง" kind="Soft" size="Small" onPress={openAdd} style={s.addMissed} />}
        </ScrollView>
      )}

      {isToday && list.length > 0 && (
        <View style={s.tip}>
          <Mascot pose={remaining ? 'Drink' : 'Cheer'} width={52} />
          <Text variant="caption" style={s.flex}>
            {remaining ? `อีกแค่ ${formatMl(remaining)} ml เท่านั้น! ลองจิบน้ำเปล่าหลังมื้อเย็นสักแก้วนะ` : 'ครบเป้าแล้ววันนี้ เก่งมาก ๆ!'}
          </Text>
        </View>
      )}

      <Sheet visible={!!pending} title="ลบรายการนี้?" onCancel={() => setPending(null)}>
        {pending && (
          <>
            <View style={s.preview}>
              <DrinkArt type={pending.type} width={28} />
              <View style={s.flex}>
                <Text variant="bodyStrong">{`${entryLabel(pending)} · ${entryAmount(pending)}`}</Text>
                <Text variant="caption" color="muted">
                  {`${formatTime(pending.at)}${caffeineOf(pending) ? ` · คาเฟอีน ${caffeineOf(pending)} mg` : ''} · ${formatMl(hydrationOf(pending))} ml นับเป็นน้ำ`}
                </Text>
              </View>
            </View>
            <Text variant="caption" color="muted" align="center">
              {`ยอดวัน${isToday ? 'นี้' : 'นั้น'}จะเหลือ ${formatMl(afterDelete)} ml (${percentOf(afterDelete, goal)}% ของเป้าหมาย)`}
            </Text>
            <Button label="ลบรายการ" kind="Danger" onPress={confirmDelete} style={s.full} />
          </>
        )}
      </Sheet>

      <Sheet visible={adding} title="เพิ่มย้อนหลัง" doneLabel="เพิ่ม" onCancel={() => setAdding(false)} onDone={confirmAdd} doneDisabled={isFuture(missed.at)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipsWrap}>
          {DRINK_TYPES.map((t) => (
            <DrinkChip key={t} type={t} showAdd={false} selected={missed.type === t} onPress={() => setMissed({ ...missed, type: t, ml: DRINKS[t].ml, mix: 'neat' })} />
          ))}
        </ScrollView>
        {missed.type === 'Liquor' && <MixSelector value={missed.mix} onChange={(mix) => setMissed({ ...missed, mix })} />}
        <AmountStepper
          label={missed.type === 'Liquor' ? 'เหล้า' : 'ปริมาณ'}
          value={missed.ml}
          step={stepFor(missed.type)}
          min={AMOUNT_MIN}
          max={DRINKS[missed.type].maxMl}
          onChange={(ml) => setMissed({ ...missed, ml })}
        />
        {missedMixed && (
          <AmountStepper
            label={MIXES[missed.mix].mixer}
            value={missed.mixerMl}
            step={STEP}
            min={STEP}
            max={MIXER_MAX_ML}
            onChange={(mixerMl) => setMissed({ ...missed, mixerMl })}
          />
        )}
        <WhenPicker value={missed.at} onChange={(at) => setMissed({ ...missed, at })} />
      </Sheet>
    </Screen>
  );
}

function AmountStepper({ label, value, step, min, max, onChange }: { label: string; value: number; step: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <View style={s.amountRow} accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: `${formatMl(value)} มิลลิลิตร` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(e.nativeEvent.actionName === 'increment' ? Math.min(max, value + step) : Math.max(min, value - step))}>
      <Text variant="bodyStrong" style={s.flex}>{label}</Text>
      <Pressable onPress={() => onChange(Math.max(min, value - step))} hitSlop={8} accessibilityLabel={`ลด ${step} ml`} style={s.stepBtn}>
        <Text variant="title" color="water">−</Text>
      </Pressable>
      <Text variant="bodyStrong" color="water" style={s.amountValue}>{`${formatMl(value)} ml`}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + step))} hitSlop={8} accessibilityLabel={`เพิ่ม ${step} ml`} style={s.stepBtn}>
        <Text variant="title" color="water">+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  content: { gap: 8 },
  head: { gap: 2 },
  list: { paddingTop: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.divider },
  meta: { alignItems: 'flex-end' },
  flex: { flex: 1 },
  addMissed: { marginTop: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyBody: { width: 260, marginBottom: 12 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingRight: 16, borderRadius: 20, backgroundColor: colors.soft },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', padding: 16, borderRadius: 18, backgroundColor: colors.soft },
  full: { alignSelf: 'stretch' },
  chipsWrap: { flexGrow: 0, alignSelf: 'stretch' },
  chips: { gap: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', paddingHorizontal: 16, height: 52, borderRadius: 18, backgroundColor: colors.soft },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.waterPale, alignItems: 'center', justifyContent: 'center' },
  amountValue: { minWidth: 72, textAlign: 'center' },
});
