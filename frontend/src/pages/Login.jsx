import { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeSlash,
  SignIn,
  Truck,
  ShieldCheck,
  ChartLineUp,
  MapPin,
  ClockAfternoon,
  CheckCircle,
  GlobeHemisphereWest,
  Buildings
} from '@phosphor-icons/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.mensaje || 'Credenciales incorrectas o error en el servidor.');
        setLoading(false);
        return;
      }

      if (data.ok && data.usuario) {
        sessionStorage.setItem('cif_user', JSON.stringify(data.usuario));
        window.location.href = '/';
      } else {
        setError('Error al procesar la respuesta del servidor.');
      }
    } catch (err) {
      setError('Fallo de conexión con la API del servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-body relative overflow-hidden">
      {/* ── HERO SECTION (Izquierda: LIGHT MODE) ────────────────────────── */}
      <section className="relative w-full lg:w-1/2 min-h-[520px] lg:min-h-screen flex flex-col justify-between px-4 py-8 sm:px-8 sm:py-12 lg:p-16 xl:p-20 bg-[#fbfbfa] text-[#18181b] border-b lg:border-b-0 lg:border-r border-slate-200 shadow-sm z-10 overflow-hidden">
        {/* Glows y patrones de fondo en modo claro */}
        <div className="absolute top-[-10%] left-[-10%] w-[65%] h-[65%] bg-[#d1a14e]/12 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] bg-[#ecd7a8]/30 rounded-full blur-[110px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #916b25 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Contenedor central (100% centrado en móvil, elegante alineado a la izquierda en escritorio) */}
        <div className="w-full max-w-xl mx-auto my-auto relative z-10 py-6 lg:py-0 flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Encabezado de Identidad: Texto arriba del logo */}
          <div className="mb-8 sm:mb-10 w-full flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="mb-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#d1a14e]/15 border border-[#d1a14e]/30 text-xs font-bold text-[#8b6528] tracking-wide uppercase shadow-xs">
                <GlobeHemisphereWest size={15} weight="bold" />
                <span>Cruces Internacionales Fronterizos</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 block sm:inline">
                · Cd. Juárez / El Paso
              </span>
            </div>

            {/* Logo Protagónico Corporativo: Centrado y ocupando el ancho completo en móvil, justificado a la izquierda en desktop */}
            <div className="w-full flex justify-center lg:justify-start items-center lg:items-start">
              <div className="w-full lg:w-fit bg-white p-3 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all hover:shadow-[0_14px_45px_rgba(209,161,78,0.12)] flex items-center justify-center lg:justify-start">
                <img
                  src="/assets/logo-corporativo.png"
                  alt="Logo Corporativo CIF"
                  className="w-full sm:w-auto h-auto max-h-36 sm:max-h-48 lg:max-h-none lg:h-28 xl:h-32 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Título Principal y Descripción del Hero */}
          <div className="space-y-4 w-full text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] text-center lg:text-left">
              Control Integral de Transporte &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#916b25] via-[#b88937] to-[#d1a14e] inline-block sm:inline">
                Cruces Binacionales
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
              Plataforma tecnológica de gestión logística: administración de tractocamiones, cajas, viajes internacionales, cobranza y patio.
            </p>
          </div>

          {/* 3 Tarjetas de Métricas y Características (Centradas en móvil) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 w-full">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-[#d1a14e]/60 transition-all flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-[#916b25] mb-1.5 w-full">
                <Truck size={22} weight="duotone" />
                <span className="text-xs font-bold text-slate-900">Flota Activa</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal text-center lg:text-left">
                Tractos y cajas con trazabilidad continua.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-[#d1a14e]/60 transition-all flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-[#916b25] mb-1.5 w-full">
                <MapPin size={22} weight="duotone" />
                <span className="text-xs font-bold text-slate-900">Puentes & Peajes</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal text-center lg:text-left">
                Zaragoza, Córdova, Santa Teresa y Stanton.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-[#d1a14e]/60 transition-all flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-[#916b25] mb-1.5 w-full">
                <ChartLineUp size={22} weight="duotone" />
                <span className="text-xs font-bold text-slate-900">Cobranza Ágil</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal text-center lg:text-left">
                Pre-facturación y cruces validados al día.
              </p>
            </div>
          </div>
        </div>

        {/* Footer del Hero (Centrado en móvil) */}
        <div className="w-full max-w-xl mx-auto pt-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center lg:justify-between gap-3 border-t border-slate-200/90 relative z-10 text-center lg:text-left">
          <div className="flex items-center justify-center gap-2 text-center lg:text-left">
            <CheckCircle size={16} className="text-[#916b25] shrink-0" weight="fill" />
            <span className="font-medium text-slate-600">Plataforma Empresarial de Cruces Binacionales</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Sistema CIF v2.0</span>
        </div>
      </section>

      {/* ── LOGIN FORM SECTION (Derecha: DARK MODE) ─────────────────────── */}
      <section className="w-full lg:w-1/2 min-h-full flex flex-col justify-between px-4 py-8 sm:p-12 lg:p-16 xl:p-20 bg-[#09090c] text-[#e4e4e7] relative z-10 selection:bg-[#d1a14e]/30 selection:text-white">
        {/* Glows ambientales en modo oscuro */}
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#d1a14e]/6 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[5%] left-[-10%] w-[40%] h-[40%] bg-[#3d2b1f]/25 rounded-full blur-[110px] pointer-events-none" />

        {/* Contenedor central simétrico */}
        <div className="w-full max-w-md mx-auto my-auto py-6 lg:py-0 relative z-10">
          {/* Tarjeta de Formulario Oscura */}
          <div className="bg-[#111115]/95 border border-[#27272a] shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-6 sm:p-9 rounded-3xl backdrop-blur-xl relative">
            <div className="mb-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center justify-center gap-2 px-2.5 py-1 rounded-md bg-[#18181b] border border-[#27272a] text-[11px] font-medium text-[#a1a1aa] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d1a14e]" />
                Acceso Administrativo
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-center lg:text-left">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-1.5 leading-relaxed text-center lg:text-left">
                Ingresa tus credenciales corporativas para gestionar la operación.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs p-3.5 rounded-xl flex items-center justify-center text-center gap-2.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Correo */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium tracking-wide uppercase text-[#a1a1aa] text-center lg:text-left">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]">
                    <User size={18} weight="regular" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cif.mx"
                    className="w-full bg-[#070709] border border-[#27272a] focus:border-[#d1a14e] focus:ring-2 focus:ring-[#d1a14e]/20 text-sm py-3.5 pl-11 pr-4 rounded-xl outline-none transition-all placeholder-[#52525b] text-white"
                    required
                  />
                </div>
              </div>

              {/* Input Contraseña */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-between text-center lg:text-left gap-1">
                  <label className="block text-[11px] font-medium tracking-wide uppercase text-[#a1a1aa]">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-[#71717a] flex items-center justify-center gap-1">
                    <ClockAfternoon size={13} />
                    Sesión de 2 hrs
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]">
                    <Lock size={18} weight="regular" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#070709] border border-[#27272a] focus:border-[#d1a14e] focus:ring-2 focus:ring-[#d1a14e]/20 text-sm py-3.5 pl-11 pr-11 rounded-xl outline-none transition-all placeholder-[#52525b] text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Botón de Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#d1a14e] via-[#dfb15d] to-[#c79843] hover:from-[#c29443] hover:to-[#b88937] text-[#070709] font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-[#d1a14e]/20 flex items-center justify-center gap-2 mt-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#070709] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <SignIn size={18} weight="bold" />
                    <span>Entrar a la Plataforma</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer del Formulario */}
        <div className="w-full max-w-md mx-auto text-center pt-6 relative z-10 border-t border-[#1e1e24] lg:border-t-0">
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#71717a] mb-1">
            <ShieldCheck size={14} className="text-[#d1a14e]" weight="bold" />
            <span>Conexión Cifrada SSL & Acceso Restringido</span>
          </div>
          <p className="text-[10px] text-[#52525b]">
            © 2026 CIF Logística · Cruces Internacionales Fronterizos
          </p>
        </div>
      </section>
    </div>
  );
}
