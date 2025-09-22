'use client';

import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer'
import SonnerProvider from '@/providers/SonnerProvider';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="light">
      <head>
        <title>Eventos ICM</title>
        <meta name="description" content="Sistema de gerenciamento de eventos da igreja" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16 min-h-screen bg-gray-50"> {/* Adicionado bg-gray-50 */}
            {children}
            <SonnerProvider />
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}