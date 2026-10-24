import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import {
  ACTIVITY_ML,
  DROPS_PER_GOAL_DAY,
  DRINKS,
  formatMl,
  GOAL_MAX,
  GOAL_MIN,
  GOAL_STEP,
  hydrationOf,
  ML_PER_KG,
  WEATHER_ML,
} from '@/lib/hydration';
import { colors } from '@/theme/tokens';

const signed = (n: number) => `${n > 0 ? '+' : ''}${formatMl(n)}`;
const beer = hydrationOf({ type: 'Beer', ml: DRINKS.Beer.ml });
const shot = hydrationOf({ type: 'Liquor', ml: 30 });
const highball = hydrationOf({ type: 'Liquor', ml: 245, mix: { kind: 'soda', liquorMl: 45 } });

const FAQ: [string, string][] = [
  [
    'เป้าหมายคำนวณจากอะไร',
    `น้ำหนัก × ${ML_PER_KG} ml + กิจกรรม (${ACTIVITY_ML.low}/${ACTIVITY_ML.mid}/${ACTIVITY_ML.high} ml) + สภาพอากาศ (${WEATHER_ML.normal}/${WEATHER_ML.hot}/${WEATHER_ML.veryHot} ml) ปัดทีละ ${GOAL_STEP} ml อยู่ในช่วง ${formatMl(GOAL_MIN)}–${formatMl(GOAL_MAX)} ml ปรับเองได้ที่ ตั้งค่า › เป้าหมายต่อวัน`,
  ],
  ['“นับเป็นน้ำ %” คืออะไร', 'สัดส่วนของเครื่องดื่มที่นับเข้ายอดน้ำ เช่น ชาไทย 80% หมายถึงดื่ม 250 ml นับเป็นน้ำ 200 ml'],
  [
    'แอลกอฮอล์นับอย่างไร',
    `นับน้ำในเครื่องดื่ม แล้วหักน้ำที่ร่างกายเสียไปประมาณ 10 ml ต่อแอลกอฮอล์ 1 กรัม เช่น เบียร์ ${DRINKS.Beer.ml} ml ≈ ${signed(beer)} ml · เหล้าเพียว 30 ml ≈ ${signed(shot)} ml · เหล้า 45 ml ผสมโซดา 200 ml ≈ ${signed(highball)} ml ยอดรวมของวันไม่ต่ำกว่า 0`,
  ],
  ['หยดน้ำสะสม', `ได้ ${DROPS_PER_GOAL_DAY} หยดทุกวันที่ดื่มครบเป้าของวันนั้น ถ้าลบรายการจนยอดวันนั้นไม่ถึงเป้า หยดของวันนั้นจะหายไปด้วย`],
  ['เปลี่ยนเขตเวลา', 'วันของแต่ละรายการนับตามเวลาในเครื่องตอนที่เปิดดู ถ้าเดินทางข้ามเขตเวลา เครื่องดื่มช่วงดึกหรือเช้ามืดอาจย้ายไปอยู่วันข้างเคียง ยอดรวมไม่หาย'],
  ['การเตือน', 'น้องจิบตั้งการเตือนล่วงหน้าได้สูงสุด 7 วัน (ตามจำนวนที่ iOS อนุญาต) เปิดแอปบ้างเพื่อให้การเตือนต่อเนื่อง ถ้าเปิด “หยุดเตือนเมื่อถึงเป้า” วันนั้นจะไม่เตือนอีกหลังดื่มครบ'],
];

/** Help (Settings › ช่วยเหลือ): how the numbers work, plus the health disclaimer. */
export default function Help() {
  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={() => router.back()} />} />
      <Text variant="heading">ช่วยเหลือ</Text>
      {FAQ.map(([q, a]) => (
        <View key={q} style={s.section}>
          <Text variant="title">{q}</Text>
          <Text variant="body" color="muted">{a}</Text>
        </View>
      ))}
      <View style={s.note} accessibilityRole="text">
        <Text variant="bodyStrong">ไม่ใช่คำแนะนำทางการแพทย์</Text>
        <Text variant="caption" color="muted">
          ตัวเลขในจิบนะเป็นค่าประมาณเพื่อช่วยติดตามการดื่มน้ำทั่วไป ถ้าคุณมีโรคไต โรคหัวใจ ตั้งครรภ์ หรือแพทย์ให้จำกัดน้ำ โปรดทำตามคำแนะนำของแพทย์
        </Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 16 },
  section: { gap: 4 },
  note: { gap: 4, padding: 16, borderRadius: 18, backgroundColor: colors.soft },
});
