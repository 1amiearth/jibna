import { StyleSheet, View } from 'react-native';

import { Mascot } from '@/components/Mascot';
import { Text } from '@/components/Text';
import { colors } from '@/theme/tokens';

/** Static iOS-style banner showing what a Jibna reminder looks like (Figma 07 / 16). */
export function NotificationPreview({ remaining }: { remaining: string }) {
  return (
    <View style={s.card} accessibilityLabel="ตัวอย่างการแจ้งเตือน">
      <View style={s.icon}>
        <Mascot pose="Happy" width={30} />
      </View>
      <View style={s.copy}>
        <View style={s.titleRow}>
          <Text variant="label">จิบนะ</Text>
          <Text variant="label" color="muted">ตอนนี้</Text>
        </View>
        <Text variant="caption">{`น้องจิบเริ่มคอแห้งแล้ว ดื่มน้ำสักแก้วไหม? ยังขาดอีก ${remaining} ml`}</Text>
      </View>
      <Mascot pose="Thirsty" width={40} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingLeft: 14, borderRadius: 22, backgroundColor: colors.bg,
    shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  icon: { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.waterLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
