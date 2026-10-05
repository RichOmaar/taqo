import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'TableNow — Listas de espera para restaurantes',
  description:
    'Deja de gestionar tu fila en una libreta. Tus clientes se anotan con un QR, ven su turno desde el teléfono y reciben aviso cuando su mesa está lista.',
  openGraph: {
    title: 'TableNow — La fila de tu restaurante, digital y en tiempo real',
    description:
      'Tus clientes se anotan con un QR y reciben aviso cuando su mesa está lista. Empieza gratis.',
    locale: 'es_MX',
    type: 'website',
    siteName: 'TableNow',
  },
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
      <body>{children}</body>
    </html>
  );
}
