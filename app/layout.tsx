import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Mingo Quiniela — NFL Pick’em',
  description:
    'Your private NFL pick’em league. Pick winners, follow your crew, and own Sunday.',
  manifest: '/manifest.webmanifest',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#123e35" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const saved=localStorage.getItem('sunday-club-theme');const theme=saved||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
