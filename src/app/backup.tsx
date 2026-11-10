import { useMemo, useState } from 'react';
import { Share, StyleSheet, TextInput, View } from 'react-native';

import { ErrorNote } from '@/components/AmountSheet';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Row } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Wheel } from '@/components/Wheel';
import { goBack } from '@/lib/goBack';
import { backupText, dayKey, entriesInRange, exportDays, formatDayShort, formatMl, fromKey, parseBackup } from '@/lib/hydration';
import { useNow } from '@/lib/useNow';
import { STORE_VERSION, useJibna } from '@/store/useJibna';
import { colors, fonts } from '@/theme/tokens';

/**
 * Backup (Settings › สำรองข้อมูล). Everything is on-device, so this is the only way to move
 * history to a new phone: export shares the data as text (save to Files, Notes, LINE…), import
 * takes that text pasted back and replaces what's here after a confirm.
 */
export default function Backup() {
  const entries = useJibna((s) => s.entries);
  const count = entries.length;
  const backupData = useJibna((s) => s.backupData);
  const restore = useJibna((s) => s.restoreBackup);
  const showToast = useJibna((s) => s.showToast);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ version: number; data: Record<string, unknown> } | null>(null);

  // Export range: whole days, first logged day → today by default (= everything).
  const today = dayKey(useNow());
  const days = useMemo(() => exportDays(entries, fromKey(today).getTime()), [entries, today]);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const from = range?.from ?? days[0];
  const to = range?.to ?? days[days.length - 1];
  const isAll = from <= days[0] && to >= days[days.length - 1];
  const picked = useMemo(() => entriesInRange(entries, from, to), [entries, from, to]);
  const [editing, setEditing] = useState<{ end: 'from' | 'to'; key: string } | null>(null);
  const applyEdit = () => {
    if (!editing) return;
    // Keep from ≤ to: moving one end past the other drags the other along.
    const k = editing.key;
    setRange(editing.end === 'from' ? { from: k, to: to < k ? k : to } : { from: from > k ? k : from, to: k });
    setEditing(null);
  };

  const exportNow = () =>
    Share.share({
      title: 'ข้อมูลสำรองจิบนะ',
      message: backupText({ ...backupData(), entries: picked }, STORE_VERSION, Date.now(), isAll ? undefined : { from, to }),
    }).catch(() => {});

  const check = () => {
    const parsed = parseBackup(text);
    if ('error' in parsed) return setError(parsed.error);
    if (parsed.version > STORE_VERSION) return setError('ข้อมูลสำรองนี้มาจากจิบนะเวอร์ชันใหม่กว่า อัปเดตแอปก่อนนำเข้า');
    setError(null);
    setPending(parsed);
  };
  const confirm = () => {
    if (!pending) return;
    restore(pending.data, pending.version);
    setPending(null);
    setText('');
    showToast({ message: 'นำเข้าข้อมูลสำรองแล้ว' });
    goBack();
  };
  const incoming = pending && Array.isArray(pending.data.entries) ? pending.data.entries.length : 0;

  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={goBack} />} />
      <Text variant="heading">สำรองข้อมูล</Text>
      <Text variant="body" color="muted">ข้อมูลของจิบนะอยู่ในเครื่องนี้เท่านั้น ส่งออกเก็บไว้ก่อนเปลี่ยนเครื่องหรือลบแอป</Text>

      <View style={s.card}>
        <Text variant="title">ส่งออก</Text>
        <View>
          <Row label="ตั้งแต่วันที่" value={formatDayShort(from)} onPress={() => setEditing({ end: 'from', key: from })} />
          <Row label="ถึงวันที่" value={formatDayShort(to)} onPress={() => setEditing({ end: 'to', key: to })} divider={false} />
        </View>
        <Text variant="caption" color="muted">{`${formatMl(picked.length)} รายการ พร้อมเป้าหมาย ข้อมูลร่างกาย และการตั้งค่า · บันทึกเป็นข้อความในแอปไฟล์ โน้ต หรือส่งหาตัวเองทาง LINE`}</Text>
        {!isAll && <Text variant="caption" color="muted">ส่งออกเฉพาะช่วงที่เลือก ถ้านำเข้าภายหลัง ข้อมูลนอกช่วงนี้ในเครื่องจะหายไป</Text>}
        <Button label="ส่งออกข้อมูลสำรอง" onPress={exportNow} style={s.full} />
      </View>

      <View style={s.card}>
        <Text variant="title">นำเข้า</Text>
        <Text variant="caption" color="muted">วางข้อความข้อมูลสำรองที่ส่งออกไว้ ข้อมูลในเครื่องนี้จะถูกแทนที่ทั้งหมด</Text>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setError(null);
          }}
          multiline
          placeholder="วางข้อมูลสำรองที่นี่"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="ข้อมูลสำรองที่จะนำเข้า"
          style={s.input}
        />
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button label="ตรวจและนำเข้า" kind="Soft" disabled={!text.trim()} onPress={check} style={s.full} />
      </View>

      <Sheet
        visible={!!editing}
        title={editing?.end === 'from' ? 'ตั้งแต่วันที่' : 'ถึงวันที่'}
        onCancel={() => setEditing(null)}
        onDone={applyEdit}>
        {editing && (
          <Wheel
            label="วันที่"
            values={days.map(formatDayShort)}
            index={days.indexOf(editing.key)}
            onChange={(i) => setEditing({ ...editing, key: days[i] })}
            width={200}
          />
        )}
      </Sheet>

      <Sheet visible={!!pending} title="แทนที่ข้อมูลทั้งหมด?" onCancel={() => setPending(null)}>
        <Text variant="body" color="muted" align="center">
          {`ข้อมูลในเครื่องนี้ (${formatMl(count)} รายการ) จะถูกแทนที่ด้วยข้อมูลสำรอง (${formatMl(incoming)} รายการ) ย้อนกลับไม่ได้`}
        </Text>
        <Button label="แทนที่ด้วยข้อมูลสำรอง" kind="Danger" onPress={confirm} style={s.full} />
      </Sheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 12 },
  card: { gap: 10, padding: 16, borderRadius: 22, backgroundColor: colors.soft },
  input: { minHeight: 96, maxHeight: 180, borderRadius: 14, padding: 12, backgroundColor: colors.bg, fontFamily: fonts.anuphanRegular, fontSize: 14, color: colors.ink },
  full: { alignSelf: 'stretch' },
});
