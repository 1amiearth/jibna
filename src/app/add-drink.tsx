import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AmountSheet } from '@/components/AmountSheet';
import { Button } from '@/components/Button';
import { DrinkGrid } from '@/components/DrinkGrid';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { Row, RowGroup } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { selectionHaptic, SizePicker } from '@/components/SizePicker';
import { Text } from '@/components/Text';
import { Vessel, VESSELS } from '@/components/Vessel';
import { isFuture, WhenPicker, whenLabel } from '@/components/WhenPicker';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  DRINK_TYPES,
  DRINKS,
  entryAmount,
  entryLabel,
  formatFactor,
  formatMl,
  fillLevel,
  formatTime,
  hydrationOf,
  MIX_KINDS,
  MIXES,
  stepSize,
  type DrinkType,
  type Mix,
  type MixKind,
} from '@/lib/hydration';
import { useSheets } from '@/lib/useSheets';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

const amountError = (max: number) => (n: number) => (n > max ? `สูงสุด ${formatMl(max)} ml ต่อครั้ง — แบ่งบันทึกเป็นหลายแก้วได้` : null);
const signed = (n: number) => `${n > 0 ? '+' : ''}${formatMl(n)}`;
const LIQUOR = DRINKS.Liquor;
const MIXER_DEFAULT = 1; // 200 ml

export default function AddDrink() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<DrinkType>(DRINK_TYPES.includes(params.type as DrinkType) ? (params.type as DrinkType) : 'Water');
  const drink = DRINKS[type];
  const [sizeIndex, setSizeIndex] = useState(drink.sizes.indexOf(drink.ml));
  /** Typed amount: the whole serving, or the mixer only when liquor is mixed. */
  const [customMl, setCustomMl] = useState<number | null>(null);
  const [mixKind, setMixKind] = useState<MixKind>('neat');
  const [shotIndex, setShotIndex] = useState(LIQUOR.sizes.indexOf(LIQUOR.ml));
  const [at, setAt] = useState<number | null>(null);
  const [draftAt, setDraftAt] = useState(() => Date.now());
  const sheets = useSheets<'more' | 'amount' | 'time'>();
  const addEntry = useJibna((s) => s.addEntry);
  const showToast = useJibna((s) => s.showToast);

  const isLiquor = type === 'Liquor';
  const mixed = isLiquor && mixKind !== 'neat';
  const shotMl = LIQUOR.sizes[shotIndex];
  // Mixed liquor swipes through whole-glass totals: shot + each mixer preset.
  const sizes = mixed ? MIXES[mixKind].sizes.map((m) => shotMl + m) : drink.sizes;
  const customTotal = customMl == null ? null : mixed ? shotMl + customMl : customMl;
  const ml = customTotal ?? sizes[sizeIndex];
  const mixOf = (total: number): Mix | undefined =>
    isLiquor ? { kind: mixKind, liquorMl: mixed ? shotMl : total } : undefined;
  const preview = { type, ml, mix: mixOf(ml) };
  const delta = hydrationOf(preview);
  const alcohol = drink.factor < 0;
  const negative = delta < 0;

  const chooseType = (t: DrinkType) => {
    setType(t);
    setMixKind('neat');
    setSizeIndex(DRINKS[t].sizes.indexOf(DRINKS[t].ml));
    setCustomMl(null);
    sheets.close();
  };
  // The shot carries over between neat and mixed.
  const chooseMix = (k: MixKind) => {
    if (k === mixKind) return;
    selectionHaptic();
    if (k === 'neat') setSizeIndex(shotIndex);
    else if (!mixed) {
      if (customMl == null) setShotIndex(sizeIndex);
      setSizeIndex(MIXER_DEFAULT);
    }
    if (k === 'neat' || !mixed) setCustomMl(null);
    setMixKind(k);
  };
  const chooseShot = (i: number) => {
    selectionHaptic();
    setShotIndex(i);
  };
  const add = (total = ml) => {
    const entry = addEntry(type, total, at ?? undefined, mixOf(total));
    showToast({ message: `+${entryAmount(entry)} ${entryLabel(entry)} · ${formatTime(entry.at)}`, undo: { kind: 'add', entry } });
    router.back();
  };
  // Vessel button: next preset, wrapping back to the smallest.
  const cycleSize = () => {
    selectionHaptic();
    setSizeIndex(stepSize(sizes, sizeIndex, customTotal, 1) ?? 0);
    setCustomMl(null);
  };

  const mixer = MIXES[mixKind].mixer;
  const amountMax = mixed ? AMOUNT_MAX - shotMl : AMOUNT_MAX;

  return (
    <Screen style={s.content}>
      <TopBar
        left={
          <View style={[s.tag, { backgroundColor: negative ? colors.berryTint : colors.waterPale }]}>
            <Text variant="label" color={negative ? 'berry' : 'water'}>
              {mixed ? entryLabel(preview) : `${drink.label} · นับเป็นน้ำ ${formatFactor(drink.factor)}`}
            </Text>
          </View>
        }
        right={<IconButton type="close" onPress={() => router.back()} />}
      />

      {isLiquor && (
        <View style={s.mixArea}>
          <View style={s.segments} accessibilityRole="radiogroup" accessibilityLabel="วิธีดื่ม">
            {MIX_KINDS.map((k) => (
              <Pressable
                key={k}
                onPress={() => chooseMix(k)}
                accessibilityRole="radio"
                accessibilityState={{ checked: k === mixKind }}
                style={[s.segment, k === mixKind && { backgroundColor: VESSELS.Liquor.accent }]}>
                <Text variant="label" color={k === mixKind ? 'bg' : 'muted'} numberOfLines={1} adjustsFontSizeToFit>
                  {MIXES[k].label}
                </Text>
              </Pressable>
            ))}
          </View>
          {mixed && (
            <View style={s.shots} accessibilityRole="radiogroup" accessibilityLabel="ปริมาณเหล้า">
              <Text variant="caption" color="muted">เหล้า</Text>
              {LIQUOR.sizes.map((n, i) => (
                <Pressable
                  key={n}
                  onPress={() => chooseShot(i)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: i === shotIndex }}
                  style={[s.shot, i === shotIndex && s.shotOn]}>
                  <Text variant="label" color={i === shotIndex ? 'ink' : 'muted'}>{`${n} ml`}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={s.flex} />

      <SizePicker
        type={type}
        mix={isLiquor ? mixKind : undefined}
        sizes={sizes}
        index={sizeIndex}
        custom={customTotal}
        onChange={(i) => {
          setCustomMl(null);
          setSizeIndex(i);
        }}
      />
      {mixed ? (
        <Text variant="caption" color={negative ? 'berry' : 'mint'} align="center">
          {`เหล้า ${shotMl} ml (${signed(shotMl * LIQUOR.factor)}) + ${mixer} ${formatMl(ml - shotMl)} ml (+${formatMl(ml - shotMl)}) = สุทธิ ${signed(delta)} ml`}
        </Text>
      ) : alcohol ? (
        <Text variant="caption" color="berry" align="center">{`= ${formatMl(delta)} ml จากยอดน้ำวันนี้`}</Text>
      ) : (
        <Text variant="caption" color="muted" align="center">
          {at == null ? 'ปัดซ้าย–ขวาเพื่อเปลี่ยนขนาดแก้ว' : `บันทึกเป็นเวลา ${whenLabel(at)}`}
        </Text>
      )}
      {negative && (
        <View style={s.notice}>
          <Mascot pose="Thirsty" width={36} />
          <Text variant="caption" style={s.flex}>
            {isLiquor && !mixed ? 'ดื่มเพียวเสียน้ำเยอะ ลองผสมน้ำหรือโซดา หรือดื่มน้ำเปล่าตามสัก 1 แก้วนะ' : 'แอลกอฮอล์ทำให้ร่างกายเสียน้ำ ดื่มน้ำเปล่าตามสัก 1 แก้วนะ'}
          </Text>
        </View>
      )}

      <View style={s.flex} />
      <View style={s.actions}>
        <Pressable
          onPress={cycleSize}
          style={s.cycle}
          accessibilityRole="button"
          accessibilityLabel="เปลี่ยนขนาดแก้ว"
          accessibilityValue={{ text: `${formatMl(ml)} มิลลิลิตร` }}>
          <Vessel type={type} mix={isLiquor ? mixKind : undefined} level={fillLevel(ml, sizes)} size={40} />
        </Pressable>
        <Button label={`+ ${mixed ? entryLabel(preview) : drink.label}`} kind="Water" onPress={() => add()} style={[s.addBtn, { backgroundColor: VESSELS[type].accent }]} />
        <IconButton type="more" onPress={() => sheets.show('more')} />
      </View>

      <Sheet visible={sheets.is('more')} title="เลือกเครื่องดื่ม" cancelLabel="ปิด" onCancel={sheets.close}>
        <DrinkGrid selected={type} onSelect={chooseType} />
        <Text variant="caption" color="muted" align="center" style={s.legend}>
          % = สัดส่วนที่นับเป็นน้ำ · ค่าติดลบ (สีชมพู) = แอลกอฮอล์ ทำให้ร่างกายเสียน้ำ ยอดรวมวันไม่ต่ำกว่า 0
        </Text>
        <View style={s.stretch}>
          <RowGroup>
            <Row label={mixed ? `กำหนดปริมาณ${mixer}เอง` : 'กำหนดปริมาณเอง'} onPress={() => sheets.show('amount')} />
            <Row
              label="เวลาที่ดื่ม"
              value={whenLabel(at)}
              divider={false}
              onPress={() => {
                setDraftAt(at ?? Date.now());
                sheets.show('time');
              }}
            />
          </RowGroup>
        </View>
        <Text variant="caption" color="muted" align="center">เปลี่ยนเวลาได้ย้อนหลังสูงสุด 7 วัน · ไม่สามารถตั้งเวลาในอนาคต</Text>
      </Sheet>

      <AmountSheet
        visible={sheets.is('amount')}
        title={mixed ? `ปริมาณ${mixer}` : 'กำหนดปริมาณเอง'}
        initial={0}
        min={AMOUNT_MIN}
        hint={
          mixed
            ? `เหล้า ${shotMl} ml + ${mixer} · ${AMOUNT_MIN}–${formatMl(amountMax)} ml`
            : `${drink.label} · นับเป็นน้ำ ${formatFactor(drink.factor)} · ${AMOUNT_MIN}–${formatMl(AMOUNT_MAX)} ml ต่อครั้ง`
        }
        validate={amountError(amountMax)}
        confirmLabel={(n) =>
          mixed ? `+ ${entryLabel(preview)} ${shotMl}+${n ? formatMl(n) : '…'} ml` : n ? `+ ${formatMl(n)} ml ${drink.label}` : `+ ${drink.label}`
        }
        onConfirm={(n) => {
          sheets.close();
          add(mixed ? shotMl + n : n);
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
  tag: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingRight: 14, borderRadius: 18, backgroundColor: colors.soft, marginTop: 8 },
  flex: { flex: 1 },
  mixArea: { gap: 10, marginTop: 8 },
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 22, backgroundColor: colors.soft },
  segment: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  shots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shot: { paddingHorizontal: 14, height: 32, borderRadius: 16, justifyContent: 'center', borderWidth: 2, borderColor: colors.soft, backgroundColor: colors.soft },
  shotOn: { borderColor: VESSELS.Liquor.accent, backgroundColor: colors.bg },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  addBtn: { width: 196, paddingHorizontal: 16 },
  cycle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  legend: { width: 320 },
  stretch: { alignSelf: 'stretch' },
});
