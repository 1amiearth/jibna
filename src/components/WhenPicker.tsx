import { StyleSheet, View } from 'react-native';

import { ErrorNote } from '@/components/AmountSheet';
import { Text } from '@/components/Text';
import { Wheel } from '@/components/Wheel';
import { BACKDATE_DAYS, formatTime, TH_MONTHS_SHORT } from '@/lib/hydration';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(offset: number, now: number) {
  if (offset === 0) return 'วันนี้';
  if (offset === 1) return 'เมื่อวาน';
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

/** Short label for a chosen time: 'ตอนนี้ · 14:42', 'วันนี้ 09:05', 'เมื่อวาน 20:30'. */
export function whenLabel(at: number | null, now = Date.now()) {
  if (at == null) return `ตอนนี้ · ${formatTime(now)}`;
  const offset = Math.round((startOfDay(now) - startOfDay(at)) / 86400000);
  return `${dayLabel(offset, now)} ${formatTime(at)}`;
}

export const isFuture = (at: number) => at > Date.now();

/** Day / hour / minute wheels for back-dating up to 7 days (Figma 30). */
export function WhenPicker({ value, onChange }: { value: number; onChange: (t: number) => void }) {
  const now = Date.now();
  const days = Array.from({ length: BACKDATE_DAYS + 1 }, (_, i) => dayLabel(BACKDATE_DAYS - i, now));
  const d = new Date(value);
  const offset = Math.round((startOfDay(now) - startOfDay(value)) / 86400000);
  const set = (dayOffset: number, h: number, m: number) => {
    const t = new Date(now);
    t.setDate(t.getDate() - dayOffset);
    t.setHours(h, m, 0, 0);
    onChange(t.getTime());
  };
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <Wheel label="วัน" values={days} index={BACKDATE_DAYS - offset} onChange={(i) => set(BACKDATE_DAYS - i, d.getHours(), d.getMinutes())} width={130} />
        <Wheel label="ชั่วโมง" values={HOURS} index={d.getHours()} onChange={(i) => set(offset, i, d.getMinutes())} width={80} />
        <Wheel label="นาที" values={MINUTES} index={Math.floor(d.getMinutes() / 5)} onChange={(i) => set(offset, d.getHours(), i * 5)} width={80} />
      </View>
      {isFuture(value) ? (
        <ErrorNote>เลือกเวลาในอนาคตไม่ได้</ErrorNote>
      ) : (
        <Text variant="caption" color="muted" align="center">{`${whenLabel(value)} · ย้อนหลังได้ ${BACKDATE_DAYS} วัน`}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 },
});
