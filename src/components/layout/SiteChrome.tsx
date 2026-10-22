'use client';

import { usePathname } from 'next/navigation';

/** Hides the public site's header/footer/CTAs on the admin pages. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith('/dashboard') || path.startsWith('/admin-login') ? null : <>{children}</>;
}
