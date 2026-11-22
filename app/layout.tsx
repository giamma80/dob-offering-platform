import type { Metadata } from 'next';
import { lingua } from '@/lib/i18n/server';
import { LinguaProvider } from '@/lib/i18n/client';
import '@fontsource/metropolis/400.css';
import '@fontsource/metropolis/500.css';
import '@fontsource/metropolis/600.css';
import '@fontsource/metropolis/700.css';
import '@fontsource/metropolis/800.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/app.css';

export const metadata: Metadata = {
  title: 'DOB Offering Platform',
  robots: { index: false, follow: false },
  icons: { icon: '/alten-mark.png' }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const l = await lingua();
  return (
    <html lang={l}>
      <body><LinguaProvider lingua={l}>{children}</LinguaProvider></body>
    </html>
  );
}
