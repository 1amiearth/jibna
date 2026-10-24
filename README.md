# จิบนะ · Jibna

Water-tracker app (Thai) built with Expo SDK 58, TypeScript and Expo Router. Design source:
Figma file `NYfilO1UlnhguWYAgjB9Yw` ("💧Jibna – Water Tracker App").

## Run

Use Node 22 (`.nvmrc`); Node 23 is outside Expo's supported range.

```bash
nvm use
npm install
npx expo start          # press i (iOS simulator), a (Android) or w (web), or scan with Expo Go
```

## Checks

```bash
npm run typecheck       # tsc --noEmit
npm test                # pure domain logic (node --test)
npx expo-doctor
```

## Layout

- `src/app/` routes: onboarding (welcome, goal-setup, notifications), home, add-drink, day-log,
  calendar, reminders, goal-reached, settings, edit-goal.
- `src/components/` Figma components: Button, IconButton, Row/Toggle, Option, Sheet, Toast, Keypad,
  DrinkChip, Mascot/HydrationMascot, Wheel.
- `src/lib/hydration.ts` goal formula, drink table with hydration factors (one ABV formula for beer/liquor, see the table in the file),
  day totals (never below 0), streak, reminder times.
- `src/store/useJibna.ts` zustand store persisted to AsyncStorage.
- `src/assets/svg.ts` SVGs exported from Figma.
