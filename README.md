# จิบนะ · Jibna

Water-tracker app (Thai) built with Expo SDK 58, TypeScript and Expo Router. Design source:
Figma file `NYfilO1UlnhguWYAgjB9Yw` ("💧Jibna – Water Tracker App").

## Run

Use Node 22 (`.nvmrc`); Node 23 is outside Expo's supported range.

```bash
nvm use
npm install
npx expo run:ios        # development build on a simulator or device (first time, or after native changes)
npx expo start          # then just the dev server; press i / a / w
```

Use a development build, not Expo Go: Expo Go ignores the app's native config (name จิบนะ, icon,
splash, notification settings).

`ios/` and `android/` are generated (Continuous Native Generation) and git-ignored. **Never edit them
by hand**: anything native (entitlements, Info.plist, display name, plugins) goes in `app.json`, or it
is lost on the next `npx expo prebuild --clean`.

## Checks

```bash
npm run typecheck       # tsc --noEmit
npm test                # pure domain logic (node --test)
npm run lint            # expo lint
npx expo-doctor
```

## Layout

- `src/app/` routes: onboarding (welcome, goal-setup, notifications), home, add-drink, day-log,
  calendar, reminders, goal-reached, settings, edit-goal, drinks, backup, help, privacy.
- `src/components/` Figma components: Button, IconButton, Row/Toggle, Option, Sheet, Toast, Keypad,
  DrinkChip, DrinkGrid, Mascot, PlayfulMascot, Vessel, SizePicker, MixSelector, Wheel, WhenPicker.
- `src/lib/hydration.ts` pure domain logic: goal formula, drink table (one ABV formula for
  beer/liquor, value table in the file), mixers, day totals (never below 0), streak, goal history,
  daily challenges, reminder schedule, backup format, history compaction. Tested by `npm test`.
- `src/lib/notifications.ts` local reminder scheduling (no push).
- `src/store/useJibna.ts` zustand store persisted to AsyncStorage; `STORE_VERSION` + `migrateState`.
- `src/assets/svg.ts` SVGs exported from Figma.
