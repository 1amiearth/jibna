// Design tokens mirrored from the Figma "Jibna Colors" collection and Jibna/* text styles.
import type { TextStyle } from 'react-native';

export const colors = {
  water: '#4DB3E6',
  waterLight: '#8CC8F0',
  waterPale: '#E3F3FC',
  navy: '#1F4E79',
  ink: '#1E2B3C',
  blush: '#F29A8E',
  sun: '#FFC857',
  mint: '#5CC9A7',
  berry: '#E8607A',
  bg: '#FFFFFF',
  soft: '#F4F8FB',
  sand: '#EFE8DA',
  muted: '#8A97A6',
  divider: '#E7EDF2',
  berryTint: 'rgba(232, 96, 122, 0.12)',
  scrim: 'rgba(30, 43, 60, 0.45)',
  chevron: '#B5C0CC',
} as const;

export type ColorName = keyof typeof colors;

export const fonts = {
  mitrMedium: 'Mitr_500Medium',
  mitrSemiBold: 'Mitr_600SemiBold',
  anuphanRegular: 'Anuphan_400Regular',
  anuphanMedium: 'Anuphan_500Medium',
  anuphanSemiBold: 'Anuphan_600SemiBold',
} as const;

// Thai has tall ascenders/descenders: line heights stay ≥ 1.4× to avoid clipping.
export const type = {
  display: { fontFamily: fonts.mitrSemiBold, fontSize: 48, lineHeight: 64 },
  heading: { fontFamily: fonts.mitrMedium, fontSize: 28, lineHeight: 40 },
  title: { fontFamily: fonts.mitrMedium, fontSize: 20, lineHeight: 30 },
  button: { fontFamily: fonts.mitrMedium, fontSize: 17, lineHeight: 26 },
  buttonSmall: { fontFamily: fonts.mitrMedium, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.anuphanSemiBold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.anuphanRegular, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.anuphanMedium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.anuphanSemiBold, fontSize: 12, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type TypeName = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, gutter: 24, xxl: 32 } as const;

export const radius = { card: 22, option: 18, key: 16, pill: 28, sheet: 28, screen: 40 } as const;

export const layout = { contentWidth: 342, rowHeight: 52, rowHeightLarge: 58 } as const;
