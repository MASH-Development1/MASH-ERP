'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/protected/dashboard');
  }, [router]);

  return null;
}
