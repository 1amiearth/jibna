import { router } from 'expo-router';

/** `router.back()`, or the start screen when there's nothing to go back to (web reload, deep link). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
