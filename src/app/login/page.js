'use client';
import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { loginApi } from '@/services/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardBody } from '@/components/ui/Card';
import Loader from '@/components/ui/Loader';

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreUsuario.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(nombreUsuario.trim(), password);
      login(data);
      const nombre = (data.paciente || data.medico)?.nombre?.split(' ')[0] || 'usuario';
      addToast(`Bienvenido, ${nombre}`, 'success');
      router.push(data.rol === 'medico' ? '/medico/turnos' : '/mis-turnos');
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader size="lg" /></div>;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6" style={{ animation: 'ticketIn 0.5s cubic-bezier(.21,1.1,.4,1) both' }}>
      <style>{`@keyframes ticketIn { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      <div className="mb-8 flex flex-col items-center gap-4">
        <Logo height={64} />
        <p className="text-gray-500">Ingresá con tu usuario y contraseña</p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Input
              id="nombreUsuario"
              label="Usuario"
              placeholder="Ingresá tu usuario"
              value={nombreUsuario}
              onChange={(e) => { setNombreUsuario(e.target.value); setError(''); }}
              required
              aria-required="true"
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="Ingresá tu contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              error={error}
              required
              aria-required="true"
            />

            <Button type="submit" loading={loading} className="w-full">
              Ingresar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tenés cuenta?{' '}
            <Link href="/registro" className="font-medium text-coral-dark hover:text-[#C83444]">
              Registrate
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
