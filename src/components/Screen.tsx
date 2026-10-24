import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, type ColorName } from '@/theme/tokens';

type Props = { children: React.ReactNode; bg?: ColorName | 'transparent'; scroll?: boolean; style?: StyleProp<ViewStyle> };

/** Full-screen container: safe area + 24px gutter. */
export function Screen({ children, bg = 'bg', scroll, style }: Props) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={[s.content, style]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  ) : (
    <View style={[s.content, s.fill, style]}>{children}</View>
  );
  return <SafeAreaView style={[s.fill, { backgroundColor: bg === 'transparent' ? bg : colors[bg] }]} edges={['top', 'bottom']}>{body}</SafeAreaView>;
}

/** Row of top-bar controls (Back / Close / Menu). */
export function TopBar({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={s.top}>
      <View>{left}</View>
      <View>{right}</View>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, marginTop: 8 },
});
