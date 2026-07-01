'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getObrasSociales, crearPaciente } from '@/services/catalogo';
import { loginApi } from '@/services/auth';
import { validatePassword } from '@/utils/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card, { CardBody } from '@/components/ui/Card';

export default function RegistroPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [form, setForm] = useState({ nombre: '', dni: '', nombreUsuario: '', password: '', obraSocialId: '', planId: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getObrasSociales()
      .then(data => setObrasSociales(data.obrasSociales || data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const os = obrasSociales.find(o => o._id === form.obraSocialId);
    setPlanes(os?.planes || []);
    setForm(f => ({ ...f, planId: '' }));
  }, [form.obraSocialId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.dni.trim()) {
      e.dni = 'El DNI es requerido';
    } else if (!/^\d+$/.test(form.dni.trim())) {
      e.dni = 'El DNI debe contener solo números';
    } else if (Number(form.dni) <= 0) {
      e.dni = 'El DNI debe ser un número positivo';
    } else if (form.dni.trim().length < 7 || form.dni.trim().length > 8) {
      e.dni = 'El DNI debe tener 7 u 8 dígitos';
    }
    if (!form.nombreUsuario.trim()) e.nombreUsuario = 'El usuario es requerido';
    const pwdError = validatePassword(form.password);
    if (pwdError) e.password = pwdError;
    if (!form.obraSocialId) e.obraSocialId = 'Seleccioná una obra social';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await crearPaciente(form);
      const authData = await loginApi(form.nombreUsuario, form.password);
      login(authData);
      addToast('Cuenta creada correctamente', 'success');
      router.push('/mis-turnos');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const osOptions = obrasSociales.map(o => ({ value: o._id, label: o.nombre }));
  const planOptions = planes.map(p => ({ value: p._id, label: p.nombre }));

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Crear cuenta</h1>
        <p className="mt-2 text-gray-500">Completá tus datos para registrarte</p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input id="nombre" name="nombre" label="Nombre completo"
              placeholder="Juan Pérez" value={form.nombre}
              onChange={handleChange} error={errors.nombre} required />

            <Input id="dni" name="dni" label="DNI"
              placeholder="30123456" value={form.dni}
              onChange={handleChange} error={errors.dni} required />

            <Input id="nombreUsuario" name="nombreUsuario" label="Nombre de usuario"
              placeholder="juan.perez" value={form.nombreUsuario}
              onChange={handleChange} error={errors.nombreUsuario} required />

            <Input id="password" name="password" type="password" label="Contraseña"
              placeholder="••••••••" value={form.password}
              onChange={handleChange} error={errors.password} required />

            <Select id="obraSocialId" name="obraSocialId" label="Obra Social"
              options={osOptions} value={form.obraSocialId}
              onChange={handleChange} error={errors.obraSocialId}
              placeholder="Seleccioná una obra social" />

            {planOptions.length > 0 && (
              <Select id="planId" name="planId" label="Plan"
                options={planOptions} value={form.planId}
                onChange={handleChange}
                placeholder="Seleccioná un plan" />
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Crear cuenta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="font-medium text-coral-dark hover:text-[#C83444]">
              Iniciá sesión
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
