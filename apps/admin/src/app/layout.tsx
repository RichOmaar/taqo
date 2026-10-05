import { SessionProvider } from '@nexa/api-client/react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const metadata: Metadata = {
  title: 'Nexa — Panel del restaurante',
  description: 'Configura tu restaurante y consulta tus métricas.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider baseUrl={API_URL}>{children}</SessionProvider>
      </body>
    </html>
  );
}
