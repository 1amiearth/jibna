import { Redirect } from 'expo-router';

import { useJibna } from '@/store/useJibna';

export default function Index() {
  const onboarded = useJibna((s) => s.onboarded);
  return <Redirect href={onboarded ? '/home' : '/onboarding/welcome'} />;
}
