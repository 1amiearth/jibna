import { Pressable } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Same SVGs as the Figma "Icon Button" component set.
const ICONS = {
  back: [40, '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#F4F8FB"/><path d="M23 13l-7 7 7 7" fill="none" stroke="#1E2B3C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'ย้อนกลับ'],
  close: [36, '<svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#E7EDF2"/><path d="M12.5 12.5l11 11M23.5 12.5l-11 11" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/></svg>', 'ปิด'],
  more: [48, '<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#E3F3FC"/><circle cx="16" cy="24" r="3" fill="#4DB3E6"/><circle cx="24" cy="24" r="3" fill="#4DB3E6"/><circle cx="32" cy="24" r="3" fill="#4DB3E6"/></svg>', 'ตัวเลือกเพิ่มเติม'],
  settings: [44, '<svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="#F4F8FB"/><path d="M13 17c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0M13 22c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0M13 27c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" fill="none" stroke="#8A97A6" stroke-width="2.2" stroke-linecap="round"/></svg>', 'ตั้งค่า'],
} as const;

export function IconButton({ type, onPress }: { type: keyof typeof ICONS; onPress: () => void }) {
  const [size, xml, label] = ICONS[type];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={(44 - size) / 2 + 4}>
      <SvgXml xml={xml} width={size} height={size} />
    </Pressable>
  );
}
