import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { Screen, TopBar } from '@/components/Screen';
import { Text } from '@/components/Text';
import { goBack } from '@/lib/goBack';

const SECTIONS: [string, string][] = [
  ['ข้อมูลที่เก็บ', 'ข้อมูลร่างกายที่คุณกรอก (เพศ น้ำหนัก กิจกรรม สภาพอากาศ เวลาตื่น–นอน) เป้าหมายต่อวัน รายการเครื่องดื่มที่บันทึก และการตั้งค่าการเตือน'],
  ['เก็บไว้ที่ไหน', 'ทุกอย่างเก็บไว้ในเครื่องนี้เท่านั้น จิบนะไม่มีบัญชีผู้ใช้ ไม่ส่งข้อมูลขึ้นเซิร์ฟเวอร์ ไม่มีโฆษณา ไม่มีเครื่องมือวิเคราะห์ และไม่แชร์ข้อมูลให้บุคคลที่สาม'],
  ['การแจ้งเตือน', 'การเตือนให้ดื่มน้ำตั้งเวลาไว้ในเครื่อง (local notification) ไม่ผ่านเซิร์ฟเวอร์ใด ๆ ปิดได้ทุกเมื่อในหน้าการเตือนหรือในการตั้งค่า iOS'],
  ['การแชร์', 'ข้อความ “แชร์ความสำเร็จ” จะถูกส่งออกก็ต่อเมื่อคุณกดแชร์เอง ผ่านเมนูแชร์ของระบบ ไปยังแอปที่คุณเลือก'],
  ['การลบข้อมูล', 'ลบแอปออกจากเครื่องเพื่อลบข้อมูลทั้งหมด ตอนนี้ยังไม่มีการสำรองหรือย้ายข้อมูลข้ามเครื่อง'],
];

/** In-app privacy policy (Settings › นโยบายความเป็นส่วนตัว). All data is on-device. */
export default function Privacy() {
  return (
    <Screen scroll style={s.content}>
      <TopBar left={<IconButton type="back" onPress={goBack} />} />
      <Text variant="heading">นโยบายความเป็นส่วนตัว</Text>
      {SECTIONS.map(([title, body]) => (
        <View key={title} style={s.section}>
          <Text variant="title">{title}</Text>
          <Text variant="body" color="muted">{body}</Text>
        </View>
      ))}
      <Text variant="caption" color="muted">ปรับปรุงล่าสุด 24 ตุลาคม 2569</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { gap: 16 },
  section: { gap: 4 },
});
