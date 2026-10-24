import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AmountSheet } from '@/components/AmountSheet';
import { Button } from '@/components/Button';
import { DrinkArt } from '@/components/DrinkChip';
import { DrinkGrid } from '@/components/DrinkGrid';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { Row, RowGroup } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { SizePicker } from '@/components/SizePicker';
import { Text } from '@/components/Text';
import { isFuture, WhenPicker, whenLabel } from '@/components/WhenPicker';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  DRINK_TYPES,
  DRINKS,
  formatFactor,
  formatMl,
  formatTime,
  hydrationOf,
  type DrinkType,
} from '@/lib/hydration';
import { useSheets } from '@/lib/useSheets';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const amountError = (n: number) =>
  n > AMOUNT_MAX ? `สูงสุด ${formatMl(AMOUNT_MAX)} ml ต่อครั้ง — แบ่งบันทึกเป็นหลายแก้วได้` : n < AMOUNT_MIN ? `ขั้นต่ำ ${AMOUNT_MIN} ml` : null;

export default function AddDrink() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<DrinkType>(DRINK_TYPES.includes(params.type as DrinkType) ? (params.type as DrinkType) : 'Water');
  const drink = DRINKS[type];
  const [sizeIndex, setSizeIndex] = useState(drink.sizes.indexOf(drink.ml));
  const [customMl, setCustomMl] = useState<number | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const [draftAt, setDraftAt] = useState(() => Date.now());
  const sheets = useSheets<'type' | 'more' | 'amount' | 'time'>();
  const addEntry = useJibna((s) => s.addEntry);
  const showToast = useJibna((s) => s.showToast);

  const ml = customMl ?? drink.sizes[sizeIndex];
  const delta = hydrationOf({ type, ml });
  const negative = drink.factor < 0;

  const chooseType = (t: DrinkType) => {
    setType(t);
    setSizeIndex(DRINKS[t].sizes.indexOf(DRINKS[t].ml));
    setCustomMl(null);
    sheets.close();
  };
  const add = (amount = ml) => {
    const entry = addEntry(type, amount, at ?? Date.now());
    showToast({ message: `+${formatMl(amount)} ml ${drink.label} · ${formatTime(entry.at)}`, undo: { kind: 'add', entry } });
    router.back();
  };


  return (
    <Screen style={s.content}>
      <TopBar right={<IconButton type="close" onPress={() => router.back()} />} />
      <View style={s.head}>
        <Text variant="heading" align="center">{drink.label}</Text>
        <View style={[s.tag, { backgroundColor: negative ? colors.berryTint : colors.waterPale }]}>
          <Text variant="label" color={negative ? 'berry' : 'water'}>{`นับเป็นน้ำ ${formatFactor(drink.factor)}`}</Text>
        </View>
      </View>

      <SizePicker
        type={type}
        index={sizeIndex}
        custom={customMl}
        onChange={(i) => {
          setCustomMl(null);
          setSizeIndex(i);
        }}
      />
      {negative ? (
        <>
          <Text variant="caption" color="berry" align="center">{`= ${formatMl(delta)} ml จากยอดน้ำวันนี้`}</Text>
          <View style={s.notice}>
            <Mascot pose="Thirsty" width={36} />
            <Text variant="caption" style={s.flex}>แอลกอฮอล์ทำให้ร่างกายเสียน้ำ ดื่มน้ำเปล่าตามสัก 1 แก้วนะ</Text>
          </View>
        </>
      ) : (
        <Text variant="caption" color="muted" align="center">
          {at == null ? 'ปัดซ้าย–ขวาเพื่อเปลี่ยนขนาดแก้ว' : `บันทึกเป็นเวลา ${whenLabel(at)}`}
        </Text>
      )}

      <View style={s.flex} />
      <View style={s.actions}>
        <Pressable onPress={() => sheets.show('type')} accessibilityRole="button" accessibilityLabel="เปลี่ยนประเภทเครื่องดื่ม">
          <DrinkArt type={type} width={44} />
        </Pressable>
        <Button label={`+ ${drink.label}`} kind="Water" onPress={() => add()} style={s.addBtn} />
        <IconButton type="more" onPress={() => sheets.show('more')} />
      </View>

      <Sheet visible={sheets.is('type')} title="เลือกเครื่องดื่ม" cancelLabel="ปิด" onCancel={sheets.close}>
        <DrinkGrid selected={type} onSelect={chooseType} />
        <Text variant="caption" color="muted" align="center" style={s.legend}>
          % = สัดส่วนที่นับเป็นน้ำ · ค่าติดลบ (สีชมพู) = แอลกอฮอล์ ทำให้ร่างกายเสียน้ำ ยอดรวมวันไม่ต่ำกว่า 0
        </Text>
      </Sheet>

      <Sheet visible={sheets.is('more')} title="ตัวเลือก" cancelLabel="ปิด" onCancel={sheets.close}>
        <View style={s.stretch}>
          <RowGroup>
            <Row label="กำหนดปริมาณเอง" onPress={() => sheets.show('amount')} />
            <Row
              label="เวลาที่ดื่ม"
              value={whenLabel(at)}
              onPress={() => {
                setDraftAt(at ?? Date.now());
                sheets.show('time');
              }}
            />
            <Row label="เปลี่ยนประเภทเครื่องดื่ม" divider={false} onPress={() => sheets.show('type')} />
          </RowGroup>
        </View>
        <Text variant="caption" color="muted" align="center">เปลี่ยนเวลาได้ย้อนหลังสูงสุด 7 วัน · ไม่สามารถตั้งเวลาในอนาคต</Text>
      </Sheet>

      <AmountSheet
        visible={sheets.is('amount')}
        title="กำหนดปริมาณเอง"
        initial={ml}
        hint={`${drink.label} · นับเป็นน้ำ ${formatFactor(drink.factor)} · ${AMOUNT_MIN}–${formatMl(AMOUNT_MAX)} ml ต่อครั้ง`}
        validate={amountError}
        confirmLabel={(n) => `+ ${formatMl(n)} ml ${drink.label}`}
        onConfirm={(n) => {
          sheets.close();
          add(n);
        }}
        onCancel={sheets.close}
      />

      <Sheet
        visible={sheets.is('time')}
        title="เวลาที่ดื่ม"
        onCancel={sheets.close}
        onDone={() => {
          setAt(draftAt);
          sheets.close();
        }}
        doneDisabled={isFuture(draftAt)}>
        <WhenPicker value={draftAt} onChange={setDraftAt} />
      </Sheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 8 },
  head: { alignItems: 'center', gap: 6 },
  tag: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingRight: 14, borderRadius: 18, backgroundColor: colors.soft, marginTop: 8 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  addBtn: { width: 196 },
  legend: { width: 320 },
  stretch: { alignSelf: 'stretch' },
});
