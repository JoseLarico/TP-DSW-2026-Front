import { Geist } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { PreseleccionProvider } from '@/context/PreseleccionContext';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata = {
  title: 'Sweet Medical',
  description: 'Plataforma de gestión de turnos médicos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-gray-50 font-sans antialiased">
        <AuthProvider>
        <ToastProvider>
          <PreseleccionProvider>
          <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
          
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
            Sweet Medical &copy; {new Date().getFullYear()}
          </footer>
          </PreseleccionProvider>
        </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
