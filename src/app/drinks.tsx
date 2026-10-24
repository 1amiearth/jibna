import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DrinkArt } from '@/components/DrinkChip';
import { IconButton } from '@/components/IconButton';
import { Toggle } from '@/components/Row';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { DRINKS, drinkOrder, formatFactor, moveDrink, type DrinkType } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';
import { colors } from '@/theme/tokens';

function Arrow({ dir, disabled, label, onPress }: { dir: 'up' | 'down'; disabled: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={6} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={[s.arrow, disabled && { opacity: 0.3 }]}>
      <Text variant="title" color="water">{dir === 'up' ? '↑' : '↓'}</Text>
    </Pressable>
  );
}

/** Drinks list (Settings › เครื่องดื่ม): show/hide on Home's quick-add row and reorder. */
export default function Drinks() {
  const order = drinkOrder(useJibna((s) => s.drinkOrder));
  const hidden = useJibna((s) => s.hiddenDrinks);
  const setOrder = useJibna((s) => s.setDrinkOrder);
  const setHidden = useJibna((s) => s.setDrinkHidden);
  const shownCount = order.filter((t) => !hidden.includes(t)).length;
  const move = (t: DrinkType, dir: 1 | -1) => setOrder(moveDrink(order, t, dir));

  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={() => router.back()} />} />
      <Text variant="heading">เครื่องดื่ม</Text>
      <Text variant="caption" color="muted">เลือกเครื่องดื่มที่แสดงในหน้าแรก และจัดลำดับได้ ลำดับนี้ใช้ในตัวเลือกเครื่องดื่มทุกหน้า</Text>
      <View style={s.list}>
        {order.map((t, i) => {
          const shown = !hidden.includes(t);
          const { label, ml, factor } = DRINKS[t];
          return (
            <View key={t} style={[s.row, i === order.length - 1 && { borderBottomWidth: 0 }]}>
              <DrinkArt type={t} width={28} />
              <View style={s.flex}>
                <Text variant="bodyStrong" color={shown ? 'ink' : 'muted'}>{label}</Text>
                <Text variant="label" color={factor < 0 ? 'berry' : 'muted'}>{`${ml} ml · นับเป็นน้ำ ${formatFactor(factor)}`}</Text>
              </View>
              <Arrow dir="up" disabled={i === 0} label={`เลื่อน${label}ขึ้น`} onPress={() => move(t, -1)} />
              <Arrow dir="down" disabled={i === order.length - 1} label={`เลื่อน${label}ลง`} onPress={() => move(t, 1)} />
              {/* The last drink shown on Home can't be hidden. */}
              <Toggle label={`แสดง${label}ในหน้าแรก`} value={shown} disabled={shown && shownCount === 1} onChange={(v) => setHidden(t, !v)} />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 8 },
  list: { marginTop: 8, borderRadius: 22, backgroundColor: colors.soft, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.divider },
  flex: { flex: 1 },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
