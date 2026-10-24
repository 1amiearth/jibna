import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { artSvg } from '@/assets/svg';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors } from '@/theme/tokens';

export default function Welcome() {
  const { width } = useWindowDimensions();
  return (
    <View style={s.fill}>
      <SvgXml xml={artSvg.waves} width={width} height={300} style={s.waves} />
      <Screen bg="bg" style={s.content}>
        <View style={s.hero}>
          <Text variant="display" color="water" align="center" style={s.logo}>จิบนะ</Text>
          <Text variant="body" color="muted" align="center" style={s.tagline}>
            เพื่อนตัวน้อยที่ชวนคุณ ดื่มน้ำให้พอ ทุกวัน
          </Text>
        </View>
        <Mascot pose="Wave" width={Math.min(260, width * 0.66)} />
        <View style={s.cta}>
          <View style={s.lang} accessibilityLabel="ภาษา ไทย">
            <Text variant="bodyStrong">ไทย</Text>
          </View>
          <Button label="เริ่มต้นใช้งาน" onPress={() => router.push('/onboarding/goal-setup')} style={s.start} />
        </View>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  waves: { position: 'absolute', bottom: 0 },
  content: { justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent' },
  hero: { alignItems: 'center', marginTop: 56, gap: 4 },
  logo: { fontSize: 64, lineHeight: 88 },
  tagline: { width: 220 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 8 },
  lang: { backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 8 },
  start: { alignSelf: 'auto', width: 200 },
});
