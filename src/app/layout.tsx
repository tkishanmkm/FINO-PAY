import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppBody from '@/components/AppBody';

export const metadata: Metadata = {
  title: 'FINO PAY',
  description: 'Your Digital Banking Partner',
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }, { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ rel: 'manifest', url: '/site.webmanifest' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="font-body antialiased">
        <AppBody>
          {children}
          <Toaster />
        </AppBody>
      </body>
    </html>
  );
}
